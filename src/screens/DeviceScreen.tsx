import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DeviceCharacteristic } from '../bluetooth/walkingPadBle';
import { useWalkingPadBleContext } from '../context/WalkingPadBleContext';
import { theme } from '../theme';

export function DeviceScreen() {
  const {
    characteristics,
    connectedDevice,
    connectToDevice,
    devices,
    disconnect,
    errorMessage,
    scanForWalkingPad,
    status,
  } = useWalkingPadBleContext();

  const isBluetoothBusy = status === 'scanning' || status === 'connecting';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Bluetooth</Text>
          <Text style={styles.title}>Dispositivo</Text>
        </View>

        <View style={styles.bluetoothPanel}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.panelLabel}>Cinta</Text>
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
      </ScrollView>
    </SafeAreaView>
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
  panelLabel: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
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
});
