import { supabase } from './supabaseClient';

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

const TABLE = 'walk_sessions';

type WalkSessionRow = {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  distance_meters: number | null;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;
  calories_kcal: number | null;
};

function toWalkSession(row: WalkSessionRow): WalkSession {
  return {
    id: row.id,
    startedAt: new Date(row.started_at).getTime(),
    endedAt: new Date(row.ended_at).getTime(),
    durationSeconds: row.duration_seconds,
    distanceMeters: row.distance_meters,
    averageSpeedKmh: row.average_speed_kmh,
    maxSpeedKmh: row.max_speed_kmh,
    caloriesKcal: row.calories_kcal,
  };
}

function toWalkSessionRow(session: WalkSession): WalkSessionRow {
  return {
    id: session.id,
    started_at: new Date(session.startedAt).toISOString(),
    ended_at: new Date(session.endedAt).toISOString(),
    duration_seconds: session.durationSeconds,
    distance_meters: session.distanceMeters,
    average_speed_kmh: session.averageSpeedKmh,
    max_speed_kmh: session.maxSpeedKmh,
    calories_kcal: session.caloriesKcal,
  };
}

export async function loadSessions(): Promise<WalkSession[]> {
  const { data, error } = await supabase.from(TABLE).select('*').order('started_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toWalkSession);
}

export async function saveSession(session: WalkSession): Promise<WalkSession[]> {
  const { error } = await supabase.from(TABLE).insert(toWalkSessionRow(session));

  if (error) {
    throw error;
  }

  return loadSessions();
}

export async function clearSessions(): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().not('id', 'is', null);

  if (error) {
    throw error;
  }
}

// Dev-only helper to populate believable session history for visually testing
// the charts. Skips a couple of days so the activity heatmap shows rest days too.
export async function seedMockSessions(days: number = 10): Promise<WalkSession[]> {
  await clearSessions();

  const restDayOffsets = new Set([2, 5, 9]);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const sessions: WalkSession[] = [];

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

    sessions.push({
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

  const { error } = await supabase.from(TABLE).insert(sessions.map(toWalkSessionRow));

  if (error) {
    throw error;
  }

  return loadSessions();
}
