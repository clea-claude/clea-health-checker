import { useState, useEffect, useMemo } from 'react';
import type { DayRecord, EmmaState, SeiriRecord, WeightRecord } from './types';
import { getEmmaState, getStreak, todayStr, calcPoints, sumPointsForDays } from './utils';
import TodayView from './components/TodayView';
import CalendarView from './components/CalendarView';
import SeiriView from './components/SeiriView';
import WeightView from './components/WeightView';
import BackupView from './components/BackupView';
import HistoryView from './components/HistoryView';
import DaySummaryView from './components/DaySummaryView';
import emma1  from './assets/emma/emma_1.png';
import emma2  from './assets/emma/emma_2.png';
import emma3  from './assets/emma/emma_3.png';
import emma6  from './assets/emma/emma_6.png';
import emma7  from './assets/emma/emma_7.png';
import emma8  from './assets/emma/emma_8.png';
import emma11 from './assets/emma/emma_11.png';
import emma13 from './assets/emma/emma_13.png';
import emma14 from './assets/emma/emma_14.png';
import emma15 from './assets/emma/emma_15.png';
import emma18 from './assets/emma/emma_18.png';
import emma22 from './assets/emma/emma_22.png';
import emma23 from './assets/emma/emma_23.png';
import emma24 from './assets/emma/emma_24.png';
import emma25 from './assets/emma/emma_25.png';
import emma30 from './assets/emma/emma_30.png';
import emma31 from './assets/emma/emma_31.png';
import emma32 from './assets/emma/emma_32.png';
import './App.css';

const STORAGE_KEY = 'kurea-health-records';
const SEIRI_KEY = 'kurea-seiri-records';
const WEIGHT_KEY = 'kurea-weight-records';

const EMMA_IMAGES = [
  emma1, emma2, emma3, emma6, emma7, emma8,
  emma11, emma13, emma14, emma15, emma18,
  emma22, emma23, emma24, emma25, emma30, emma31, emma32,
];

type View = 'home' | 'record' | 'points-guide' | 'seiri' | 'weight' | 'backup' | 'history' | 'day-summary';

function loadRecords(): Record<string, DayRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

const SEIRI_INITIAL: SeiriRecord[] = [
  { startDate: '2026-01-18', endDate: '2026-01-21' },
  { startDate: '2026-03-04', endDate: '2026-03-06' },
  { startDate: '2026-04-02', endDate: '2026-04-06' },
  { startDate: '2026-04-28', endDate: '2026-05-03' },
  { startDate: '2026-05-26', endDate: '2026-05-30' },
  { startDate: '2026-06-22' },
];

function loadSeiriRecords(): SeiriRecord[] {
  try {
    const stored = localStorage.getItem(SEIRI_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!parsed.length) {
      localStorage.setItem(SEIRI_KEY, JSON.stringify(SEIRI_INITIAL));
      return SEIRI_INITIAL;
    }
    return parsed;
  } catch {
    return [];
  }
}

function loadWeightRecords(): WeightRecord[] {
  try {
    return JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]');
  } catch {
    return [];
  }
}

function getThisWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysFromMon = day === 0 ? 6 : day - 1;
  return Array.from({ length: daysFromMon + 1 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
}

function getThisMonthDates(): string[] {
  return Array.from({ length: new Date().getDate() }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
}

const stateMessages: Record<EmmaState, string> = {
  happy:    'おかえり〜！きょうもいっしょにきろくしよ 🐾',
  normal:   'おかえり！きょうのきろく、つけてみよ 📝',
  sleepy:   'ねむそう…すいみんとれてる？きろくしてね 💤',
  deadEyes: 'だいじょうぶ…？むりしないでね。きろくしとこ 😵',
};

// 起動時にランダムで1枚選ぶ
const randomEmmaImg = EMMA_IMAGES[Math.floor(Math.random() * EMMA_IMAGES.length)];

export default function App() {
  const [records, setRecords] = useState<Record<string, DayRecord>>(loadRecords);
  const [seiriRecords, setSeiriRecords] = useState<SeiriRecord[]>(loadSeiriRecords);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>(loadWeightRecords);
  const [view, setView] = useState<View>('home');
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const today = todayStr();
  const todayRec = records[today];
  const streak = getStreak(records, today);
  const emmaState = getEmmaState(todayRec?.sleepMinutes ?? 0);
  const todayPoints = todayRec ? calcPoints(todayRec, streak) : null;

  const weekPoints = useMemo(() => sumPointsForDays(records, getThisWeekDates()), [records]);
  const monthPoints = useMemo(() => sumPointsForDays(records, getThisMonthDates()), [records]);

  const dateObj = new Date();
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) + ' ' + dayOfWeek;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(SEIRI_KEY, JSON.stringify(seiriRecords));
  }, [seiriRecords]);

  useEffect(() => {
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(weightRecords));
  }, [weightRecords]);

  // 月曜日に今週の体重未記録ならリマインダー
  const isMondayReminderNeeded = (() => {
    const now = new Date();
    if (now.getDay() !== 1) return false;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    return !weightRecords.some(r => new Date(r.date + 'T00:00:00') >= monday);
  })();

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
    // 今日は記録画面、過去日はサマリー画面
    if (date === today) {
      setView('record');
    } else {
      setView('day-summary');
    }
  };

  const handleKiroku = () => {
    setEditDate(undefined);
    setView('record');
  };

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
              <button className="menu-item" onClick={() => { setView('seiri'); setMenuOpen(false); }}>
                🩸 生理きろく
              </button>
              <button className="menu-item" onClick={() => { setView('weight'); setMenuOpen(false); }}>
                ⚖️ 体重きろく
              </button>
              <button className="menu-item" onClick={() => { setView('history'); setMenuOpen(false); }}>
                📊 履歴
              </button>
              <div className="menu-divider" />
              <button className="menu-item" onClick={() => { setView('points-guide'); setMenuOpen(false); }}>
                🏆 ポイント一覧
              </button>
              <button className="menu-item" onClick={() => { setView('backup'); setMenuOpen(false); }}>
                💾 バックアップ
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="app-header">
        <div className="header-emma-icon" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          {!imgError ? (
            <img src={randomEmmaImg} alt="エマ" onError={() => setImgError(true)} />
          ) : (
            <span className="header-emma-icon-placeholder">🐾</span>
          )}
        </div>
        <div className="header-info">
          <span className="header-name">エマ</span>
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
            <div className="today-date-label">{dateLabel}</div>

            <div className="emma-main-section">
              {!imgError ? (
                <img
                  src={randomEmmaImg}
                  alt="エマ"
                  className="emma-main-img"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="emma-placeholder">🐾</div>
              )}
            </div>

            <div className="speech-bubble">
              {isMondayReminderNeeded
                ? '月曜日だよ！今週の体重、測った？⚖️ きろくしてね！'
                : stateMessages[emmaState]}
            </div>

            <button className="kiroku-btn" onClick={handleKiroku}>
              📝 きろくする
            </button>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">ポイント</div>
                <div className="stat-value" style={{ color: todayPoints !== null && todayPoints < 0 ? '#e8907a' : '#c49a6c' }}>
                  {todayPoints !== null ? (todayPoints >= 0 ? `+${todayPoints}` : todayPoints) : '—'}
                  {todayPoints !== null && <span className="stat-unit">pt</span>}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">すいみん</div>
                <div className="stat-value">
                  {todayRec?.sleepMinutes ? `${Math.floor(todayRec.sleepMinutes / 60)}` : '—'}
                  {todayRec?.sleepMinutes ? <span className="stat-unit">じかん</span> : null}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">れんぞくきろく</div>
                <div className="stat-value">
                  {streak}<span className="stat-unit">にち</span>
                </div>
              </div>
            </div>

            <div className="period-points-row">
              <div className="period-points-item">
                <span className="period-points-label">今週</span>
                <span className="period-points-val">{weekPoints > 0 ? `+${weekPoints}` : weekPoints}pt</span>
              </div>
              <div className="period-points-divider" />
              <div className="period-points-item">
                <span className="period-points-label">今月</span>
                <span className="period-points-val">{monthPoints > 0 ? `+${monthPoints}` : monthPoints}pt</span>
              </div>
            </div>

            <div className="home-calendar-section">
              <div className="home-calendar-header">📅 カレンダー</div>
              <CalendarView records={records} onSelectDate={handleSelectDate} />
            </div>
          </div>
        ) : view === 'day-summary' ? (
          <DaySummaryView
            date={editDate!}
            record={records[editDate!]}
            records={records}
            onEdit={() => setView('record')}
            onBack={() => { setView('home'); setEditDate(undefined); }}
          />
        ) : view === 'history' ? (
          <HistoryView
            records={records}
            weightRecords={weightRecords}
            onBack={() => setView('home')}
          />
        ) : view === 'backup' ? (
          <BackupView
            onRestore={() => { window.location.reload(); }}
            onBack={() => setView('home')}
          />
        ) : view === 'weight' ? (
          <WeightView
            records={weightRecords}
            onSave={setWeightRecords}
            onBack={() => setView('home')}
          />
        ) : view === 'seiri' ? (
          <SeiriView
            records={seiriRecords}
            onSave={setSeiriRecords}
            onBack={() => setView('home')}
          />
        ) : view === 'points-guide' ? (
          <div className="points-guide-view">
            <div className="today-header">
              <button className="back-btn" onClick={() => setView('home')}>← もどる</button>
              <h2 className="today-title">ポイント一覧</h2>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">きろくボーナス</div>
              <div className="points-guide-row">
                <span>きろくしただけ（1日目）</span><span className="pos">+1pt</span>
              </div>
              <div className="points-guide-row">
                <span>2日連続</span><span className="pos">+2pt</span>
              </div>
              <div className="points-guide-row">
                <span>3日連続</span><span className="pos">+3pt</span>
              </div>
              <div className="points-guide-row sub">
                <span>…1日ごとに+1pt、最大</span><span className="pos">+5pt</span>
              </div>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">けんこう</div>
              <div className="points-guide-row">
                <span>☘️ お通じ</span><span className="pos">+5pt</span>
              </div>
              <div className="points-guide-row">
                <span>🌅 朝ウォーキング</span><span className="pos">+5pt</span>
              </div>
              <div className="points-guide-row">
                <span>🏃 運動</span><span className="pos">+10pt</span>
              </div>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">おやつ</div>
              <div className="points-guide-row">
                <span>💪 我慢できた！</span><span className="pos">+5pt</span>
              </div>
              <div className="points-guide-row">
                <span>🌿 すこしだけ</span><span className="neutral">±0pt</span>
              </div>
              <div className="points-guide-row">
                <span>🍬 食べちゃった</span><span className="neg">-5pt</span>
              </div>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">すいみん</div>
              <div className="points-guide-row">
                <span>😴 7時間以上</span><span className="pos">+10pt</span>
              </div>
              <div className="points-guide-row">
                <span>😐 6〜7時間</span><span className="neutral">±0pt</span>
              </div>
              <div className="points-guide-row">
                <span>😵 6時間未満</span><span className="neg">-10pt</span>
              </div>
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
