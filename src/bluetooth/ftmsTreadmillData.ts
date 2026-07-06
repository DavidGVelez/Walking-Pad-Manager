/* eslint-disable no-bitwise -- binary protocol parsing requires bit-level operators */
export const FITNESS_MACHINE_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
export const TREADMILL_DATA_CHARACTERISTIC_UUID = '00002acd-0000-1000-8000-00805f9b34fb';
export const FITNESS_MACHINE_STATUS_CHARACTERISTIC_UUID = '00002ada-0000-1000-8000-00805f9b34fb';

export type TreadmillDataSample = {
  instantaneousSpeedKmh: number | null;
  averageSpeedKmh: number | null;
  totalDistanceMeters: number | null;
  totalEnergyKcal: number | null;
  elapsedTimeSeconds: number | null;
  heartRateBpm: number | null;
};

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function decodeBase64ToBytes(base64Value: string): Uint8Array {
  const clean = base64Value.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;

  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) {
      continue;
    }

    buffer = (buffer << 6) | value;
    bitsCollected += 6;

    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }

  return Uint8Array.from(bytes);
}

// Bluetooth SIG "Treadmill Data" characteristic (org.bluetooth.characteristic.treadmill_data),
// part of the Fitness Machine Service. Field presence depends on the flags bitmask, and fields
// are packed in a fixed order regardless of which ones are enabled.
export function parseTreadmillData(base64Value: string): TreadmillDataSample {
  const bytes = decodeBase64ToBytes(base64Value);
  let offset = 0;

  const readUint8 = () => bytes[offset++];
  const readUint16 = () => {
    const value = bytes[offset] | (bytes[offset + 1] << 8);
    offset += 2;
    return value;
  };
  const readSint16 = () => {
    const value = readUint16();
    return value > 0x7fff ? value - 0x10000 : value;
  };
  const readUint24 = () => {
    const value = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
    offset += 3;
    return value;
  };

  const flags = readUint16();

  const hasInstantaneousSpeed = (flags & 0x0001) === 0;
  const hasAverageSpeed = (flags & 0x0002) !== 0;
  const hasTotalDistance = (flags & 0x0004) !== 0;
  const hasInclination = (flags & 0x0008) !== 0;
  const hasElevationGain = (flags & 0x0010) !== 0;
  const hasInstantaneousPace = (flags & 0x0020) !== 0;
  const hasAveragePace = (flags & 0x0040) !== 0;
  const hasExpendedEnergy = (flags & 0x0080) !== 0;
  const hasHeartRate = (flags & 0x0100) !== 0;
  const hasMetabolicEquivalent = (flags & 0x0200) !== 0;
  const hasElapsedTime = (flags & 0x0400) !== 0;
  const hasRemainingTime = (flags & 0x0800) !== 0;
  const hasForceAndPower = (flags & 0x1000) !== 0;

  let instantaneousSpeedKmh: number | null = null;
  let averageSpeedKmh: number | null = null;
  let totalDistanceMeters: number | null = null;
  let totalEnergyKcal: number | null = null;
  let elapsedTimeSeconds: number | null = null;
  let heartRateBpm: number | null = null;

  if (hasInstantaneousSpeed) {
    instantaneousSpeedKmh = readUint16() * 0.01;
  }

  if (hasAverageSpeed) {
    averageSpeedKmh = readUint16() * 0.01;
  }

  if (hasTotalDistance) {
    totalDistanceMeters = readUint24();
  }

  if (hasInclination) {
    readSint16();
    readSint16();
  }

  if (hasElevationGain) {
    readUint16();
    readUint16();
  }

  if (hasInstantaneousPace) {
    readUint8();
  }

  if (hasAveragePace) {
    readUint8();
  }

  if (hasExpendedEnergy) {
    totalEnergyKcal = readUint16();
    readUint16();
    readUint8();
  }

  if (hasHeartRate) {
    heartRateBpm = readUint8();
  }

  if (hasMetabolicEquivalent) {
    readUint8();
  }

  if (hasElapsedTime) {
    elapsedTimeSeconds = readUint16();
  }

  if (hasRemainingTime) {
    readUint16();
  }

  if (hasForceAndPower) {
    readSint16();
    readSint16();
  }

  return {
    instantaneousSpeedKmh,
    averageSpeedKmh,
    totalDistanceMeters,
    totalEnergyKcal,
    elapsedTimeSeconds,
    heartRateBpm,
  };
}

export type FitnessMachineStatusEvent =
  | { type: 'started' }
  | { type: 'stopped' }
  | { type: 'other'; opcode: number };

// Bluetooth SIG "Fitness Machine Status" characteristic. First byte is an opcode; 0x04 means the
// machine was started/resumed (from its own console, not necessarily from this app), 0x02/0x03
// mean it was stopped or paused.
export function parseFitnessMachineStatus(base64Value: string): FitnessMachineStatusEvent {
  const bytes = decodeBase64ToBytes(base64Value);
  const opcode = bytes[0];

  if (opcode === 0x04) {
    return { type: 'started' };
  }

  if (opcode === 0x02 || opcode === 0x03) {
    return { type: 'stopped' };
  }

  return { type: 'other', opcode };
}
