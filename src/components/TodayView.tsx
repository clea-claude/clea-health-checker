import { useState, useEffect } from 'react';
import type { DayRecord, MaintenanceRecord } from '../types';
import { calcSleepMinutes, formatSleep, SUIMIN_LIST, KISHO_LIST, todayStr, getStreak } from '../utils';
import './TodayView.css';

interface Props {
  records: Record<string, DayRecord>;
  maintenanceRecords: MaintenanceRecord[];
  onSave: (date: string, rec: DayRecord) => void;
  onSaveMaintenance: (records: MaintenanceRecord[]) => void;
  editDate?: string;
  onBack?: () => void;
}

const MAINT_CATEGORIES = [
  { key: '整体',     emoji: '🦴' },
  { key: 'マッサージ', emoji: '💆‍♀️' },
  { key: 'エステ',   emoji: '✨' },
  { key: '美容院',   emoji: '💇‍♀️' },
  { key: 'その他',   emoji: '🌿' },
];

const EMPTY: Omit<DayRecord, 'date' | 'sleepMinutes'> = {
  haiBen: false,
  seiriStart: false,
  seiriEnd: false,
  zutsuu: false,
  zutsuuYaku: false,
  asaWalking: false,
  nichuUndou: false,
  ofuro: false,
  suiminJikan: '',
  kiShoBjikan: '',
};

function buildPointRows(
  form: Omit<DayRecord, 'date' | 'sleepMinutes'>,
  sleepMin: number,
  streak: number
): { label: string; pts: number }[] {
  const rows: { label: string; pts: number }[] = [];
  const baseBonus = Math.min(streak + 1, 5);
  rows.push({ label: `きろくボーナス（${streak}日連続）`, pts: baseBonus });
  if (form.haiBen)      rows.push({ label: 'お通じ ☘️',        pts: 5 });
  if (form.asaWalking)  rows.push({ label: '朝さんぽ 🌅', pts: 5 });
  if (form.nichuUndou)  rows.push({ label: '運動 🏃',           pts: 10 });
  if (sleepMin >= 7 * 60)     rows.push({ label: '睡眠7h以上 😴',  pts: 10 });
  else if (sleepMin > 0 && sleepMin < 6 * 60)
    rows.push({ label: '睡眠6h未満 😵',  pts: -10 });
  return rows;
}

