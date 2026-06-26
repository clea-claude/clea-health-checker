import { useState, useEffect, useMemo } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { DayRecord, SeiriRecord, WeightRecord } from './types';
import { getStreak, todayStr, calcPoints, sumPointsForDays } from './utils';
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

const EMMA_IMAGES = [
  emma1, emma2, emma3, emma6, emma7, emma8,
  emma11, emma13, emma14, emma15, emma18,
  emma22, emma23, emma24, emma25, emma30, emma31, emma32,
];


type View = 'home' | 'record' | 'points-guide' | 'seiri' | 'weight' | 'backup' | 'history' | 'day-summary';

function getThisWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
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

const EMMA_MESSAGES = [
  '子供のネガティブワードには反応しないよ〜🙅‍♀️',
  'すいみんが何よりだいじだよ！💤',
  '抱っこを求められたら即対応！抱っこできるのは今のうち！🫂',
  '毎日必ず子供に「大好きだよ」を伝えよう💖',
  'Cause you\'ll be nothing if you forget truly who you are',
  '子どもを見守ろう！失敗から自ら学ぶ機会を奪わないよ👌',
  'ケンカは見守るだけ。暴力が出たらレフリーストップしよ🛑',
  '子どもを「観察」して「実験」の繰り返し！🧪',
  '子どもに決めさせる！主体性伸ばそ！✨',
  '「甘え」を受け止める⭐️「人に頼ったら受け入れてもらえた」経験が大事だよ',
  '注意するときは子供の目を見て伝えよう！👀',
  '褒めるのではなく「認める」例:「最後まで諦めずにできたね！」👏',
  '大人も約束は必ず守る！「後でね」と言ったら後で必ずやろ。',
  '「ごめんね」の強制はしないで相手の気持ちを代弁しよう💁‍♀️',
  '言葉遣い注意！「やばい・まじ・ガチ」使わないよ〜🙅‍♀️',
  '何をしても泣いてばかり！→「元気になったらママの時に来てね」。落ち着いたら「自分で気持ちを落ち着かせられたね」。',
  '唇を尖らせているのは集中しているサイン(フロー状態)、能力を高めている途中！✨',
  '親が機嫌よく笑顔でいることが、どんな教育や声かけよりも大事🫶',
  '間違いを訂正しない！😉自分で間違いに気づき、考えさせるべし！',
];

const randomMessage = EMMA_MESSAGES[Math.floor(Math.random() * EMMA_MESSAGES.length)];
const randomEmmaImg = EMMA_IMAGES[Math.floor(Math.random() * EMMA_IMAGES.length)];

