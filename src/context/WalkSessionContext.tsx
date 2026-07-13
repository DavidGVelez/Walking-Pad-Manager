import { Alert } from 'react-native';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useWalkingPadBleContext } from './WalkingPadBleContext';
import { saveSession, WalkSession } from '../storage/sessionHistory';

export const minSpeedKmh = 2;
export const maxSpeedKmh = 6;
export const speedStepKmh = 0.1;
const startingSpeedKmh = 2;
const caloriesPerMinute = 5.5;
const metersPerStep = 0.75;
// Fallback only used when there's no connected treadmill to report real data:
// simulates the motor ramp-up delay so the timer doesn't start instantly.
const fakeMotorWarmupMs = 3000;
// After a stop command the belt decelerates rather than halting instantly;
// wait for the treadmill to report speed 0 before leaving the screen, capped
// so we never get stuck here if it never reports back down to 0.
const beltStopPollIntervalMs = 200;
const beltStopMaxWaitMs = 15000;
// A session is only treated as "reset externally" once it has run for more
// than this long, so a single noisy 0 reading right after starting doesn't
// look like a stop.
const minSecondsBeforeExternalStopDetection = 3;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type WalkSessionContextValue = {
  isActive: boolean;
  isPaused: boolean;
  isWarmingUp: boolean;
  elapsedSeconds: number;
  speedKmh: number;
  distanceMeters: number;
  caloriesKcal: number;
  steps: number;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Promise<void>;
  updateSpeed: (delta: number) => void;
};

const WalkSessionContext = createContext<WalkSessionContextValue | null>(null);

