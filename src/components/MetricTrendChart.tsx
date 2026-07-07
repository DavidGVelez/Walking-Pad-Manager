import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WalkSession } from '../storage/sessionHistory';
import { DailyTotal, getRecentDays, groupSessionsByDay, parseDateKey } from '../storage/sessionStats';
import { theme } from '../theme';

const DAYS_COUNT = 14;
const CHART_HEIGHT = 140;
const dayLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

type Props = {
  sessions: WalkSession[];
  unit: string;
  getDailyValue: (total: DailyTotal) => number;
  formatValue: (value: number) => string;
};

export function MetricTrendChart({ sessions, unit, getDailyValue, formatValue }: Props) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const days = useMemo(() => {
    const dailyTotals = groupSessionsByDay(sessions);

    return getRecentDays(DAYS_COUNT).map((dateKey) => {
      const total = dailyTotals.get(dateKey);
      return {
        dateKey,
        value: total ? getDailyValue(total) : 0,
        weekday: dayLetters[parseDateKey(dateKey).getDay()],
      };
    });
  }, [sessions, getDailyValue]);

  const maxValue = Math.max(...days.map((day) => day.value), 1);
  const hasActivity = days.some((day) => day.value > 0);
  const peakIndex = days.reduce((peak, day, index) => (day.value > days[peak].value ? index : peak), 0);
  const selectedDay = days.find((day) => day.dateKey === selectedDateKey) ?? null;
  const todayKey = days[days.length - 1]?.dateKey;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tendencia</Text>
        <Text style={styles.subtitle}>Ultimos {DAYS_COUNT} dias</Text>
      </View>

      {hasActivity ? (
        <>
          <View style={styles.chart}>
            {days.map((day, index) => {
              const barHeight = Math.max(2, (day.value / maxValue) * CHART_HEIGHT);
              const isPeak = index === peakIndex && day.value > 0;

              return (
                <Pressable
                  accessibilityLabel={`${formatValue(day.value)} ${unit}`}
                  accessibilityRole="button"
                  key={day.dateKey}
                  onPress={() => setSelectedDateKey(day.dateKey)}
                  style={styles.column}
                >
                  <View style={styles.labelSlot}>
                    {isPeak ? <Text style={styles.peakLabel}>{formatValue(day.value)}</Text> : null}
                  </View>
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.bar,
                        { height: barHeight },
                        day.dateKey === selectedDateKey && styles.barSelected,
                      ]}
                    />
                  </View>
                  <Text style={[styles.axisLabel, day.dateKey === todayKey && styles.axisLabelToday]}>
                    {day.weekday}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.caption}>
            {selectedDay ? `${formatValue(selectedDay.value)} ${unit}` : 'Toca un dia para ver el detalle'}
          </Text>
        </>
      ) : (
        <Text style={styles.emptyText}>Registra una sesion para ver tu progreso aqui.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  headerRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 12,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.xs,
  },
  labelSlot: {
    height: 16,
    justifyContent: 'flex-end',
  },
  peakLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  track: {
    alignItems: 'center',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    width: 16,
  },
  barSelected: {
    backgroundColor: theme.colors.text,
  },
  axisLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  axisLabelToday: {
    color: theme.colors.primary,
  },
  caption: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
