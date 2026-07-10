import { useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useWalkingPadBleContext } from '../context/WalkingPadBleContext';
import { theme } from '../theme';

type DeviceConnectionSheetProps = {
  onClose: () => void;
  visible: boolean;
};

export function DeviceConnectionSheet({ onClose, visible }: DeviceConnectionSheetProps) {
  const {
    connectedDevice,
    connectToDevice,
    devices,
    disconnect,
    errorMessage,
    scanForWalkingPad,
    status,
  } = useWalkingPadBleContext();

  const previousStatusRef = useRef(status);

  useEffect(() => {
    if (visible && status === 'connected' && previousStatusRef.current !== 'connected') {
      const timeout = setTimeout(onClose, 700);
      previousStatusRef.current = status;
      return () => clearTimeout(timeout);
    }

    previousStatusRef.current = status;
  }, [onClose, status, visible]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.container}>
        <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" onPress={onClose} style={styles.backdrop} />

        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.panelLabel}>Cinta</Text>
              <Text style={styles.sheetTitle}>{connectedDevice ? connectedDevice.name : 'Mobvoi WT Fit'}</Text>
            </View>
            <View style={[styles.statusBadge, connectedDevice && styles.statusBadgeActive]}>
              <View style={[styles.statusDot, connectedDevice && styles.statusDotActive]} />
              <Text style={styles.statusText}>{connectedDevice ? 'Conectada' : 'Sin enlace'}</Text>
            </View>
          </View>

          <Text style={styles.helperText}>Escanea con la cinta encendida y cerca del movil.</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Escanear dispositivos Bluetooth"
              accessibilityRole="button"
              disabled={status === 'scanning'}
              onPress={scanForWalkingPad}
              style={[styles.secondaryButton, status === 'scanning' && styles.disabledButton]}
            >
              <MaterialCommunityIcons color={theme.colors.text} name="bluetooth-settings" size={20} />
              <Text style={styles.secondaryButtonText}>
                {status === 'scanning' ? 'Escaneando...' : 'Escanear'}
              </Text>
            </Pressable>

            {connectedDevice ? (
              <Pressable
                accessibilityLabel="Desconectar dispositivo Bluetooth"
                accessibilityRole="button"
                onPress={disconnect}
                style={styles.secondaryButton}
              >
                <MaterialCommunityIcons color={theme.colors.text} name="link-off" size={20} />
                <Text style={styles.secondaryButtonText}>Desconectar</Text>
              </Pressable>
            ) : null}
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {devices.length > 0 ? (
            <ScrollView style={styles.deviceList}>
              {devices.map((device) => (
                <Pressable
                  accessibilityLabel={`Conectar con ${device.name}`}
                  accessibilityRole="button"
                  disabled={status === 'connecting'}
                  key={device.id}
                  onPress={() => connectToDevice(device.id)}
                  style={styles.deviceRow}
                >
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <MaterialCommunityIcons color={theme.colors.textMuted} name="chevron-right" size={24} />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    gap: theme.spacing.md,
    maxHeight: '80%',
    padding: theme.spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    height: 4,
    width: 40,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  sheetTitle: {
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
  actions: {
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
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  deviceName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
