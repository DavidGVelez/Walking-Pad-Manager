import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { theme } from '../theme';

const DEFAULT_SIZE = 220;
const RING_STROKE = 16;

type Props = {
  minutesWalked: number;
  goalMinutes: number;
  size?: number;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function SpeedometerRing({ minutesWalked, goalMinutes, size = DEFAULT_SIZE }: Props) {
  const center = size / 2;
  const radius = center - RING_STROKE / 2;
  const circumference = 2 * Math.PI * radius;

  const goalFraction = clamp01(goalMinutes > 0 ? minutesWalked / goalMinutes : 0);
  const offset = circumference * (1 - goalFraction);

  return (
    <View style={{ height: size, width: size }}>
      <Svg height={size} width={size}>
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke={theme.colors.surfaceMuted}
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          rotation={-90}
          origin={`${center}, ${center}`}
          stroke={theme.colors.success}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={RING_STROKE}
        />
      </Svg>

      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.center}>
          <View style={styles.minutesRow}>
            <Text style={styles.minutesValue}>{Math.round(minutesWalked)}</Text>
            <Text style={styles.minutesUnit}>min</Text>
          </View>
          <Text style={styles.goalCaption}>de {goalMinutes} min</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  minutesRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  minutesValue: {
    color: theme.colors.text,
    fontSize: 44,
    fontWeight: '800',
  },
  minutesUnit: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '700',
  },
  goalCaption: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
