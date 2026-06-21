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
export type EmmaLevel = 1 | 2 | 3 | 4;
