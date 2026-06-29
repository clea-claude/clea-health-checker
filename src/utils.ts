import type { DayRecord, EmmaState, SeiriRecord } from './types';

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

export function sumPointsForDays(
  records: Record<string, DayRecord>,
  dates: string[]
): number {
  return dates.reduce((total, date) => {
    const rec = records[date];
    if (!rec) return total;
    const s = getStreak(records, date);
    return total + calcPoints(rec, s);
  }, 0);
}

export function calcNextPeriodDate(records: SeiriRecord[]): string | null {
  const starts = records.map(r => r.startDate).sort();
  if (starts.length < 2) return null;
  const diffs = starts.slice(1).map((s, i) => Math.round((new Date(s).getTime() - new Date(starts[i]).getTime()) / 86400000));
  const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  const lastStart = starts[starts.length - 1];
  const next = new Date(lastStart);
  next.setDate(next.getDate() + avg);
  return next.toISOString().slice(0, 10);
}

export function calcPoints(rec: DayRecord, streak: number): number {
  let pts = 0;

  // きろくしただけボーナス（連続日数に応じて増加、上限5pt）
  pts += Math.min(streak + 1, 5);

  if (rec.haiBen) pts += 5;
  if (rec.asaWalking) pts += 5;
  if (rec.nichuUndou) pts += 10;

  if (rec.snack === 'none') pts += 5;
  if (rec.snack === 'ate') pts -= 5;

  if (rec.sleepMinutes >= 7 * 60) pts += 10;
  else if (rec.sleepMinutes > 0 && rec.sleepMinutes < 6 * 60) pts -= 10;

  return pts;
}