export function WalkSessionProvider({ children }: { children: ReactNode }) {
  const { connectedDevice, liveTreadmillData, requestControl, setTargetSpeed, startOrResume, stopOrPause } =
    useWalkingPadBleContext();

  // Local simulation: used when there's no connected treadmill, and as a
  // resilient fallback for whichever fields the treadmill doesn't report.
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFakeWarmingUp, setIsFakeWarmingUp] = useState(false);
  const [simulatedElapsedSeconds, setSimulatedElapsedSeconds] = useState(0);
  const [simulatedSpeedKmh, setSimulatedSpeedKmh] = useState(startingSpeedKmh);
  const [simulatedDistanceMeters, setSimulatedDistanceMeters] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const maxSpeedRef = useRef(startingSpeedKmh);
  const speedRef = useRef(startingSpeedKmh);
  const warmupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveTreadmillDataRef = useRef(liveTreadmillData);
  const isManualStoppingRef = useRef(false);
  const previousTreadmillDataRef = useRef(liveTreadmillData);
  // Guards against the belt's deceleration blip (a stray active reading right
  // after it reports stopped) being mistaken for a brand new session - see
  // PRO-49, where that produced two saved rows for one real walk.
  const lastStoppedAtRef = useRef<number | null>(null);

  useEffect(() => {
    liveTreadmillDataRef.current = liveTreadmillData;
  }, [liveTreadmillData]);

  const hasLiveData = Boolean(connectedDevice && liveTreadmillData);

  const isWarmingUp = hasLiveData
    ? isActive && !isPaused && (liveTreadmillData?.elapsedSeconds ?? 0) === 0
    : isFakeWarmingUp;

  const elapsedSeconds = hasLiveData ? liveTreadmillData?.elapsedSeconds ?? simulatedElapsedSeconds : simulatedElapsedSeconds;
  const distanceMeters = hasLiveData ? liveTreadmillData?.distanceMeters ?? simulatedDistanceMeters : simulatedDistanceMeters;
  // Optimistic: show the speed we've commanded, not the motor's real (ramping)
  // speed - the belt takes a moment to physically catch up and echoing that
  // lag back in the UI makes +/- feel unresponsive.
  const speedKmh = simulatedSpeedKmh;
  const caloriesKcal = hasLiveData
    ? liveTreadmillData?.caloriesKcal ?? Math.round((elapsedSeconds / 60) * caloriesPerMinute)
    : Math.round((elapsedSeconds / 60) * caloriesPerMinute);
  const steps = Math.round(distanceMeters / metersPerStep);

  const clearWarmupTimeout = () => {
    if (warmupTimeoutRef.current) {
      clearTimeout(warmupTimeoutRef.current);
      warmupTimeoutRef.current = null;
    }
  };

  const beginFakeWarmup = () => {
    clearWarmupTimeout();
    setIsFakeWarmingUp(true);
    warmupTimeoutRef.current = setTimeout(() => setIsFakeWarmingUp(false), fakeMotorWarmupMs);
  };

  useEffect(() => clearWarmupTimeout, []);

  useEffect(() => {
    speedRef.current = simulatedSpeedKmh;

    if (simulatedSpeedKmh > maxSpeedRef.current) {
      maxSpeedRef.current = simulatedSpeedKmh;
    }
  }, [simulatedSpeedKmh]);

  useEffect(() => {
    if (liveTreadmillData?.speedKmh && liveTreadmillData.speedKmh > maxSpeedRef.current) {
      maxSpeedRef.current = liveTreadmillData.speedKmh;
    }
  }, [liveTreadmillData]);

  // Keeps ticking the local simulation even while connected, so tracking
  // degrades gracefully if the treadmill stops sending live notifications.
  useEffect(() => {
    if (!isActive || isPaused || isWarmingUp) {
      return;
    }

    const interval = setInterval(() => {
      setSimulatedElapsedSeconds((seconds) => seconds + 1);
      setSimulatedDistanceMeters((meters) => meters + speedRef.current / 3.6);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, isWarmingUp]);

  // Saves the session to history. Shared by the manual "Finalizar" flow and by
  // auto-detection of a stop triggered outside the app (physical panel,
  // another app...). Guards against running twice for the same session.
  const persistSession = useCallback(
    async (finalDurationSeconds: number, finalDistanceMeters: number, finalCaloriesKcal: number | null) => {
      const startedAt = startedAtRef.current;

      if (!startedAt) {
        return;
      }

      startedAtRef.current = null;

      const averageSpeedKmh =
        finalDurationSeconds > 0
          ? Number((finalDistanceMeters / 1000 / (finalDurationSeconds / 3600)).toFixed(1))
          : 0;

      const session: WalkSession = {
        id: `session-${startedAt}`,
        startedAt,
        endedAt: Date.now(),
        durationSeconds: finalDurationSeconds,
        distanceMeters: Math.round(finalDistanceMeters),
        averageSpeedKmh,
        maxSpeedKmh: maxSpeedRef.current,
        caloriesKcal: finalCaloriesKcal ?? Math.round((finalDurationSeconds / 60) * caloriesPerMinute),
      };

      try {
        await saveSession(session);
        setIsActive(false);
        setIsPaused(false);
        lastStoppedAtRef.current = Date.now();
      } catch (error) {
        startedAtRef.current = startedAt;
        Alert.alert(
          'No se pudo guardar la sesion',
          error instanceof Error ? error.message : 'Error desconocido. Puedes intentarlo de nuevo.',
        );
        throw error;
      }
    },
    [],
  );

  // Adapts to the treadmill being controlled outside the app: if it starts
  // moving while we think we're idle, start tracking; if its own counters
  // reset to zero while we think we're active, treat that as a stop and save.
  useEffect(() => {
    if (!connectedDevice || !liveTreadmillData) {
      // The treadmill can't tell us it stopped if the connection itself just
      // dropped (e.g. powered off mid-walk), so treat losing live data while
      // active as the stop signal, using the last values we saw.
      const previous = previousTreadmillDataRef.current;

      if (isActive && !isManualStoppingRef.current && previous) {
        console.log('[FTMS] connection lost mid-session, finalizing with last known data');
        persistSession(previous.elapsedSeconds ?? 0, previous.distanceMeters ?? 0, previous.caloriesKcal ?? null).catch(
          () => {},
        );
      }

      previousTreadmillDataRef.current = liveTreadmillData;
      return;
    }

    const previous = previousTreadmillDataRef.current;
    const currentElapsed = liveTreadmillData.elapsedSeconds ?? 0;
    const currentSpeed = liveTreadmillData.speedKmh ?? 0;

    // The belt can report one stray active reading while decelerating right
    // after a stop, before settling at 0 - without this guard that blip gets
    // read as a brand new session (PRO-49).
    const justStopped =
      lastStoppedAtRef.current !== null && Date.now() - lastStoppedAtRef.current < beltStopMaxWaitMs;

    if (!isActive && !justStopped && (currentElapsed > 0 || currentSpeed > 0)) {
      startedAtRef.current = Date.now() - currentElapsed * 1000;

      const startingObservedSpeed = currentSpeed > 0 ? currentSpeed : startingSpeedKmh;
      speedRef.current = startingObservedSpeed;
      setSimulatedSpeedKmh(startingObservedSpeed);

      if (currentSpeed > maxSpeedRef.current) {
        maxSpeedRef.current = currentSpeed;
      }

      setIsPaused(false);
      setIsActive(true);
      console.log('[FTMS] session detected running outside the app');
    } else if (
      isActive &&
      !isManualStoppingRef.current &&
      previous &&
      (previous.elapsedSeconds ?? 0) > minSecondsBeforeExternalStopDetection &&
      currentElapsed === 0 &&
      currentSpeed === 0
    ) {
      console.log('[FTMS] session detected stopped outside the app');
      persistSession(previous.elapsedSeconds ?? 0, previous.distanceMeters ?? 0, previous.caloriesKcal ?? null).catch(
        () => {},
      );
    }

    previousTreadmillDataRef.current = liveTreadmillData;
  }, [connectedDevice, isActive, liveTreadmillData, persistSession]);

  const startSession = useCallback(() => {
    startedAtRef.current = Date.now();
    maxSpeedRef.current = startingSpeedKmh;
    speedRef.current = startingSpeedKmh;
    setSimulatedSpeedKmh(startingSpeedKmh);
    setSimulatedElapsedSeconds(0);
    setSimulatedDistanceMeters(0);
    setIsPaused(false);
    setIsActive(true);

    if (connectedDevice) {
      beginFakeWarmup();

      (async () => {
        try {
          await requestControl();
          await setTargetSpeed(startingSpeedKmh);
          await startOrResume();
          console.log('[FTMS] start command sent');
        } catch (error) {
          console.log('[FTMS] start command failed', error instanceof Error ? error.message : error);
        }
      })();
    }
  }, [connectedDevice, requestControl, setTargetSpeed, startOrResume]);

  const pauseSession = useCallback(() => {
    clearWarmupTimeout();
    setIsFakeWarmingUp(false);
    setIsPaused(true);

    if (connectedDevice) {
      stopOrPause('pause').catch((error) =>
        console.log('[FTMS] pause command failed', error instanceof Error ? error.message : error),
      );
    }
  }, [connectedDevice, stopOrPause]);

  const resumeSession = useCallback(() => {
    setIsPaused(false);

    if (connectedDevice) {
      beginFakeWarmup();
      startOrResume().catch((error) =>
        console.log('[FTMS] resume command failed', error instanceof Error ? error.message : error),
      );
    }
  }, [connectedDevice, startOrResume]);

  const updateSpeed = useCallback(
    (delta: number) => {
      const nextSpeed = Number(
        Math.min(maxSpeedKmh, Math.max(minSpeedKmh, speedRef.current + delta)).toFixed(1),
      );
      speedRef.current = nextSpeed;

      if (nextSpeed > maxSpeedRef.current) {
        maxSpeedRef.current = nextSpeed;
      }

      setSimulatedSpeedKmh(nextSpeed);

      if (connectedDevice) {
        setTargetSpeed(nextSpeed).catch((error) =>
          console.log('[FTMS] set speed failed', error instanceof Error ? error.message : error),
        );
      }
    },
    [connectedDevice, setTargetSpeed],
  );

  const stopSession = useCallback(async () => {
    if (!startedAtRef.current) {
      return;
    }

    isManualStoppingRef.current = true;
    clearWarmupTimeout();
    setIsFakeWarmingUp(false);
    setIsPaused(true);

    const finalDurationSeconds = elapsedSeconds;
    const finalDistanceMeters = distanceMeters;
    const finalCaloriesKcal = hasLiveData && liveTreadmillData?.caloriesKcal != null ? liveTreadmillData.caloriesKcal : null;

    if (connectedDevice) {
      try {
        await stopOrPause('stop');
      } catch (error) {
        console.log('[FTMS] stop command failed', error instanceof Error ? error.message : error);
      }

      const deadline = Date.now() + beltStopMaxWaitMs;

      while (Date.now() < deadline) {
        const currentSpeed = liveTreadmillDataRef.current?.speedKmh;

        if (currentSpeed == null || currentSpeed <= 0) {
          break;
        }

        await wait(beltStopPollIntervalMs);
      }
    }

    try {
      await persistSession(finalDurationSeconds, finalDistanceMeters, finalCaloriesKcal);
    } finally {
      isManualStoppingRef.current = false;
    }
  }, [connectedDevice, distanceMeters, elapsedSeconds, hasLiveData, liveTreadmillData, persistSession, stopOrPause]);

  return (
    <WalkSessionContext.Provider
      value={{
        caloriesKcal,
        distanceMeters,
        elapsedSeconds,
        isActive,
        isPaused,
        isWarmingUp,
        pauseSession,
        resumeSession,
        speedKmh,
        startSession,
        steps,
        stopSession,
        updateSpeed,
      }}
    >
      {children}
    </WalkSessionContext.Provider>
  );
}

export function useWalkSession() {
  const context = useContext(WalkSessionContext);

  if (!context) {
    throw new Error('useWalkSession must be used within a WalkSessionProvider');
  }

  return context;
}
