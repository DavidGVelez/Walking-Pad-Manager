import { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { MetricTrendChart } from '../components/MetricTrendChart';
import { loadSessions, WalkSession } from '../storage/sessionHistory';
import { DailyTotal, getRecentDays, groupSessionsByDay } from '../storage/sessionStats';
import { theme } from '../theme';

const DAYS_COUNT = 14;
const STRIDE_METERS = 0.75;

export type MetricKey = 'distance' | 'duration' | 'steps' | 'calories';

type MetricConfig = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  unit: string;
  getDailyValue: (total: DailyTotal) => number;
  formatValue: (value: number) => string;
  note?: string;
};

const metricConfig: Record<MetricKey, MetricConfig> = {
  distance: {
    label: 'Distancia',
    icon: 'map-marker-distance',
    unit: 'km',
    getDailyValue: (total) => total.distanceMeters / 1000,
    formatValue: (value) => value.toFixed(2),
  },
  duration: {
    label: 'Tiempo',
    icon: 'timer-outline',
    unit: 'min',
    getDailyValue: (total) => total.durationSeconds / 60,
    formatValue: (value) => Math.round(value).toString(),
  },
  steps: {
    label: 'Pasos',
    icon: 'shoe-print',
    unit: 'pasos',
    getDailyValue: (total) => total.distanceMeters / STRIDE_METERS,
    formatValue: (value) => Math.round(value).toLocaleString('es-ES'),
    note: 'Estimados a partir de la distancia recorrida.',
  },
  calories: {
    label: 'Calorias',
    icon: 'fire',
    unit: 'kcal',
    getDailyValue: (total) => total.caloriesKcal,
    formatValue: (value) => Math.round(value).toString(),
  },
};

type MetricDetailRouteProp = RouteProp<{ MetricDetail: { metric: MetricKey } }, 'MetricDetail'>;

export function MetricDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<MetricDetailRouteProp>();
  const metric = metricConfig[route.params.metric];
  const [sessions, setSessions] = useState<WalkSession[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: metric.label });
  }, [navigation, metric.label]);

  useFocusEffect(
    useCallback(() => {
      loadSessions().then(setSessions);
    }, []),
  );

  const dailyTotals = groupSessionsByDay(sessions);
  const recentTotals = getRecentDays(DAYS_COUNT).map((dateKey) => dailyTotals.get(dateKey));
  const totalValue = recentTotals.reduce(
    (sum, total) => sum + (total ? metric.getDailyValue(total) : 0),
    0,
  );
  const activeDays = recentTotals.filter((total) => total && metric.getDailyValue(total) > 0).length;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons color={theme.colors.primary} name={metric.icon} size={22} />
            <Text style={styles.summaryValue}>{metric.formatValue(totalValue)}</Text>
            <Text style={styles.summaryLabel}>Total {metric.unit}</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons color={theme.colors.primary} name="calendar-check-outline" size={22} />
            <Text style={styles.summaryValue}>{activeDays}</Text>
            <Text style={styles.summaryLabel}>Dias activos</Text>
          </View>
        </View>

        <MetricTrendChart
          formatValue={metric.formatValue}
          getDailyValue={metric.getDailyValue}
          sessions={sessions}
          unit={metric.unit}
        />

        {metric.note ? <Text style={styles.noteText}>{metric.note}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  noteText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
