import { WalkSession } from './sessionHistory';

export type DailyTotal = {
  dateKey: string;
  distanceMeters: number;
  durationSeconds: number;
  sessionCount: number;
};

export type HeatmapDay = {
  dateKey: string;
  level: number;
  durationSeconds: number;
  distanceMeters: number;
} | null;

export function toDateKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function groupSessionsByDay(sessions: WalkSession[]): Map<string, DailyTotal> {
  const totals = new Map<string, DailyTotal>();

  for (const session of sessions) {
    const dateKey = toDateKey(session.startedAt);
    const existing = totals.get(dateKey);
    totals.set(dateKey, {
      dateKey,
      distanceMeters: (existing?.distanceMeters ?? 0) + (session.distanceMeters ?? 0),
      durationSeconds: (existing?.durationSeconds ?? 0) + session.durationSeconds,
      sessionCount: (existing?.sessionCount ?? 0) + 1,
    });
  }

  return totals;
}

export function getRecentDays(count: number, endDate: Date = new Date()): string[] {
  const days: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    date.setDate(date.getDate() - offset);
    days.push(toDateKey(date.getTime()));
  }

  return days;
}

// Buckets are relative to the walker's own history (like GitHub's contribution
// graph) rather than fixed minute thresholds, so the scale adapts to how much
// this person typically walks.
export function computeDurationThresholds(dailyTotals: DailyTotal[]): [number, number, number] {
  const durations = dailyTotals
    .map((day) => day.durationSeconds)
    .filter((duration) => duration > 0)
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return [600, 1200, 1800];
  }

  const percentile = (p: number) =>
    durations[Math.min(durations.length - 1, Math.floor(p * (durations.length - 1)))];

  return [percentile(0.33), percentile(0.66), percentile(0.9)];
}

export function getActivityLevel(durationSeconds: number, thresholds: [number, number, number]): number {
  if (durationSeconds <= 0) return 0;
  if (durationSeconds >= thresholds[2]) return 4;
  if (durationSeconds >= thresholds[1]) return 3;
  if (durationSeconds >= thresholds[0]) return 2;
  return 1;
}

export function buildHeatmapWeeks(
  dailyTotals: Map<string, DailyTotal>,
  weeksCount: number,
  today: Date = new Date(),
): HeatmapDay[][] {
  const thresholds = computeDurationThresholds(Array.from(dailyTotals.values()));
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const endWeekday = (endDate.getDay() + 6) % 7; // Mon=0 .. Sun=6
  const gridEnd = new Date(endDate);
  gridEnd.setDate(gridEnd.getDate() + (6 - endWeekday));

  const totalCells = weeksCount * 7;
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - (totalCells - 1));

  const weeks: HeatmapDay[][] = [];
  const cursor = new Date(gridStart);

  for (let week = 0; week < weeksCount; week += 1) {
    const column: HeatmapDay[] = [];

    for (let day = 0; day < 7; day += 1) {
      if (cursor > endDate) {
        column.push(null);
      } else {
        const dateKey = toDateKey(cursor.getTime());
        const total = dailyTotals.get(dateKey);
        column.push({
          dateKey,
          level: total ? getActivityLevel(total.durationSeconds, thresholds) : 0,
          durationSeconds: total?.durationSeconds ?? 0,
          distanceMeters: total?.distanceMeters ?? 0,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(column);
  }

  return weeks;
}
