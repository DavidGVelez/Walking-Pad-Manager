import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_DAILY_GOAL_MINUTES = 30;
export const MIN_DAILY_GOAL_MINUTES = 10;
export const MAX_DAILY_GOAL_MINUTES = 120;
export const DAILY_GOAL_STEP_MINUTES = 5;

function storageKey(userId: string) {
  return `daily_goal_minutes:${userId}`;
}

export async function getDailyGoalMinutes(userId: string): Promise<number> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_DAILY_GOAL_MINUTES;
}

export async function saveDailyGoalMinutes(userId: string, minutes: number): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), String(minutes));
}
