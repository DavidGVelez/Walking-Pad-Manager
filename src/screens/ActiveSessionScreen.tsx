import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { minSpeedKmh, maxSpeedKmh, speedStepKmh, useWalkSession } from '../context/WalkSessionContext';
import { theme } from '../theme';

const tabBarVisibleStyle = { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border };
const warmingUpColor = '#f59e0b';

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

export function ActiveSessionScreen() {
  const navigation = useNavigation();
  const {
    caloriesKcal,
    distanceMeters,
    elapsedSeconds,
    isPaused,
    isWarmingUp,
    pauseSession,
    resumeSession,
    speedKmh,
    steps,
    stopSession,
    updateSpeed,
  } = useWalkSession();
  const [isStopping, setIsStopping] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isWarmingUp) {
      pulseAnim.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );

    pulse.start();

    return () => pulse.stop();
  }, [isWarmingUp, pulseAnim]);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => parent?.setOptions({ tabBarStyle: tabBarVisibleStyle });
    }, [navigation]),
  );

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopSession();
      navigation.goBack();
    } catch {
      setIsStopping(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={[
            styles.timerPanel,
            isWarmingUp && styles.timerPanelWarmingUp,
            !isWarmingUp && !isPaused && styles.timerPanelActive,
          ]}
        >
          <Text style={styles.panelLabel}>
            {isPaused ? 'En pausa' : isWarmingUp ? 'Arrancando...' : 'En marcha'}
          </Text>
          <Animated.Text style={[styles.timerValue, isWarmingUp && { opacity: pulseAnim }]}>
            {formatElapsed(elapsedSeconds)}
          </Animated.Text>
        </View>

        <View style={styles.metricsRow}>
          <SessionMetric icon="map-marker-distance" label="Distancia" value={formatDistance(distanceMeters)} />
          <SessionMetric icon="shoe-print" label="Pasos" value={steps.toLocaleString('es-ES')} />
          <SessionMetric icon="fire" label="Calorias" value={`${caloriesKcal} kcal`} />
        </View>

        <View style={styles.speedPanel}>
          <Text style={styles.panelLabel}>Velocidad</Text>
          <View style={styles.speedReadout}>
            <Text style={styles.speedValue}>{speedKmh.toFixed(1)}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>

          <View style={styles.speedControls}>
            <Pressable
              accessibilityLabel="Bajar velocidad"
              accessibilityRole="button"
              disabled={speedKmh <= minSpeedKmh}
              onPress={() => updateSpeed(-speedStepKmh)}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons color={theme.colors.text} name="minus" size={28} />
            </Pressable>

            <Pressable
              accessibilityLabel={isPaused ? 'Reanudar' : 'Pausar'}
              accessibilityRole="button"
              onPress={isPaused ? resumeSession : pauseSession}
              style={styles.primaryButton}
            >
              <MaterialCommunityIcons
                color={theme.colors.background}
                name={isPaused ? 'play' : 'pause'}
                size={34}
              />
            </Pressable>

            <Pressable
              accessibilityLabel="Subir velocidad"
              accessibilityRole="button"
              disabled={speedKmh >= maxSpeedKmh}
              onPress={() => updateSpeed(speedStepKmh)}
              style={styles.iconButton}
            >
              <MaterialCommunityIcons color={theme.colors.text} name="plus" size={28} />
            </Pressable>
          </View>
        </View>

        <Pressable
          accessibilityLabel="Finalizar caminata"
          accessibilityRole="button"
          disabled={isStopping}
          onPress={handleStop}
          style={[styles.stopButton, isStopping && styles.disabledButton]}
        >
          <MaterialCommunityIcons color="#fca5a5" name="stop-circle-outline" size={22} />
          <Text style={styles.stopButtonText}>{isStopping ? 'Deteniendo...' : 'Finalizar caminata'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

type SessionMetricProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

function SessionMetric({ icon, label, value }: SessionMetricProps) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons color={theme.colors.primary} name={icon} size={20} />
      <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.metricValue}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
    justifyContent: 'center',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  timerPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  timerPanelWarmingUp: {
    borderColor: warmingUpColor,
  },
  timerPanelActive: {
    borderColor: theme.colors.success,
  },
  panelLabel: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  timerValue: {
    color: theme.colors.text,
    fontSize: 56,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  speedPanel: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  speedReadout: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  speedValue: {
    color: theme.colors.text,
    fontSize: 56,
    fontWeight: '800',
  },
  speedUnit: {
    color: theme.colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  speedControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 38,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  stopButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.55,
  },
  stopButtonText: {
    color: '#fca5a5',
    fontSize: 15,
    fontWeight: '800',
  },
});
