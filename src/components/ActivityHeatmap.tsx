import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { WalkSession } from '../storage/sessionHistory';
import { buildHeatmapWeeks, groupSessionsByDay, HeatmapDay, parseDateKey } from '../storage/sessionStats';
import { theme } from '../theme';

const WEEKS_COUNT = 26;
const CELL_SIZE = 14;
const CELL_GAP = 3;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const MONTH_ROW_HEIGHT = 16;

// Sequential ramp on the app's primary blue, level 0..4 low to high activity.
// Validated with scripts/validate_palette.js --ordinal against the app's dark surface.
const levelColors = [theme.colors.surfaceMuted, '#1d4f74', '#1580b8', theme.colors.primary, '#7dd3fc'];

const monthLabels = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dayLabels = ['L', '', 'X', '', 'V', '', ''];

function formatFullDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

type Props = {
  sessions: WalkSession[];
};

export function ActivityHeatmap({ sessions }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay>(null);

  const weeks = useMemo(() => {
    const dailyTotals = groupSessionsByDay(sessions);
    return buildHeatmapWeeks(dailyTotals, WEEKS_COUNT);
  }, [sessions]);

  const monthLabelNodes = useMemo(() => {
    let gapWeeks = 0;

    return weeks.map((week, weekIndex) => {
      const firstRealDay = week.find((day) => day !== null);
      const previousFirstDay = weekIndex > 0 ? weeks[weekIndex - 1].find((day) => day !== null) : null;
      const currentMonth = firstRealDay ? parseDateKey(firstRealDay.dateKey).getMonth() : null;
      const previousMonth = previousFirstDay ? parseDateKey(previousFirstDay.dateKey).getMonth() : null;
      const showLabel = currentMonth !== null && currentMonth !== previousMonth;

      if (!showLabel) {
        gapWeeks += 1;
        return null;
      }

      const marginLeft = gapWeeks * CELL_STEP;
      gapWeeks = 0;

      return (
        <Text key={weekIndex} numberOfLines={1} style={[styles.monthLabel, { marginLeft }]}>
          {monthLabels[currentMonth as number]}
        </Text>
      );
    });
  }, [weeks]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Constancia</Text>
        <Text style={styles.subtitle}>Ultimas {WEEKS_COUNT} semanas</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.dayLabelColumn}>
          <View style={styles.monthRowSpacer} />
          {dayLabels.map((label, index) => (
            <Text key={index} style={styles.dayLabel}>
              {label}
            </Text>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          horizontal
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
        >
          <View>
            <View style={styles.monthRow}>{monthLabelNodes}</View>

            <View style={styles.gridRow}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekColumn}>
                  {week.map((day, dayIndex) => {
                    const isSelected = Boolean(day && selectedDay?.dateKey === day.dateKey);

                    return (
                      <Pressable
                        accessibilityLabel={
                          day
                            ? `${formatFullDate(day.dateKey)}, ${day.durationSeconds > 0 ? 'con actividad' : 'sin actividad'}`
                            : undefined
                        }
                        accessibilityRole={day ? 'button' : undefined}
                        disabled={!day}
                        key={dayIndex}
                        onPress={() => setSelectedDay(day)}
                        style={[styles.cell, isSelected && styles.cellRingSelected]}
                      >
                        <View
                          style={[
                            styles.cellFill,
                            isSelected && styles.cellFillSelected,
                            { backgroundColor: day ? levelColors[day.level] : 'transparent' },
                          ]}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <Text style={styles.caption}>
        {selectedDay
          ? selectedDay.durationSeconds > 0
            ? `${formatFullDate(selectedDay.dateKey)} · ${(selectedDay.distanceMeters / 1000).toFixed(2)} km · ${Math.round(selectedDay.durationSeconds / 60)} min`
            : `${formatFullDate(selectedDay.dateKey)} · sin actividad`
          : 'Toca un dia para ver el detalle'}
      </Text>

      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>Menos</Text>
        {levelColors.map((color, index) => (
          <View key={index} style={[styles.legendSwatch, { backgroundColor: color }]} />
        ))}
        <Text style={styles.legendLabel}>Mas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
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
  body: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  monthRowSpacer: {
    height: MONTH_ROW_HEIGHT,
  },
  monthRow: {
    flexDirection: 'row',
    height: MONTH_ROW_HEIGHT,
  },
  monthLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
  },
  dayLabelColumn: {
    gap: CELL_GAP,
    marginRight: 6,
    width: 16,
  },
  dayLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    height: CELL_SIZE,
    lineHeight: CELL_SIZE,
  },
  weekColumn: {
    gap: CELL_GAP,
    marginRight: CELL_GAP,
  },
  cell: {
    alignItems: 'center',
    height: CELL_SIZE,
    justifyContent: 'center',
    width: CELL_SIZE,
  },
  cellFill: {
    borderRadius: 3,
    height: '100%',
    width: '100%',
  },
  cellRingSelected: {
    backgroundColor: theme.colors.text,
    borderRadius: 4,
  },
  cellFillSelected: {
    height: CELL_SIZE - 3,
    width: CELL_SIZE - 3,
  },
  caption: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  legendRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-end',
  },
  legendLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  legendSwatch: {
    borderRadius: 2,
    height: 10,
    width: 10,
  },
});
