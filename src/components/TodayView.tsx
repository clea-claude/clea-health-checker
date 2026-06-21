import { useState, useEffect } from 'react';
import type { DayRecord } from '../types';
import { calcSleepMinutes, formatSleep, SUIMIN_LIST, KISHO_LIST, todayStr } from '../utils';
import './TodayView.css';

interface Props {
  records: Record<string, DayRecord>;
  onSave: (date: string, rec: DayRecord) => void;
  editDate?: string;
  onBack?: () => void;
}

const EMPTY: Omit<DayRecord, 'date' | 'sleepMinutes'> = {
  haiBen: false,
  seiriStart: false,
  seiriEnd: false,
  zutsuu: false,
  zutsuuYaku: false,
  asaWalking: false,
  nichuUndou: false,
  suiminJikan: '',
  kiShoBjikan: '',
  snack: '',
};

const SNACK_OPTIONS = [
  { value: 'none',   label: '我慢できた！', emoji: '💪', color: '#7dbf8e' },
  { value: 'little', label: 'すこしだけ',   emoji: '🌿', color: '#c49a6c' },
  { value: 'ate',    label: '食べちゃった', emoji: '🐖', color: '#e8907a' },
] as const;

const SNACK_INFO = [
  { label: '我慢できた！', desc: '何も食べなかった🙌' },
  { label: 'すこしだけ',   desc: '量が少なかったり、ヘルシーなもの（300kcal以下が目安）🥗' },
  { label: '食べちゃった', desc: '🐖🤛 …でもきろくえらい！' },
];

export default function TodayView({ records, onSave, editDate, onBack }: Props) {
  const targetDate = editDate ?? todayStr();
  const existing = records[targetDate];

  const [form, setForm] = useState<Omit<DayRecord, 'date' | 'sleepMinutes'>>({
    ...EMPTY,
    ...existing,
  });
  const [showSnackInfo, setShowSnackInfo] = useState(false);

  useEffect(() => {
    const rec = records[targetDate];
    setForm({ ...EMPTY, ...rec });
  }, [targetDate]);

  const sleepMin = calcSleepMinutes(form.suiminJikan, form.kiShoBjikan);

  const toggle = (key: keyof typeof EMPTY) => {
    if (typeof form[key] !== 'boolean') return;
    setForm(f => ({ ...f, [key]: !f[key] }));
  };

  const handleSave = () => {
    onSave(targetDate, { ...form, date: targetDate, sleepMinutes: sleepMin });
  };

  const isToday = targetDate === todayStr();

  const labelMap: { key: keyof typeof EMPTY; label: string; emoji: string }[] = [
    { key: 'haiBen',      label: '排便',          emoji: '🚽' },
    { key: 'seiriStart',  label: '生理・開始',     emoji: '🔴' },
    { key: 'seiriEnd',    label: '生理・終了',     emoji: '⭕' },
    { key: 'zutsuu',      label: '頭痛',          emoji: '🤕' },
    { key: 'zutsuuYaku',  label: '頭痛薬',        emoji: '💊' },
    { key: 'asaWalking',  label: '朝ウォーキング', emoji: '🌅' },
    { key: 'nichuUndou',  label: '運動',          emoji: '🏃' },
  ];

  const dateLabel = isToday
    ? '今日'
    : new Date(targetDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

  return (
    <div className="today-view">
      <div className="today-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>← もどる</button>
        )}
        <h2 className="today-title">{dateLabel}のきろく</h2>
      </div>

      <div className="check-grid">
        {labelMap.map(({ key, label, emoji }) => (
          <button
            key={key}
            className={`check-item ${form[key] ? 'checked' : ''}`}
            onClick={() => toggle(key)}
          >
            <span className="check-emoji">{emoji}</span>
            <span className="check-label">{label}</span>
            <span className="check-mark">{form[key] ? '✓' : ''}</span>
          </button>
        ))}
      </div>

      {/* 間食セクション */}
      <div className="snack-section">
        <div className="snack-title-row">
          <h3 className="snack-title">🍬 かんしょく</h3>
          <button className="info-btn" onClick={() => setShowSnackInfo(v => !v)}>ⓘ</button>
        </div>

        {showSnackInfo && (
          <div className="snack-info-popup">
            {SNACK_INFO.map(({ label, desc }) => (
              <div key={label} className="snack-info-row">
                <span className="snack-info-label">「{label}」</span>
                <span className="snack-info-desc">{desc}</span>
              </div>
            ))}
          </div>
        )}

        <div className="snack-options">
          {SNACK_OPTIONS.map(({ value, label, emoji, color }) => (
            <button
              key={value}
              className={`snack-option ${form.snack === value ? 'selected' : ''}`}
              style={form.snack === value ? { borderColor: color, background: `${color}18` } : {}}
              onClick={() => setForm(f => ({ ...f, snack: value }))}
            >
              <span className="snack-emoji">{emoji}</span>
              <span className="snack-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 睡眠セクション */}
      <div className="sleep-section">
        <h3 className="sleep-title">💤 すいみん</h3>
        <div className="sleep-row">
          <label>就寝時間</label>
          <select
            value={form.suiminJikan}
            onChange={e => setForm(f => ({ ...f, suiminJikan: e.target.value }))}
          >
            <option value="">--</option>
            {SUIMIN_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="sleep-row">
          <label>起床時間</label>
          <select
            value={form.kiShoBjikan}
            onChange={e => setForm(f => ({ ...f, kiShoBjikan: e.target.value }))}
          >
            <option value="">--</option>
            {KISHO_LIST.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="sleep-result">
          睡眠時間：<strong>{formatSleep(sleepMin)}</strong>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        きろくする 🐾
      </button>
    </div>
  );
}
