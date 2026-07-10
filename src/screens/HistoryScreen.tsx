import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { WeeklyDistanceChart } from '../components/WeeklyDistanceChart';
import { loadSessions, WalkSession } from '../storage/sessionHistory';
import { theme } from '../theme';

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

export function HistoryScreen() {
  const [sessions, setSessions] = useState<WalkSession[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSessions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setSessions(await loadSessions());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSessions();
    }, [refreshSessions]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl onRefresh={refreshSessions} refreshing={isRefreshing} />}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Actividad</Text>
          <Text style={styles.title}>Historial</Text>
        </View>

        <WeeklyDistanceChart sessions={sessions} />
        <ActivityHeatmap sessions={sessions} />

        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={32} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Todavia no hay sesiones guardadas.</Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SessionRow({ session }: { session: WalkSession }) {
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{formatDate(session.startedAt)}</Text>
        <Text style={styles.sessionDuration}>{formatDuration(session.durationSeconds)}</Text>
      </View>
      <View style={styles.sessionMetrics}>
        <SessionMetric
          icon="map-marker-distance"
          label="Distancia"
          value={session.distanceMeters != null ? `${(session.distanceMeters / 1000).toFixed(2)} km` : '-'}
        />
        <SessionMetric
          icon="speedometer"
          label="Media"
          value={session.averageSpeedKmh != null ? `${session.averageSpeedKmh.toFixed(1)} km/h` : '-'}
        />
        <SessionMetric
          icon="fire"
          label="Calorias"
          value={session.caloriesKcal != null ? `${Math.round(session.caloriesKcal)} kcal` : '-'}
        />
      </View>
    </View>
  );
}

type SessionMetricProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

function SessionMetric({ icon, label, value }: SessionMetricProps) {
  return (
    <View style={styles.sessionMetric}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
      <Text style={styles.sessionMetricValue}>{value}</Text>
      <Text style={styles.sessionMetricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  sessionList: {
    gap: theme.spacing.md,
  },
  sessionRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sessionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionDate: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sessionDuration: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  sessionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionMetric: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sessionMetricValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sessionMetricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
