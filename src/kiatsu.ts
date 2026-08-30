// 東京の気圧予報から偏頭痛の注意レベルを判定する
// データ元: Open-Meteo（無料・APIキー不要・CORS対応）

export type KiatsuLevel = 0 | 1 | 2 | 3; // 0=安心 1=やや注意 2=注意 3=警戒

export interface KiatsuDay {
  date: string;       // YYYY-MM-DD
  level: KiatsuLevel;
  minPressure: number; // その日の最低気圧(hPa)
  maxDrop: number;     // 6時間以内の最大下げ幅(hPa)
  dropTime: string | null; // 最大下げ幅が起きる時間帯（「昼すぎ」など）
}

const API_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917' +
  '&hourly=pressure_msl&timezone=Asia%2FTokyo&forecast_days=2';

function timeframeLabel(hour: number): string {
  if (hour <= 5) return '明け方';
  if (hour <= 10) return '朝';
  if (hour <= 14) return '昼すぎ';
  if (hour <= 18) return '夕方';
  return '夜';
}

function judgeLevel(maxDrop: number, minPressure: number): KiatsuLevel {
  if (maxDrop >= 8 || minPressure < 995) return 3;
  if (maxDrop >= 5 || minPressure < 1002) return 2;
  if (maxDrop >= 3 || minPressure < 1008) return 1;
  return 0;
}

// 30分キャッシュ（ホームに戻るたびに取得し直さないため）
let cache: { at: number; days: KiatsuDay[] } | null = null;

export async function fetchKiatsu(): Promise<KiatsuDay[]> {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) return cache.days;

  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`kiatsu fetch failed: ${res.status}`);
  const json = await res.json();
  const times: string[] = json.hourly.time;
  const pressures: number[] = json.hourly.pressure_msl;

  const dates = Array.from(new Set(times.map(t => t.slice(0, 10))));
  const days: KiatsuDay[] = dates.map(date => {
    const idxs = times.map((t, i) => (t.startsWith(date) ? i : -1)).filter(i => i >= 0);
    const minPressure = Math.min(...idxs.map(i => pressures[i]));

    // その日に始まる6時間窓での最大下げ幅（日をまたぐ下降も拾う）
    let maxDrop = 0;
    let dropIdx: number | null = null;
    for (const i of idxs) {
      for (let j = i + 1; j <= Math.min(i + 6, pressures.length - 1); j++) {
        const drop = pressures[i] - pressures[j];
        if (drop > maxDrop) { maxDrop = drop; dropIdx = j; }
      }
    }
    const dropTime = dropIdx !== null && times[dropIdx].startsWith(date)
      ? timeframeLabel(Number(times[dropIdx].slice(11, 13)))
      : null;

    return {
      date,
      level: judgeLevel(maxDrop, minPressure),
      minPressure: Math.round(minPressure),
      maxDrop: Math.round(maxDrop * 10) / 10,
      dropTime,
    };
  });

  cache = { at: Date.now(), days };
  return days;
}

export const LEVEL_INFO: Record<KiatsuLevel, { name: string; emoji: string; message: string }> = {
  0: { name: '安心',     emoji: '😊', message: '気圧は安定してるよ。今日もいい一日になりますように✨' },
  1: { name: 'やや注意', emoji: '😐', message: '気圧が少し下がるかも。「あれ？」と思ったら早めにひと休みしてね' },
  2: { name: '注意',     emoji: '⚠️', message: '気圧が下がる予報だよ。頭痛薬をそばに置いて、むりしないでね' },
  3: { name: '警戒',     emoji: '🚨', message: '気圧がぐっと下がる予報…！頭痛薬の準備と、予定は控えめにね' },
};
