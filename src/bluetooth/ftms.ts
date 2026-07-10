// Bluetooth SIG "Fitness Machine Service" (FTMS) - standard GATT profile used by
// many treadmills, including this one. Spec: Bluetooth SIG FTMS v1.0.
export const FITNESS_MACHINE_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
export const TREADMILL_DATA_CHARACTERISTIC_UUID = '00002acd-0000-1000-8000-00805f9b34fb';
export const FITNESS_MACHINE_CONTROL_POINT_UUID = '00002ad9-0000-1000-8000-00805f9b34fb';
export const FITNESS_MACHINE_STATUS_UUID = '00002ada-0000-1000-8000-00805f9b34fb';

const ControlPointOpCode = {
  requestControl: 0x00,
  reset: 0x01,
  setTargetSpeed: 0x02,
  startOrResume: 0x07,
  stopOrPause: 0x08,
} as const;

const StopPauseParameter = {
  stop: 0x01,
  pause: 0x02,
} as const;

export type ControlPointResult = {
  requestOpCode: number;
  resultCode: number;
  isSuccess: boolean;
};

export function decodeControlPointResponse(bytes: number[]): ControlPointResult | null {
  if (bytes.length < 3 || bytes[0] !== 0x80) {
    return null;
  }

  return {
    requestOpCode: bytes[1],
    resultCode: bytes[2],
    isSuccess: bytes[2] === 0x01,
  };
}

export function encodeRequestControl(): number[] {
  return [ControlPointOpCode.requestControl];
}

export function encodeStartOrResume(): number[] {
  return [ControlPointOpCode.startOrResume];
}

export function encodeStopOrPause(mode: 'stop' | 'pause'): number[] {
  return [
    ControlPointOpCode.stopOrPause,
    mode === 'stop' ? StopPauseParameter.stop : StopPauseParameter.pause,
  ];
}

export function encodeSetTargetSpeed(speedKmh: number): number[] {
  const speedUnits = Math.round(speedKmh * 100);
  return [ControlPointOpCode.setTargetSpeed, speedUnits & 0xff, (speedUnits >> 8) & 0xff];
}

// Treadmill Data flags (bit position -> field). Only the bits this treadmill
// actually sets are handled; any other data-bearing bit we can't confidently
// size is rejected rather than risk misreading the rest of the payload.
const TreadmillDataFlag = {
  moreData: 1 << 0, // inverted: 0 means Instantaneous Speed IS present
  averageSpeed: 1 << 1,
  totalDistance: 1 << 2,
  inclinationAndRamp: 1 << 3,
  elevationGain: 1 << 4,
  instantaneousPace: 1 << 5,
  averagePace: 1 << 6,
  expendedEnergy: 1 << 7,
  heartRate: 1 << 8,
  metabolicEquivalent: 1 << 9,
  elapsedTime: 1 << 10,
  remainingTime: 1 << 11,
  forceAndPower: 1 << 12,
} as const;

const UNHANDLED_DATA_FLAGS =
  TreadmillDataFlag.inclinationAndRamp |
  TreadmillDataFlag.elevationGain |
  TreadmillDataFlag.instantaneousPace |
  TreadmillDataFlag.averagePace |
  TreadmillDataFlag.metabolicEquivalent |
  TreadmillDataFlag.remainingTime |
  TreadmillDataFlag.forceAndPower;

export type TreadmillData = {
  speedKmh: number | null;
  distanceMeters: number | null;
  caloriesKcal: number | null;
  heartRateBpm: number | null;
  elapsedSeconds: number | null;
};

function readUInt16LE(bytes: number[], offset: number): number {
  return bytes[offset] + (bytes[offset + 1] << 8);
}

function readUInt24LE(bytes: number[], offset: number): number {
  return bytes[offset] + (bytes[offset + 1] << 8) + (bytes[offset + 2] << 16);
}

export function decodeTreadmillData(bytes: number[]): TreadmillData | null {
  if (bytes.length < 2) {
    return null;
  }

  const flags = readUInt16LE(bytes, 0);

  if (flags & UNHANDLED_DATA_FLAGS) {
    return null;
  }

  let offset = 2;
  const data: TreadmillData = {
    speedKmh: null,
    distanceMeters: null,
    caloriesKcal: null,
    heartRateBpm: null,
    elapsedSeconds: null,
  };

  if ((flags & TreadmillDataFlag.moreData) === 0) {
    if (bytes.length < offset + 2) return data;
    data.speedKmh = readUInt16LE(bytes, offset) / 100;
    offset += 2;
  }

  if (flags & TreadmillDataFlag.averageSpeed) {
    offset += 2;
  }

  if (flags & TreadmillDataFlag.totalDistance) {
    if (bytes.length < offset + 3) return data;
    data.distanceMeters = readUInt24LE(bytes, offset);
    offset += 3;
  }

  if (flags & TreadmillDataFlag.expendedEnergy) {
    if (bytes.length < offset + 5) return data;
    data.caloriesKcal = readUInt16LE(bytes, offset);
    offset += 5; // total energy (2) + energy/hour (2) + energy/minute (1)
  }

  if (flags & TreadmillDataFlag.heartRate) {
    if (bytes.length < offset + 1) return data;
    data.heartRateBpm = bytes[offset];
    offset += 1;
  }

  if (flags & TreadmillDataFlag.elapsedTime) {
    if (bytes.length < offset + 2) return data;
    data.elapsedSeconds = readUInt16LE(bytes, offset);
    offset += 2;
  }

  return data;
}
