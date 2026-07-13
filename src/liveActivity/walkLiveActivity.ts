import * as LiveActivity from 'expo-live-activity';

export type WalkActivityState = {
  elapsedSeconds: number;
  speedKmh: number;
  distanceMeters: number;
  isPaused: boolean;
};

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function formatState(state: WalkActivityState): LiveActivity.LiveActivityState {
  const distanceKm = (state.distanceMeters / 1000).toFixed(2);
  const speed = state.speedKmh.toFixed(1);

  return {
    title: state.isPaused ? 'Caminata en pausa' : 'Caminata en curso',
    subtitle: `${formatElapsed(state.elapsedSeconds)} · ${speed} km/h · ${distanceKm} km`,
    // Without this, the Dynamic Island's compact/minimal presentations render
    // empty (they only show content when an image or a countdown date is
    // set) - the expanded view already shows title/subtitle regardless.
    dynamicIslandImageName: 'dynamic_island_icon',
  };
}

export function startWalkActivity(state: WalkActivityState): string | null {
  try {
    return LiveActivity.startActivity(formatState(state)) ?? null;
  } catch (error) {
    console.log('[LiveActivity] start failed', error instanceof Error ? error.message : error);
    return null;
  }
}

export function updateWalkActivity(id: string, state: WalkActivityState) {
  try {
    LiveActivity.updateActivity(id, formatState(state));
  } catch (error) {
    console.log('[LiveActivity] update failed', error instanceof Error ? error.message : error);
  }
}

export function stopWalkActivity(id: string, state: WalkActivityState) {
  try {
    LiveActivity.stopActivity(id, formatState(state));
  } catch (error) {
    console.log('[LiveActivity] stop failed', error instanceof Error ? error.message : error);
  }
}
