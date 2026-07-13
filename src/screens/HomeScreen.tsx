import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DeviceConnectionSheet } from '../components/DeviceConnectionSheet';
import { SpeedometerRing } from '../components/SpeedometerRing';
import { WeeklyDistanceChart } from '../components/WeeklyDistanceChart';
import { useAuth } from '../context/AuthContext';
import { useWalkingPadBleContext } from '../context/WalkingPadBleContext';
import { useWalkSession } from '../context/WalkSessionContext';
import type { HomeStackParamList } from '../navigation/HomeStack';
import { DEFAULT_DAILY_GOAL_MINUTES, getDailyGoalMinutes } from '../storage/dailyGoal';
import { loadSessions, WalkSession } from '../storage/sessionHistory';
import { computeCurrentStreakDays, groupSessionsByDay, toDateKey } from '../storage/sessionStats';
import { theme } from '../theme';

const STRIDE_METERS = 0.75;

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(2)} km`;
}

function getFirstNameFromEmail(email: string | undefined) {
  const prefix = (email ?? '').split('@')[0] || 'caminante';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function getGreeting(hour: number) {
  if (hour < 12) return 'Buenos dias';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { session } = useAuth();
  const { connectedDevice, status } = useWalkingPadBleContext();
  const {
    caloriesKcal: liveCaloriesKcal,
    distanceMeters: liveDistanceMeters,
    elapsedSeconds,
    isActive,
    isPaused,
    isWarmingUp,
    startSession,
  } = useWalkSession();
  const [isDeviceSheetVisible, setIsDeviceSheetVisible] = useState(false);
  const [sessions, setSessions] = useState<WalkSession[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSessions()
        .then(setSessions)
        .catch(() => {});
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const userId = session?.user.id;

      if (!userId) {
        return;
      }

      getDailyGoalMinutes(userId)
        .then(setDailyGoalMinutes)
        .catch(() => {});
    }, [session?.user.id]),
  );

  const handleSessionCardPress = () => {
    if (!isActive) {
      startSession();
    }

    navigation.navigate('ActiveSession');
  };

  const dailyTotals = groupSessionsByDay(sessions);
  const todayTotal = dailyTotals.get(toDateKey(Date.now()));
  const todayDurationSeconds = (todayTotal?.durationSeconds ?? 0) + (isActive ? elapsedSeconds : 0);
  const todayDistanceMeters = (todayTotal?.distanceMeters ?? 0) + (isActive ? liveDistanceMeters : 0);
  const todayCaloriesKcal = (todayTotal?.caloriesKcal ?? 0) + (isActive ? liveCaloriesKcal : 0);
  const hasTodayData = todayDurationSeconds > 0;

  const goalMinutes = dailyGoalMinutes ?? DEFAULT_DAILY_GOAL_MINUTES;
  const minutesWalked = todayDurationSeconds / 60;
  const streakDays = computeCurrentStreakDays(dailyTotals);

  const connectionLabel = connectedDevice
    ? connectedDevice.name
    : status === 'scanning' || status === 'connecting'
      ? 'Conectando...'
      : 'Sin conectar';

  const stateLabel = !isActive
    ? 'Todo listo'
    : isPaused
      ? 'En pausa'
      : isWarmingUp
        ? 'Arrancando...'
        : 'Actividad en marcha';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting(new Date().getHours())}, {getFirstNameFromEmail(session?.user.email)} 👋
          </Text>
        </View>

        <View style={styles.gaugeWrapper}>
          <SpeedometerRing goalMinutes={goalMinutes} minutesWalked={minutesWalked} />
        </View>

        <Pressable
          accessibilityLabel={isActive ? 'Ver actividad en curso' : 'A caminar'}
          accessibilityRole="button"
          onPress={handleSessionCardPress}
          style={styles.sessionCard}
        >
          <View style={styles.sessionCardIcon}>
            <MaterialCommunityIcons color={theme.colors.background} name={isActive ? 'run' : 'play'} size={28} />
          </View>
          <View style={styles.sessionCardCopy}>
            <Text style={styles.sessionCardLabel}>{stateLabel}</Text>
            <Text style={styles.sessionCardValue}>{isActive ? formatElapsed(elapsedSeconds) : 'A caminar'}</Text>
          </View>
          <MaterialCommunityIcons color={theme.colors.textMuted} name="chevron-right" size={24} />
        </Pressable>

        {!isActive && streakDays > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {streakDays} dias de racha</Text>
          </View>
        ) : null}

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="timer-outline"
            label="Tiempo"
            onPress={() => navigation.navigate('MetricDetail', { metric: 'duration' })}
            value={hasTodayData ? `${Math.round(todayDurationSeconds / 60)} min` : '--'}
          />
          <MetricCard
            icon="map-marker-distance"
            label="Distancia"
            onPress={() => navigation.navigate('MetricDetail', { metric: 'distance' })}
            value={hasTodayData ? formatDistance(todayDistanceMeters) : '--'}
          />
          <MetricCard
            icon="fire"
            label="Calorias"
            onPress={() => navigation.navigate('MetricDetail', { metric: 'calories' })}
            value={hasTodayData ? `${Math.round(todayCaloriesKcal)} kcal` : '--'}
          />
          <MetricCard
            icon="bluetooth"
            label="Conexion"
            onPress={() => setIsDeviceSheetVisible(true)}
            value={connectionLabel}
          />
        </View>

        {!isActive ? <WeeklyDistanceChart sessions={sessions} /> : null}
      </ScrollView>

      <DeviceConnectionSheet onClose={() => setIsDeviceSheetVisible(false)} visible={isDeviceSheetVisible} />
    </SafeAreaView>
  );
}

type MetricCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  value: string;
};

function MetricCard({ icon, label, onPress, value }: MetricCardProps) {
  return (
    <Pressable
      accessibilityLabel={`Ver detalle de ${label}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.metricCard}
    >
      <View style={styles.metricCardHeader}>
        <MaterialCommunityIcons color={theme.colors.primary} name={icon} size={24} />
        <MaterialCommunityIcons color={theme.colors.textMuted} name="chevron-right" size={18} />
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Pressable>
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
    alignSelf: 'stretch',
  },
  greeting: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  gaugeWrapper: {
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: theme.spacing.sm,
  },
  sessionCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sessionCardIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  sessionCardCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  sessionCardLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCardValue: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  streakBadge: {
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  streakText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  metricsGrid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: theme.spacing.sm,
    minWidth: 140,
    padding: theme.spacing.md,
  },
  metricCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
