import AsyncStorage from '@react-native-async-storage/async-storage';

export type WalkSession = {
  id: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  distanceMeters: number | null;
  averageSpeedKmh: number | null;
  maxSpeedKmh: number | null;
  caloriesKcal: number | null;
};

const STORAGE_KEY = '@walking-pad-manager/sessions';

export async function loadSessions(): Promise<WalkSession[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  return JSON.parse(raw) as WalkSession[];
}

export async function saveSession(session: WalkSession): Promise<WalkSession[]> {
  const sessions = await loadSessions();
  const nextSessions = [session, ...sessions];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  return nextSessions;
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// Dev-only helper to populate believable session history for visually testing
// the charts. Skips a couple of days so the activity heatmap shows rest days too.
export async function seedMockSessions(days: number = 10): Promise<WalkSession[]> {
  await clearSessions();

  const restDayOffsets = new Set([2, 5, 9]);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    if (restDayOffsets.has(offset)) {
      continue;
    }

    const startedAt = now - offset * dayMs;
    const durationSeconds = 900 + Math.round(Math.random() * 1800);
    const distanceMeters = Math.round(800 + Math.random() * 3200);
    const averageSpeedKmh = Number((distanceMeters / 1000 / (durationSeconds / 3600)).toFixed(1));
    const maxSpeedKmh = Number((averageSpeedKmh + 0.5 + Math.random()).toFixed(1));
    const caloriesKcal = Math.round((durationSeconds / 60) * 5.5);

    await saveSession({
      id: `mock-${startedAt}`,
      startedAt,
      endedAt: startedAt + durationSeconds * 1000,
      durationSeconds,
      distanceMeters,
      averageSpeedKmh,
      maxSpeedKmh,
      caloriesKcal,
    });
  }

  return loadSessions();
}
