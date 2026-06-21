import { useState, useEffect } from 'react';
import type { DayRecord, EmmaState, EmmaLevel } from './types';
import { getEmmaState, getStreak, getLevel, todayStr, calcPoints } from './utils';
import TodayView from './components/TodayView';
import CalendarView from './components/CalendarView';
import emmaImg from './assets/emma.png';
import './App.css';

const STORAGE_KEY = 'kurea-health-records';

type View = 'home' | 'record';

function loadRecords(): Record<string, DayRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const levelNames: Record<EmmaLevel, string> = {
  1: 'こいぬ',
  2: 'げんきなこいぬ',
  3: 'せいけん',
  4: 'プリンセス',
};

const stateMessages: Record<EmmaState, string> = {
  happy:    'おかえり〜！きょうもいっしょにきろくしよ 🐾',
  normal:   'おかえり！きょうのきろく、つけてみよ 📝',
  sleepy:   'ねむそう…すいみんとれてる？きろくしてね 💤',
  deadEyes: 'だいじょうぶ…？むりしないでね。きろくしとこ 😵',
};

export default function App() {
  const [records, setRecords] = useState<Record<string, DayRecord>>(loadRecords);
  const [view, setView] = useState<View>('home');
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const today = todayStr();
  const todayRec = records[today];
  const streak = getStreak(records, today);
  const level = getLevel(streak);
  const emmaState = getEmmaState(todayRec?.sleepMinutes ?? 0);
  const todayPoints = todayRec ? calcPoints(todayRec, streak) : null;

  // 今日の日付・曜日
  const dateObj = new Date();
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) + ' ' + dayOfWeek;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleSave = (date: string, rec: DayRecord) => {
    const newRecords = { ...records, [date]: rec };
    setRecords(newRecords);
    const newStreak = getStreak(newRecords, date);
    setLastPoints(calcPoints(rec, newStreak));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setView('home');
    setEditDate(undefined);
  };

  const handleSelectDate = (date: string) => {
    setEditDate(date);
    setView('record');
  };

  const handleKiroku = () => {
    setEditDate(undefined);
    setView('record');
  };

  // レベルバー（30日で満タン）
  const streakBarWidth = Math.min((streak / 30) * 100, 100);

  return (
    <div className="app">
      {/* ハンバーガーメニュー */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-drawer" onClick={e => e.stopPropagation()}>
            <div className="menu-drawer-header">
              <span className="menu-drawer-title">メニュー</span>
              <button className="menu-close-btn" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <nav className="menu-nav">
              <button className="menu-item" onClick={() => { setView('home'); setEditDate(undefined); setMenuOpen(false); }}>
                🏠 ホーム
              </button>
              <button className="menu-item" onClick={() => { setView('home'); setMenuOpen(false); }}>
                📅 カレンダー
              </button>
              <div className="menu-divider" />
              <button className="menu-item menu-item-disabled" disabled>
                🩸 生理ページ <span className="menu-coming-soon">じゅんびちゅう</span>
              </button>
              <button className="menu-item menu-item-disabled" disabled>
                ⚖️ 体重きろく <span className="menu-coming-soon">じゅんびちゅう</span>
              </button>
              <button className="menu-item menu-item-disabled" disabled>
                🏆 ポイント履歴 <span className="menu-coming-soon">じゅんびちゅう</span>
              </button>
              <button className="menu-item menu-item-disabled" disabled>
                💾 バックアップ <span className="menu-coming-soon">じゅんびちゅう</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="app-header">
        <div className="header-emma-icon" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          {!imgError ? (
            <img src={emmaImg} alt="エマ" onError={() => setImgError(true)} />
          ) : (
            <span className="header-emma-icon-placeholder">🐾</span>
          )}
        </div>
        <div className="header-info">
          <div>
            <span className="header-name">エマ</span>
          </div>
          <div>
            <span className="header-level">Lv.{level}</span>
            <span className="header-level-name">{levelNames[level]}</span>
          </div>
          <div className="header-streak-bar">
            <div className="header-streak-fill" style={{ width: `${streakBarWidth}%` }} />
          </div>
        </div>
        <button className="hamburger-btn" onClick={() => setMenuOpen(true)}>≡</button>
      </header>

      {saved && (
        <div className="save-toast">
          きろくしたよ！🐾
          {lastPoints !== null && (
            <span className="save-toast-pts">
              {lastPoints >= 0 ? `+${lastPoints}` : lastPoints}pt
            </span>
          )}
        </div>
      )}

      <main className="app-main">
        {view === 'home' ? (
          <div className="home-view">
            {/* 日付 */}
            <div className="today-date-label">{dateLabel}</div>

            {/* エマ */}
            <div className="emma-main-section">
              {!imgError ? (
                <img
                  src={emmaImg}
                  alt="エマ"
                  className={`emma-main-img state-${emmaState}`}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="emma-placeholder">🐾</div>
              )}
            </div>

            {/* 吹き出し */}
            <div className="speech-bubble">
              {stateMessages[emmaState]}
            </div>

            {/* きろくボタン */}
            <button className="kiroku-btn" onClick={handleKiroku}>
              📝 きろくする
            </button>

            {/* 統計カード */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">れんぞくきろく</div>
                <div className="stat-value">
                  {streak}<span className="stat-unit">にち</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">きょうのすいみん</div>
                <div className="stat-value">
                  {todayRec?.sleepMinutes
                    ? `${Math.floor(todayRec.sleepMinutes / 60)}`
                    : '—'}
                  {todayRec?.sleepMinutes
                    ? <span className="stat-unit">じかん</span>
                    : null}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">きょうのポイント</div>
                <div className="stat-value" style={{ color: todayPoints !== null && todayPoints < 0 ? '#e8907a' : '#c49a6c' }}>
                  {todayPoints !== null ? (todayPoints >= 0 ? `+${todayPoints}` : todayPoints) : '—'}
                  {todayPoints !== null && <span className="stat-unit">pt</span>}
                </div>
              </div>
            </div>

            {/* カレンダー */}
            <div className="home-calendar-section">
              <div className="home-calendar-header">📅 カレンダー</div>
              <CalendarView records={records} onSelectDate={handleSelectDate} />
            </div>
          </div>
        ) : (
          <TodayView
            records={records}
            onSave={handleSave}
            editDate={editDate}
            onBack={() => { setView('home'); setEditDate(undefined); }}
          />
        )}
      </main>
    </div>
  );
}
