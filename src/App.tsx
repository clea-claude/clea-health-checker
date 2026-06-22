import { useState, useEffect } from 'react';
import type { DayRecord, EmmaState, EmmaLevel, SeiriRecord } from './types';
import { getEmmaState, getStreak, getLevel, todayStr, calcPoints, sumPointsForDays } from './utils';
import TodayView from './components/TodayView';
import CalendarView from './components/CalendarView';
import SeiriView from './components/SeiriView';
import emmaImg from './assets/emma.png';
import './App.css';

const STORAGE_KEY = 'kurea-health-records';
const SEIRI_KEY = 'kurea-seiri-records';

type View = 'home' | 'record' | 'points-guide' | 'seiri';

function loadRecords(): Record<string, DayRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function loadSeiriRecords(): SeiriRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SEIRI_KEY) || '[]');
  } catch {
    return [];
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
  const [seiriRecords, setSeiriRecords] = useState<SeiriRecord[]>(loadSeiriRecords);
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

  // 週・月のポイント計算
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const monthDates = Array.from({ length: new Date().getDate() }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const weekPoints = sumPointsForDays(records, weekDates);
  const monthPoints = sumPointsForDays(records, monthDates);

  // 今日の日付・曜日
  const dateObj = new Date();
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) + ' ' + dayOfWeek;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(SEIRI_KEY, JSON.stringify(seiriRecords));
  }, [seiriRecords]);

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
              <button className="menu-item" onClick={() => { setView('seiri'); setMenuOpen(false); }}>
                🩸 生理きろく
              </button>
              <button className="menu-item menu-item-disabled" disabled>
                ⚖️ 体重きろく <span className="menu-coming-soon">じゅんびちゅう</span>
              </button>
              <button className="menu-item" onClick={() => { setView('points-guide'); setMenuOpen(false); }}>
                🏆 ポイント一覧
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
                <div className="stat-label">ポイント</div>
                <div className="stat-value" style={{ color: todayPoints !== null && todayPoints < 0 ? '#e8907a' : '#c49a6c' }}>
                  {todayPoints !== null ? (todayPoints >= 0 ? `+${todayPoints}` : todayPoints) : '—'}
                  {todayPoints !== null && <span className="stat-unit">pt</span>}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">すいみん</div>
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
                <div className="stat-label">れんぞくきろく</div>
                <div className="stat-value">
                  {streak}<span className="stat-unit">にち</span>
                </div>
              </div>
            </div>

            {/* 週・月ポイント */}
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

            {/* カレンダー */}
            <div className="home-calendar-section">
              <div className="home-calendar-header">📅 カレンダー</div>
              <CalendarView records={records} onSelectDate={handleSelectDate} />
            </div>
          </div>
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
                <span>きろくしただけ（1日目）</span><span className="pos">+5pt</span>
              </div>
              <div className="points-guide-row">
                <span>2日連続</span><span className="pos">+6pt</span>
              </div>
              <div className="points-guide-row">
                <span>3日連続</span><span className="pos">+7pt</span>
              </div>
              <div className="points-guide-row sub">
                <span>…1日ごとに+1pt、最大</span><span className="pos">+10pt</span>
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
