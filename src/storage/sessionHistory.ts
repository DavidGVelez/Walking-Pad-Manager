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
