import type { DayRecord, EmmaState, EmmaLevel } from './types';

export function calcSleepMinutes(suimin: string, kisho: string): number {
  if (!suimin || !kisho) return 0;
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const s = toMin(suimin);
  const k = toMin(kisho);
  return s > k ? 1440 - s + k : k - s;
}

export function getEmmaState(sleepMinutes: number): EmmaState {
  if (sleepMinutes === 0) return 'normal';
  if (sleepMinutes >= 7 * 60) return 'happy';
  if (sleepMinutes >= 6 * 60) return 'normal';
  if (sleepMinutes >= 4 * 60) return 'sleepy';
  return 'deadEyes';
}

export function getStreak(records: Record<string, DayRecord>, today: string): number {
  let streak = 0;
  let d = new Date(today);
  while (true) {
    const key = d.toISOString().slice(0, 10);
    const rec = records[key];
    const hasAny = rec && Object.values(rec).some((v, i) => i > 1 && v !== '' && v !== 0 && v !== false);
    if (!hasAny) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getLevel(streak: number): EmmaLevel {
  if (streak >= 30) return 4;
  if (streak >= 7) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export function formatSleep(minutes: number): string {
  if (minutes === 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export function toDateStr(date: Date): string {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-');
}

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const SUIMIN_OPTIONS: string[] = [];
for (let h = 20; h <= 25; h++) {
  for (const m of [0, 30]) {
    const realH = h >= 24 ? h - 24 : h;
    SUIMIN_OPTIONS.push(`${String(realH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
// 20:00 ~ 01:00 (翌)
export const SUIMIN_LIST = SUIMIN_OPTIONS.slice(0, 13); // 20:00,20:30,...,01:00

const KISHO_OPTIONS: string[] = [];
for (let h = 4; h <= 12; h++) {
  for (const m of [0, 30]) {
    if (h === 12 && m === 30) continue;
    KISHO_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
export const KISHO_LIST = KISHO_OPTIONS;

export function hasAnyRecord(rec: DayRecord | undefined): boolean {
  if (!rec) return false;
  return (
    rec.haiBen || rec.seiriStart || rec.seiriEnd || rec.zutsuu ||
    rec.zutsuuYaku || rec.asaWalking || rec.nichuUndou ||
    !!rec.suiminJikan || !!rec.kiShoBjikan
  );
}
