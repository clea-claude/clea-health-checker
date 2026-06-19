import { useState, useEffect } from 'react';
import type { DayRecord } from '../types';
import { calcSleepMinutes, formatSleep, SUIMIN_LIST, KISHO_LIST, todayStr } from '../utils';
import './TodayView.css';

interface Props {
  records: Record<string, DayRecord>;
  onSave: (date: string, rec: DayRecord) => void;
  editDate?: string; // カレンダーから編集モードで開く場合
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
};

export default function TodayView({ records, onSave, editDate, onBack }: Props) {
  const targetDate = editDate ?? todayStr();
  const existing = records[targetDate];

  const [form, setForm] = useState<Omit<DayRecord, 'date' | 'sleepMinutes'>>({
    ...EMPTY,
    ...existing,
  });

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
    { key: 'haiBen',      label: '排便',      emoji: '🚽' },
    { key: 'seiriStart',  label: '生理・開始', emoji: '🔴' },
    { key: 'seiriEnd',    label: '生理・終了', emoji: '⭕' },
    { key: 'zutsuu',      label: '頭痛',      emoji: '🤕' },
    { key: 'zutsuuYaku',  label: '頭痛薬',    emoji: '💊' },
    { key: 'asaWalking',  label: '朝ウォーキング', emoji: '🌅' },
    { key: 'nichuUndou',  label: '運動', emoji: '🏃' },
  ];

  const dateLabel = isToday
    ? '今日'
    : new Date(targetDate + 'T00:00:00').toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });

  return (
    <div className="today-view">
      <div className="today-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>← 戻る</button>
        )}
        <h2 className="today-title">{dateLabel}の記録</h2>
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

      <div className="sleep-section">
        <h3 className="sleep-title">💤 睡眠</h3>
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
        保存する 🐾
      </button>
    </div>
  );
}
