export interface DayRecord {
  date: string; // YYYY-MM-DD
  haiBen: boolean;
  seiriStart: boolean;
  seiriEnd: boolean;
  zutsuu: boolean;
  zutsuuYaku: boolean;
  asaWalking: boolean;
  nichuUndou: boolean;
  suiminJikan: string; // "20:00" など
  kiShoBjikan: string; // "06:00" など
  sleepMinutes: number;
  snack: 'none' | 'little' | 'ate' | '';
}

export type EmmaState = 'happy' | 'normal' | 'sleepy' | 'deadEyes';

export interface SeiriRecord {
  startDate: string;  // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface WeightRecord {
  date: string;   // YYYY-MM-DD
  weight: number; // kg
}
