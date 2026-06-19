import { useState, useEffect } from 'react';
import type { DayRecord } from './types';
import { getEmmaState, getStreak, getLevel, todayStr } from './utils';
import Emma from './components/Emma';
import TodayView from './components/TodayView';
import CalendarView from './components/CalendarView';
import './App.css';

const STORAGE_KEY = 'kurea-health-records';

type Tab = 'today' | 'calendar';

function loadRecords(): Record<string, DayRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const [records, setRecords] = useState<Record<string, DayRecord>>(loadRecords);
  const [tab, setTab] = useState<Tab>('today');
  const [editDate, setEditDate] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);

  const today = todayStr();
  const todayRec = records[today];
  const streak = getStreak(records, today);
  const level = getLevel(streak);
  const emmaState = getEmmaState(todayRec?.sleepMinutes ?? 0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const handleSave = (date: string, rec: DayRecord) => {
    setRecords(r => ({ ...r, [date]: rec }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSelectDate = (date: string) => {
    setEditDate(date);
    setTab('today');
  };

  const handleBack = () => {
    setEditDate(undefined);
    setTab('calendar');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🐾 くれあのヘルスチェッカー</h1>
      </header>

      <div className="emma-section">
        <Emma state={emmaState} level={level} />
        <span className="streak-text">🔥 {streak}日連続記録中</span>
      </div>

      {saved && (
        <div className="save-toast">保存しました！</div>
      )}

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'today' ? 'active' : ''}`}
          onClick={() => { setTab('today'); setEditDate(undefined); }}
        >
          📝 今日の記録
        </button>
        <button
          className={`tab-btn ${tab === 'calendar' ? 'active' : ''}`}
          onClick={() => { setTab('calendar'); setEditDate(undefined); }}
        >
          📅 カレンダー
        </button>
      </div>

      <main className="app-main">
        {tab === 'today' ? (
          <TodayView
            records={records}
            onSave={handleSave}
            editDate={editDate}
            onBack={editDate ? handleBack : undefined}
          />
        ) : (
          <CalendarView
            records={records}
            onSelectDate={handleSelectDate}
          />
        )}
      </main>
    </div>
  );
}
