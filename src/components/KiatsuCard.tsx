import { useEffect, useState } from 'react';
import { fetchKiatsu, LEVEL_INFO } from '../kiatsu';
import type { KiatsuDay } from '../kiatsu';
import './KiatsuCard.css';

export default function KiatsuCard() {
  const [days, setDays] = useState<KiatsuDay[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchKiatsu()
      .then(d => { if (alive) setDays(d); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  // 取得失敗時はカードごと出さない（ホームを汚さない）
  if (failed) return null;

  if (!days) {
    return <div className="kiatsu-card kiatsu-loading">🌀 気圧をしらべてるよ…</div>;
  }

  const [today, tomorrow] = days;
  const info = LEVEL_INFO[today.level];
  const tmrInfo = tomorrow ? LEVEL_INFO[tomorrow.level] : null;

  return (
    <div className={`kiatsu-card kiatsu-level-${today.level}`}>
      <div className="kiatsu-line">
        <span className="kiatsu-title">🌀 気圧</span>
        <span className="kiatsu-badge">{info.emoji} {info.name}</span>
        {today.maxDrop >= 3 && today.dropTime && (
          <span className="kiatsu-detail">{today.dropTime}に−{today.maxDrop}hPa</span>
        )}
        {tmrInfo && (
          <span className="kiatsu-tomorrow">／ あした {tmrInfo.emoji}{tmrInfo.name}</span>
        )}
      </div>
      {today.level >= 1 && <div className="kiatsu-message">{info.message}</div>}
    </div>
  );
}
