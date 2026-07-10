import { useEffect, useRef, useState } from 'react';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';

import { base64ToBytes, bytesToBase64 } from '../bluetooth/base64';
import {
  decodeControlPointResponse,
  decodeTreadmillData,
  encodeRequestControl,
  encodeSetTargetSpeed,
  encodeStartOrResume,
  encodeStopOrPause,
  FITNESS_MACHINE_CONTROL_POINT_UUID,
  FITNESS_MACHINE_SERVICE_UUID,
  FITNESS_MACHINE_STATUS_UUID,
  TREADMILL_DATA_CHARACTERISTIC_UUID,
  TreadmillData,
} from '../bluetooth/ftms';
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
import { getPairedDevice, savePairedDevice } from '../storage/pairedDevice';

type ConnectionStatus = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';

export function useWalkingPadBle(userId: string | null) {
  const managerRef = useRef<BleManager | null>(null);
  const devicesRef = useRef<Map<string, Device>>(new Map());
  const monitorSubscriptionsRef = useRef<Subscription[]>([]);
  const disconnectSubscriptionRef = useRef<Subscription | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [devices, setDevices] = useState<ScannedDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<ScannedDevice | null>(null);
  const [characteristics, setCharacteristics] = useState<DeviceCharacteristic[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTreadmillData, setLiveTreadmillData] = useState<TreadmillData | null>(null);

  const clearMonitors = () => {
    for (const subscription of monitorSubscriptionsRef.current) {
      subscription.remove();
    }

    monitorSubscriptionsRef.current = [];
  };

  const handleConnectionLost = () => {
    disconnectSubscriptionRef.current = null;
    clearMonitors();
    setConnectedDevice(null);
    setCharacteristics([]);
    setLiveTreadmillData(null);
    setStatus('idle');
  };

  const monitorFitnessMachine = (device: Device) => {
    monitorSubscriptionsRef.current.push(
      device.monitorCharacteristicForService(
        FITNESS_MACHINE_SERVICE_UUID,
        FITNESS_MACHINE_CONTROL_POINT_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) {
            return;
          }

          const bytes = base64ToBytes(characteristic.value);
          console.log('[FTMS] control point response', decodeControlPointResponse(bytes) ?? bytes);
        },
      ),
      device.monitorCharacteristicForService(
        FITNESS_MACHINE_SERVICE_UUID,
        TREADMILL_DATA_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) {
            return;
          }

          const bytes = base64ToBytes(characteristic.value);
          const parsed = decodeTreadmillData(bytes);

          if (parsed) {
            setLiveTreadmillData(parsed);
          }
        },
      ),
      device.monitorCharacteristicForService(
        FITNESS_MACHINE_SERVICE_UUID,
        FITNESS_MACHINE_STATUS_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) {
            return;
          }

          console.log('[FTMS] status raw', base64ToBytes(characteristic.value).join(','));
        },
      ),
    );
  };

  const getFitnessMachineDevice = () => {
    if (!connectedDevice) {
      return null;
    }

    return devicesRef.current.get(connectedDevice.id) ?? null;
  };

  const writeControlPoint = async (bytes: number[]) => {
    const device = getFitnessMachineDevice();

    if (!device) {
      throw new Error('No hay dispositivo conectado');
    }

    await device.writeCharacteristicWithoutResponseForService(
      FITNESS_MACHINE_SERVICE_UUID,
      FITNESS_MACHINE_CONTROL_POINT_UUID,
      bytesToBase64(bytes),
    );
  };

  const requestControl = () => writeControlPoint(encodeRequestControl());
  const startOrResume = () => writeControlPoint(encodeStartOrResume());
  const stopOrPause = (mode: 'stop' | 'pause') => writeControlPoint(encodeStopOrPause(mode));
  const setTargetSpeed = (speedKmh: number) => writeControlPoint(encodeSetTargetSpeed(speedKmh));

  const finalizeConnection = async (device: Device) => {
    const discovered = await device.discoverAllServicesAndCharacteristics();
    const services = await discovered.services();
    const nextCharacteristics: DeviceCharacteristic[] = [];

    for (const service of services) {
      const serviceCharacteristics = await service.characteristics();
      nextCharacteristics.push(...serviceCharacteristics.map(toDeviceCharacteristic));
    }

    const scannedDevice = toScannedDevice(discovered);
    devicesRef.current.set(discovered.id, discovered);
    clearMonitors();
    setLiveTreadmillData(null);
    monitorFitnessMachine(discovered);

    disconnectSubscriptionRef.current?.remove();
    disconnectSubscriptionRef.current = managerRef.current?.onDeviceDisconnected(discovered.id, handleConnectionLost) ?? null;

    setConnectedDevice(scannedDevice);
    setCharacteristics(nextCharacteristics);
    setStatus('connected');

    if (userId) {
      await savePairedDevice(userId, { id: scannedDevice.id, name: scannedDevice.name });
    }
  };

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

  useEffect(() => {
    const manager = managerRef.current;

    if (!manager || !userId) {
      return;
    }

    let isCancelled = false;

    (async () => {
      const paired = await getPairedDevice(userId);

      if (!paired || isCancelled) {
        return;
      }

      try {
        setStatus('connecting');
        setErrorMessage(null);

        const hasPermissions = await requestBluetoothPermissions();

        if (!hasPermissions || isCancelled) {
          setStatus('idle');
          return;
        }

        await waitForBluetoothPoweredOn(manager);

        if (isCancelled) {
          return;
        }

        const connected = await manager.connectToDevice(paired.id);

        if (isCancelled) {
          return;
        }

        await finalizeConnection(connected);
      } catch {
        if (!isCancelled) {
          setStatus('idle');
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

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

        if (!device || !isLikelyWalkingPad(device) || device.id === connectedDevice?.id) {
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
      await finalizeConnection(connected);
    } catch (error) {
      setStatus('error');
      setErrorMessage(getBleErrorMessage(error));
    }
  };

  const disconnect = async () => {
    if (!connectedDevice) {
      return;
    }

    disconnectSubscriptionRef.current?.remove();

    try {
      await managerRef.current?.cancelDeviceConnection(connectedDevice.id);
    } finally {
      handleConnectionLost();
    }
  };

  return {
    characteristics,
    connectedDevice,
    connectToDevice,
    devices,
    disconnect,
    errorMessage,
    liveTreadmillData,
    requestControl,
    scanForWalkingPad,
    setTargetSpeed,
    startOrResume,
    status,
    stopOrPause,
  };
}
