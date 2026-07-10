import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useWalkingPadBleContext } from '../context/WalkingPadBleContext';
import { theme } from '../theme';

type DeviceStatusPillProps = {
  onPress: () => void;
};

export function DeviceStatusPill({ onPress }: DeviceStatusPillProps) {
  const { connectedDevice, status } = useWalkingPadBleContext();

  const label = connectedDevice
    ? connectedDevice.name
    : status === 'scanning' || status === 'connecting'
      ? 'Conectando...'
      : 'Sin conectar';

  return (
    <Pressable accessibilityLabel="Estado de la cinta" accessibilityRole="button" onPress={onPress} style={styles.pill}>
      <View style={[styles.dot, connectedDevice && styles.dotActive]} />
      <MaterialCommunityIcons color={theme.colors.text} name="bluetooth" size={16} />
      <Text ellipsizeMode="tail" numberOfLines={1} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexShrink: 1,
    gap: theme.spacing.xs,
    maxWidth: '48%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dot: {
    backgroundColor: theme.colors.textMuted,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: theme.colors.success,
  },
  label: {
    color: theme.colors.text,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
