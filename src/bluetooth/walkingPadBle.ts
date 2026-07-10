import { PermissionsAndroid, Platform } from 'react-native';
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
  State,
} from 'react-native-ble-plx';

export type ScannedDevice = {
  id: string;
  name: string;
  rssi: number | null;
  serviceUUIDs: string[];
};

export type DeviceCharacteristic = {
  serviceUUID: string;
  characteristicUUID: string;
  isNotifiable: boolean;
  isReadable: boolean;
  isWritableWithResponse: boolean;
  isWritableWithoutResponse: boolean;
};

export const walkingPadNameMatchers = ['mobvoi', 'wt', 'fit', 'walking', 'treadmill'];

export function getDeviceDisplayName(device: Device) {
  return device.localName ?? device.name ?? 'Dispositivo sin nombre';
}

export function isLikelyWalkingPad(device: Device) {
  const displayName = getDeviceDisplayName(device).toLowerCase();
  return walkingPadNameMatchers.some((matcher) => displayName.includes(matcher));
}

export async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Number(Platform.Version) >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function createBleManager() {
  return new BleManager();
}

export function waitForBluetoothPoweredOn(manager: BleManager) {
  return new Promise<void>((resolve, reject) => {
    const subscription = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        subscription.remove();
        resolve();
      }

      if (state === State.Unsupported || state === State.Unauthorized) {
        subscription.remove();
        reject(new Error(`Bluetooth no disponible: ${state}`));
      }
    }, true);
  });
}

export function toScannedDevice(device: Device): ScannedDevice {
  return {
    id: device.id,
    name: getDeviceDisplayName(device),
    rssi: device.rssi ?? null,
    serviceUUIDs: device.serviceUUIDs ?? [],
  };
}

export function toDeviceCharacteristic(characteristic: Characteristic): DeviceCharacteristic {
  return {
    serviceUUID: characteristic.serviceUUID,
    characteristicUUID: characteristic.uuid,
    isNotifiable: characteristic.isNotifiable,
    isReadable: characteristic.isReadable,
    isWritableWithResponse: characteristic.isWritableWithResponse,
    isWritableWithoutResponse: characteristic.isWritableWithoutResponse,
  };
}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function getBleErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  const bleError = error as BleError | undefined;
  return bleError?.reason ?? bleError?.message ?? 'Error Bluetooth desconocido';
}