export default function TodayView({ records, maintenanceRecords, onSave, onSaveMaintenance, editDate, onBack }: Props) {
  const targetDate = editDate ?? todayStr();
  const existing = records[targetDate];

  const [form, setForm] = useState<Omit<DayRecord, 'date' | 'sleepMinutes'>>({
    ...EMPTY,
    ...existing,
  });
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [maintCategory, setMaintCategory] = useState('');
  const [maintMemo, setMaintMemo] = useState('');

  const dayMaintenance = maintenanceRecords.filter(r => r.date === targetDate);

  useEffect(() => {
    const rec = records[targetDate];
    setForm({ ...EMPTY, ...rec });
    setMaintCategory('');
    setMaintMemo('');
    setMaintOpen(false);
  }, [targetDate]);

  const sleepMin = calcSleepMinutes(form.suiminJikan, form.kiShoBjikan);
  // 保存後のストリークを先読み計算（今日の記録を仮追加）
  const tempRecords = { ...records, [targetDate]: { ...form, date: targetDate, sleepMinutes: sleepMin } };
  const streak = getStreak(tempRecords, targetDate);
  const pointRows = buildPointRows(form, sleepMin, streak);
  const totalPts = pointRows.reduce((s, r) => s + r.pts, 0);

  const toggle = (key: keyof typeof EMPTY) => {
    if (typeof form[key] !== 'boolean') return;
    setForm(f => ({ ...f, [key]: !f[key] }));
  };

  const handleSave = () => {
    // メンテナンスが選択されていたら一緒に記録する
    if (maintCategory) {
      onSaveMaintenance([
        ...maintenanceRecords,
        { date: targetDate, category: maintCategory, memo: maintMemo.trim() || undefined },
      ]);
    }
    onSave(targetDate, { ...form, date: targetDate, sleepMinutes: sleepMin });
  };

  const isToday = targetDate === todayStr();

  const labelMap: { key: keyof typeof EMPTY; label: string; emoji: string }[] = [
    { key: 'haiBen',      label: 'お通じ',         emoji: '☘️' },
    { key: 'zutsuu',      label: '頭痛',          emoji: '🤕' },
    { key: 'zutsuuYaku',  label: '頭痛薬',        emoji: '💊' },
    { key: 'asaWalking',  label: '朝さんぽ', emoji: '🌅' },
    { key: 'nichuUndou',  label: '運動',          emoji: '🏃' },
    { key: 'ofuro',       label: 'お風呂',        emoji: '🛁' },
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

      {/* メンテナンスセクション */}
      <div className="snack-section">
        <div className="snack-title-row">
          <button
            className={`snack-toggle-btn ${maintOpen ? 'open' : ''} ${maintCategory || dayMaintenance.length ? 'has-value' : ''}`}
            onClick={() => setMaintOpen(v => !v)}
          >
            <span className="check-emoji">💆‍♀️</span>
            <span className="check-label">メンテナンス</span>
            {(maintCategory || dayMaintenance.length > 0) && (
              <span className="snack-selected-badge">
                {maintCategory
                  ? MAINT_CATEGORIES.find(c => c.key === maintCategory)?.emoji
                  : MAINT_CATEGORIES.find(c => c.key === dayMaintenance[0].category)?.emoji}
              </span>
            )}
            <span className="snack-arrow">{maintOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {maintOpen && (
          <div className="snack-options">
            {/* この日の記録済みメンテナンス */}
            {dayMaintenance.map((rec, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', background: '#faf4ec', borderRadius: 12,
                fontSize: '0.88rem', color: '#5c4033',
              }}>
                <span>{MAINT_CATEGORIES.find(c => c.key === rec.category)?.emoji ?? '🌿'}</span>
                <span style={{ flex: 1 }}>
                  {rec.category}{rec.memo ? `｜${rec.memo}` : ''}（記録済み）
                </span>
                <button
                  className="seiri-delete-btn"
                  onClick={() => onSaveMaintenance(maintenanceRecords.filter(r => r !== rec))}
                >✕</button>
              </div>
            ))}
            {MAINT_CATEGORIES.map(({ key, emoji }) => (
              <button
                key={key}
                className={`snack-option ${maintCategory === key ? 'selected' : ''}`}
                style={maintCategory === key ? { borderColor: '#c49a6c', background: '#c49a6c18' } : {}}
                onClick={() => setMaintCategory(k => k === key ? '' : key)}
              >
                <span className="snack-emoji">{emoji}</span>
                <span className="snack-label">{key}</span>
                {maintCategory === key && <span className="check-mark">✓</span>}
              </button>
            ))}
            {maintCategory && (
              <input
                type="text"
                value={maintMemo}
                onChange={e => setMaintMemo(e.target.value)}
                placeholder="詳細メモ（任意）例：カット＆カラー"
                maxLength={50}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                  border: '1.5px solid #f0e0c8', borderRadius: 12,
                  fontSize: '0.9rem', fontFamily: 'inherit', color: '#5c4033', background: 'white',
                }}
              />
            )}
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

      <button className="save-btn" onClick={() => setShowPointsPopup(true)}>
        きろくする 🐾
      </button>

      {/* ポイント内訳ポップアップ */}
      {showPointsPopup && (
        <div className="points-overlay" onClick={() => setShowPointsPopup(false)}>
          <div className="points-popup" onClick={e => e.stopPropagation()}>
            <h3 className="points-popup-title">🏅 今日のポイント</h3>
            <div className="points-rows">
              {pointRows.map(({ label, pts }) => (
                <div key={label} className="points-row">
                  <span className="points-row-label">{label}</span>
                  <span className={`points-row-val ${pts < 0 ? 'neg' : 'pos'}`}>
                    {pts >= 0 ? `+${pts}` : pts}pt
                  </span>
                </div>
              ))}
            </div>
            <div className="points-total">
              合計
              <span className={totalPts < 0 ? 'neg' : 'pos'}>
                {totalPts >= 0 ? `+${totalPts}` : totalPts}pt
              </span>
            </div>
            <div className="points-popup-actions">
              <button className="points-cancel-btn" onClick={() => setShowPointsPopup(false)}>
                もどる
              </button>
              <button className="points-confirm-btn" onClick={() => { setShowPointsPopup(false); handleSave(); }}>
                きろくする 🐾
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
