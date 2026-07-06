import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '../theme';

const speedStep = 0.1;
const minSpeed = 0;
const maxSpeed = 6;

export function HomeScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2.5);

  const formattedSpeed = useMemo(() => speed.toFixed(1), [speed]);

  const updateSpeed = (delta: number) => {
    setSpeed((currentSpeed) => {
      const nextSpeed = Math.min(maxSpeed, Math.max(minSpeed, currentSpeed + delta));
      return Number(nextSpeed.toFixed(1));
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Walking Pad</Text>
            <Text style={styles.title}>Manager</Text>
          </View>
          <View style={[styles.statusBadge, isRunning && styles.statusBadgeActive]}>
            <View style={[styles.statusDot, isRunning && styles.statusDotActive]} />
            <Text style={styles.statusText}>{isRunning ? 'Activo' : 'Pausado'}</Text>
          </View>
        </View>

        <View style={styles.speedPanel}>
          <Text style={styles.panelLabel}>Velocidad actual</Text>
          <View style={styles.speedReadout}>
            <Text style={styles.speedValue}>{formattedSpeed}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>

          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bajar velocidad"
              style={styles.iconButton}
              onPress={() => updateSpeed(-speedStep)}
            >
              <MaterialCommunityIcons name="minus" size={28} color={theme.colors.text} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isRunning ? 'Pausar cinta' : 'Iniciar cinta'}
              style={[styles.primaryButton, isRunning && styles.primaryButtonActive]}
              onPress={() => setIsRunning((currentValue) => !currentValue)}
            >
              <MaterialCommunityIcons
                name={isRunning ? 'pause' : 'play'}
                size={34}
                color={theme.colors.background}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Subir velocidad"
              style={styles.iconButton}
              onPress={() => updateSpeed(speedStep)}
            >
              <MaterialCommunityIcons name="plus" size={28} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Tiempo" value="24 min" icon="timer-outline" />
          <MetricCard label="Distancia" value="1.2 km" icon="map-marker-distance" />
          <MetricCard label="Pasos" value="2.840" icon="shoe-print" />
          <MetricCard label="Calorias" value="132 kcal" icon="fire" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type MetricCardProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
};

function MetricCard({ icon, label, value }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  statusBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  statusBadgeActive: {
    borderColor: theme.colors.success,
  },
  statusDot: {
    backgroundColor: theme.colors.textMuted,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  statusDotActive: {
    backgroundColor: theme.colors.success,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  speedPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  panelLabel: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  speedReadout: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  speedValue: {
    color: theme.colors.text,
    fontSize: 76,
    fontWeight: '800',
    letterSpacing: 0,
  },
  speedUnit: {
    color: theme.colors.textMuted,
    fontSize: 20,
    fontWeight: '700',
  },
  controls: {
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
  primaryButtonActive: {
    backgroundColor: theme.colors.success,
  },
  metricsGrid: {
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
