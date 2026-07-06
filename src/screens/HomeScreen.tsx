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

import { DeviceCharacteristic } from '../bluetooth/walkingPadBle';
import { useWalkingPadBle } from '../hooks/useWalkingPadBle';
import { theme } from '../theme';

const speedStep = 0.1;
const minSpeed = 0;
const maxSpeed = 6;

export function HomeScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2.5);
  const {
    characteristics,
    connectedDevice,
    connectToDevice,
    devices,
    disconnect,
    errorMessage,
    scanForWalkingPad,
    status,
  } = useWalkingPadBle();

  const formattedSpeed = useMemo(() => speed.toFixed(1), [speed]);
  const isBluetoothBusy = status === 'scanning' || status === 'connecting';

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

        <View style={styles.bluetoothPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.panelLabel}>Bluetooth</Text>
              <Text style={styles.bluetoothTitle}>
                {connectedDevice ? connectedDevice.name : 'Mobvoi WT Fit'}
              </Text>
            </View>
            <View style={[styles.statusBadge, connectedDevice && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, connectedDevice && styles.statusDotActive]} />
              <Text style={styles.statusText}>{connectedDevice ? 'Conectada' : 'Sin enlace'}</Text>
            </View>
          </View>

          <Text style={styles.helperText}>
            Escanea con la cinta encendida y cerca del movil. La app filtrara dispositivos con
            nombres parecidos a Mobvoi, WT, Fit, Walking o Treadmill.
          </Text>

          <View style={styles.bluetoothActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Escanear dispositivos Bluetooth"
              disabled={isBluetoothBusy}
              style={[styles.secondaryButton, isBluetoothBusy && styles.disabledButton]}
              onPress={scanForWalkingPad}
            >
              <MaterialCommunityIcons name="bluetooth-settings" size={20} color={theme.colors.text} />
              <Text style={styles.secondaryButtonText}>
                {status === 'scanning' ? 'Escaneando...' : 'Escanear'}
              </Text>
            </Pressable>

            {connectedDevice ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Desconectar dispositivo Bluetooth"
                style={styles.secondaryButton}
                onPress={disconnect}
              >
                <MaterialCommunityIcons name="link-off" size={20} color={theme.colors.text} />
                <Text style={styles.secondaryButtonText}>Desconectar</Text>
              </Pressable>
            ) : null}
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {devices.length > 0 ? (
            <View style={styles.deviceList}>
              {devices.map((device) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Conectar con ${device.name}`}
                  disabled={isBluetoothBusy}
                  key={device.id}
                  style={styles.deviceRow}
                  onPress={() => connectToDevice(device.id)}
                >
                  <View style={styles.deviceCopy}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceMeta}>
                      RSSI {device.rssi ?? '-'} · {device.id}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {connectedDevice ? (
            <View style={styles.characteristicsPanel}>
              <Text style={styles.characteristicsTitle}>Caracteristicas detectadas</Text>
              {characteristics.length > 0 ? (
                characteristics.slice(0, 8).map((characteristic) => (
                  <CharacteristicRow
                    characteristic={characteristic}
                    key={`${characteristic.serviceUUID}:${characteristic.characteristicUUID}`}
                  />
                ))
              ) : (
                <Text style={styles.helperText}>No se encontraron caracteristicas.</Text>
              )}
              {characteristics.length > 8 ? (
                <Text style={styles.helperText}>
                  Mostrando 8 de {characteristics.length}. El resto queda disponible para mapear el protocolo.
                </Text>
              ) : null}
            </View>
          ) : null}
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

type CharacteristicRowProps = {
  characteristic: DeviceCharacteristic;
};

function CharacteristicRow({ characteristic }: CharacteristicRowProps) {
  const capabilities = [
    characteristic.isReadable ? 'read' : null,
    characteristic.isNotifiable ? 'notify' : null,
    characteristic.isWritableWithResponse ? 'write' : null,
    characteristic.isWritableWithoutResponse ? 'writeNoResp' : null,
  ].filter(Boolean);

  return (
    <View style={styles.characteristicRow}>
      <Text style={styles.characteristicUuid}>{characteristic.characteristicUUID}</Text>
      <Text style={styles.characteristicService}>{characteristic.serviceUUID}</Text>
      <Text style={styles.characteristicFlags}>
        {capabilities.length > 0 ? capabilities.join(' · ') : 'sin flags'}
      </Text>
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
  bluetoothPanel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  bluetoothTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  bluetoothActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  disabledButton: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  deviceList: {
    gap: theme.spacing.sm,
  },
  deviceRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  deviceCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  deviceName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  deviceMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  characteristicsPanel: {
    gap: theme.spacing.sm,
  },
  characteristicsTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  characteristicRow: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  characteristicUuid: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  characteristicService: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  characteristicFlags: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
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
