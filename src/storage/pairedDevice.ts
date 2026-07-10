import AsyncStorage from '@react-native-async-storage/async-storage';

export type PairedDevice = {
  id: string;
  name: string;
};

function storageKey(userId: string) {
  return `paired_device:${userId}`;
}

export async function getPairedDevice(userId: string): Promise<PairedDevice | null> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  return raw ? (JSON.parse(raw) as PairedDevice) : null;
}

export async function savePairedDevice(userId: string, device: PairedDevice) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(device));
}
