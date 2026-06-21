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
  { value: 'ate',    label: 'おやつ食べた', emoji: '🍬', color: '#e8907a' },
] as const;

const SNACK_INFO = `「我慢できた！」何も食べなかった\n「少しだけ」量が少なかったりヘルシーなもの（300kcal以下が目安）\n「食べちゃった」🐖🤛`;

export default function TodayView({ records, onSave, editDate, onBack }: Props) {
  const targetDate = editDate ?? todayStr();
  const existing = records[targetDate];

  const [form, setForm] = useState<Omit<DayRecord, 'date' | 'sleepMinutes'>>({
    ...EMPTY,
    ...existing,
  });
  const [showSnackInfo, setShowSnackInfo] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

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
    { key: 'haiBen',      label: 'お通じ',         emoji: '☘️' },
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

      {/* おやつセクション */}
      <div className="snack-section">
        <div className="snack-title-row">
          <button
            className={`snack-toggle-btn ${snackOpen ? 'open' : ''} ${form.snack ? 'has-value' : ''}`}
            onClick={() => setSnackOpen(v => !v)}
          >
            <span className="check-emoji">🍬</span>
            <span className="check-label">おやつ</span>
            {form.snack && (
              <span className="snack-selected-badge">
                {SNACK_OPTIONS.find(o => o.value === form.snack)?.emoji}
              </span>
            )}
            <span className="snack-arrow">{snackOpen ? '▲' : '▼'}</span>
          </button>
          <div className="info-btn-wrap">
            <button className="info-btn" onClick={() => setShowSnackInfo(v => !v)}>ⓘ</button>
            {showSnackInfo && (
              <div className="snack-info-tooltip">
                {SNACK_INFO}
              </div>
            )}
          </div>
        </div>

        {snackOpen && (
          <div className="snack-options">
            {SNACK_OPTIONS.map(({ value, label, emoji, color }) => (
              <button
                key={value}
                className={`snack-option ${form.snack === value ? 'selected' : ''}`}
                style={form.snack === value ? { borderColor: color, background: `${color}18` } : {}}
                onClick={() => { setForm(f => ({ ...f, snack: value })); setSnackOpen(false); }}
              >
                <span className="snack-emoji">{emoji}</span>
                <span className="snack-label">{label}</span>
                {form.snack === value && <span className="check-mark">✓</span>}
              </button>
            ))}
          </div>
        )}
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
