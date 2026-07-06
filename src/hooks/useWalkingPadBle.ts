import { useEffect, useRef, useState } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';

import {
  createBleManager,
  DeviceCharacteristic,
  getBleErrorMessage,
  isLikelyWalkingPad,
  requestBluetoothPermissions,
  ScannedDevice,
  toDeviceCharacteristic,
  toScannedDevice,
  waitForBluetoothPoweredOn,
} from '../bluetooth/walkingPadBle';

type ConnectionStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';

export function useWalkingPadBle() {
  const managerRef = useRef<BleManager | null>(null);
  const devicesRef = useRef<Map<string, Device>>(new Map());
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<ScannedDevice | null>(null);
  const [characteristics, setCharacteristics] = useState<DeviceCharacteristic[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      managerRef.current = createBleManager();
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        `${getBleErrorMessage(error)}. Bluetooth requiere un development build; no funciona en Expo Go.`,
      );
    }

    return () => {
      managerRef.current?.stopDeviceScan();
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  const scanForWalkingPad = async () => {
    const manager = managerRef.current;

    if (!manager) {
      setStatus('error');
      setErrorMessage('Bluetooth no esta inicializado. Usa un development build, no Expo Go.');
      return;
    }

    try {
      setStatus('scanning');
      setErrorMessage(null);
      setConnectedDevice(null);
      setCharacteristics([]);
      setDevices([]);
      devicesRef.current.clear();

      const hasPermissions = await requestBluetoothPermissions();

      if (!hasPermissions) {
        throw new Error('Permisos Bluetooth denegados');
      }

      await waitForBluetoothPoweredOn(manager);

      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          setStatus('error');
          setErrorMessage(getBleErrorMessage(error));
          manager.stopDeviceScan();
          return;
        }

        if (!device || !isLikelyWalkingPad(device)) {
          return;
        }

        devicesRef.current.set(device.id, device);
        setDevices(Array.from(devicesRef.current.values()).map(toScannedDevice));
      });

      setTimeout(() => {
        manager.stopDeviceScan();
        setStatus((currentStatus) => (currentStatus === 'scanning' ? 'idle' : currentStatus));
      }, 12000);
    } catch (error) {
      manager.stopDeviceScan();
      setStatus('error');
      setErrorMessage(getBleErrorMessage(error));
    }
  };

  const connectToDevice = async (deviceId: string) => {
    const manager = managerRef.current;
    const device = devicesRef.current.get(deviceId);

    if (!manager || !device) {
      setStatus('error');
      setErrorMessage('Dispositivo no encontrado. Vuelve a escanear.');
      return;
    }

    try {
      setStatus('connecting');
      setErrorMessage(null);
      manager.stopDeviceScan();

      const connected = await device.connect();
      const discovered = await connected.discoverAllServicesAndCharacteristics();
      const services = await discovered.services();
      const nextCharacteristics: DeviceCharacteristic[] = [];

      for (const service of services) {
        const serviceCharacteristics = await service.characteristics();
        nextCharacteristics.push(...serviceCharacteristics.map(toDeviceCharacteristic));
      }

      setConnectedDevice(toScannedDevice(discovered));
      setCharacteristics(nextCharacteristics);
      setStatus('connected');
    } catch (error) {
      setStatus('error');
      setErrorMessage(getBleErrorMessage(error));
    }
  };

  const disconnect = async () => {
    if (!connectedDevice) {
      return;
    }

    try {
      await managerRef.current?.cancelDeviceConnection(connectedDevice.id);
    } finally {
      setConnectedDevice(null);
      setCharacteristics([]);
      setStatus('idle');
    }
  };

  return {
    characteristics,
    connectedDevice,
    connectToDevice,
    devices,
    disconnect,
    errorMessage,
    scanForWalkingPad,
    status,
  };
}