// Firestoreにデータを保存
async function saveToFirestore(uid: string, key: string, data: unknown) {
  await setDoc(doc(db, 'users', uid, 'data', key), { value: JSON.stringify(data) });
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [seiriRecords, setSeiriRecords] = useState<SeiriRecord[]>([]);
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [view, setView] = useState<View>('home');
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 認証状態を監視
  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u));
  }, []);

  // ログイン後にFirestoreをリアルタイム同期
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const unsubs = [
      onSnapshot(doc(db, 'users', uid, 'data', 'health'), snap => {
        if (snap.exists()) {
          setRecords(JSON.parse(snap.data().value));
        }
      }),
      onSnapshot(doc(db, 'users', uid, 'data', 'seiri'), snap => {
        if (snap.exists()) {
          setSeiriRecords(JSON.parse(snap.data().value));
        }
      }),
      onSnapshot(doc(db, 'users', uid, 'data', 'weight'), snap => {
        if (snap.exists()) {
          setWeightRecords(JSON.parse(snap.data().value));
        }
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [user]);

  const today = todayStr();
  const todayRec = records[today];
  const streak = getStreak(records, today);
  const todayPoints = todayRec ? calcPoints(todayRec, streak) : null;
  const weekPoints = useMemo(() => sumPointsForDays(records, getThisWeekDates()), [records]);
  const monthPoints = useMemo(() => sumPointsForDays(records, getThisMonthDates()), [records]);

  const dateObj = new Date();
  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' }) + ' ' + dayOfWeek;

  const isMondayReminderNeeded = (() => {
    const now = new Date();
    if (now.getDay() !== 1) return false;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    return !weightRecords.some(r => new Date(r.date + 'T00:00:00') >= monday);
  })();

  const handleSave = async (date: string, rec: DayRecord) => {
    const newRecords = { ...records, [date]: rec };
    setRecords(newRecords);
    if (user) {
      await saveToFirestore(user.uid, 'health', newRecords);
    }
    const newStreak = getStreak(newRecords, date);
    setLastPoints(calcPoints(rec, newStreak));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setView('home');
    setEditDate(undefined);
  };

  const handleSaveSeiri = async (data: SeiriRecord[]) => {
    setSeiriRecords(data);
    if (user) {
      await saveToFirestore(user.uid, 'seiri', data);
    }
  };

  const handleSaveWeight = async (data: WeightRecord[]) => {
    setWeightRecords(data);
    if (user) {
      await saveToFirestore(user.uid, 'weight', data);
    }
  };

  const handleSelectDate = (date: string) => {
    setEditDate(date);
    if (date === today) {
      setView('record');
    } else {
      setView('day-summary');
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    const uid = user.uid;
    await Promise.all([
      deleteDoc(doc(db, 'users', uid, 'data', 'health')),
      deleteDoc(doc(db, 'users', uid, 'data', 'seiri')),
      deleteDoc(doc(db, 'users', uid, 'data', 'weight')),
    ]);
    setRecords({});
    setSeiriRecords([]);
    setWeightRecords([]);
  };

  // ローディング中
  if (user === undefined) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh' }}>
        <div style={{ textAlign: 'center', color: '#c49a6c', fontWeight: 700 }}>
          <img src={randomEmmaImg} alt="エマ" style={{ width: 120, marginBottom: 16 }} />
          <div>よみこみちゅう…</div>
        </div>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="app" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', gap: 24 }}>
        <img src={randomEmmaImg} alt="エマ" style={{ width: 200 }} />
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#5c4033' }}>くれあのヘルスチェッカー</div>
        <div style={{ fontSize: '0.9rem', color: '#9c7b6a' }}>Googleアカウントでログインしてね</div>
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          style={{
            background: '#c49a6c', color: 'white', border: 'none',
            borderRadius: 20, padding: '14px 32px',
            fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🔑 Googleでログイン
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-drawer" onClick={e => e.stopPropagation()}>
            <div className="menu-drawer-header">
              <span className="menu-drawer-title">メニュー</span>
              <button className="menu-close-btn" onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            <nav className="menu-nav">
              <div className="menu-divider" style={{ marginTop: 0 }} />
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
              <div className="menu-divider" />
              <button className="menu-item" onClick={() => { signOut(auth); setMenuOpen(false); }} style={{ color: '#c06060' }}>
                🚪 ログアウト
              </button>
            </nav>
          </div>
        </div>
      )}

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
                <img src={randomEmmaImg} alt="エマ" className="emma-main-img" onError={() => setImgError(true)} />
              ) : (
                <div className="emma-placeholder">🐾</div>
              )}
            </div>
            <div className="speech-bubble">
              {isMondayReminderNeeded ? '月曜日だよ！今週の体重、測った？⚖️ きろくしてね！' : randomMessage}
            </div>
            <button className="kiroku-btn" onClick={() => { setEditDate(undefined); setView('record'); }}>
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
                <div className="stat-value">{streak}<span className="stat-unit">にち</span></div>
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
          <HistoryView records={records} weightRecords={weightRecords} onBack={() => setView('home')} />
        ) : view === 'backup' ? (
          <BackupView
            records={records}
            seiriRecords={seiriRecords}
            weightRecords={weightRecords}
            onRestore={async (health, seiri, weight) => {
              if (!user) return;
              const uid = user.uid;
              await Promise.all([
                saveToFirestore(uid, 'health', health),
                saveToFirestore(uid, 'seiri', seiri),
                saveToFirestore(uid, 'weight', weight),
              ]);
            }}
            onDeleteAll={handleDeleteAllData}
            onBack={() => setView('home')}
          />
        ) : view === 'weight' ? (
          <WeightView records={weightRecords} onSave={handleSaveWeight} onBack={() => setView('home')} />
        ) : view === 'seiri' ? (
          <SeiriView records={seiriRecords} onSave={handleSaveSeiri} onBack={() => setView('home')} />
        ) : view === 'points-guide' ? (
          <div className="points-guide-view">
            <div className="today-header">
              <button className="back-btn" onClick={() => setView('home')}>← もどる</button>
              <h2 className="today-title">ポイント一覧</h2>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">きろくボーナス</div>
              <div className="points-guide-row"><span>きろくしただけ（1日目）</span><span className="pos">+1pt</span></div>
              <div className="points-guide-row"><span>2日連続</span><span className="pos">+2pt</span></div>
              <div className="points-guide-row"><span>3日連続</span><span className="pos">+3pt</span></div>
              <div className="points-guide-row sub"><span>…1日ごとに+1pt、最大</span><span className="pos">+5pt</span></div>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">けんこう</div>
              <div className="points-guide-row"><span>☘️ お通じ</span><span className="pos">+5pt</span></div>
              <div className="points-guide-row"><span>🌅 朝ウォーキング</span><span className="pos">+5pt</span></div>
              <div className="points-guide-row"><span>🏃 運動</span><span className="pos">+10pt</span></div>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">おやつ</div>
              <div className="points-guide-row"><span>💪 我慢できた！</span><span className="pos">+5pt</span></div>
              <div className="points-guide-row"><span>🌿 すこしだけ</span><span className="neutral">±0pt</span></div>
              <div className="points-guide-row"><span>🍬 食べちゃった</span><span className="neg">-5pt</span></div>
            </div>
            <div className="points-guide-section">
              <div className="points-guide-category">すいみん</div>
              <div className="points-guide-row"><span>😴 7時間以上</span><span className="pos">+10pt</span></div>
              <div className="points-guide-row"><span>😐 6〜7時間</span><span className="neutral">±0pt</span></div>
              <div className="points-guide-row"><span>😵 6時間未満</span><span className="neg">-10pt</span></div>
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
