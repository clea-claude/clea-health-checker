import { useEffect, useState } from 'react';
import { enablePush, disablePush, isPushEnabled, isPushSupported } from '../push';

interface Props {
  uid: string;
  onBack: () => void;
}

export default function NotificationView({ uid, onBack }: Props) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    isPushEnabled().then(setEnabled);
  }, []);

  const handleToggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (enabled) {
        await disablePush(uid);
        setEnabled(false);
        setMsg({ ok: true, text: 'この端末の通知をオフにしたよ' });
      } else {
        const res = await enablePush(uid);
        if (res.ok) {
          setEnabled(true);
          setMsg({ ok: true, text: '通知をオンにしたよ！🐾' });
        } else {
          setMsg({ ok: false, text: res.reason ?? '設定に失敗しちゃった' });
        }
      }
    } catch (e) {
      console.error(e);
      setMsg({ ok: false, text: '設定に失敗しちゃった。もう一度試してみてね。' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="weight-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">🔔 通知設定</h2>
      </div>

      <div className="weight-main-card" style={{ textAlign: 'left' }}>
        <div className="weight-status-label">とどく通知</div>
        <div style={{ fontSize: '0.9rem', color: '#5c4033', lineHeight: 1.8, margin: '10px 0 16px' }}>
          🩸 生理予定日の前日 12:00<br />
          「明日は生理の予定日だよ〜ナプキン用意しておこうね！」<br /><br />
          ⚖️ 毎週月曜日 朝5:00<br />
          「月曜日だよ！体重を測ってきろくしてね！」
        </div>

        <button
          className="weight-save-btn"
          style={{ width: '100%', padding: '14px', background: enabled ? '#d4b896' : '#c49a6c' }}
          onClick={handleToggle}
          disabled={busy || enabled === null}
        >
          {busy ? '設定中…' : enabled ? '🔕 この端末の通知をオフにする' : '🔔 この端末で通知をオンにする'}
        </button>

        {msg && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 12,
            background: msg.ok ? '#d4f0d8' : '#fde8e8',
            color: msg.ok ? '#3a8a4a' : '#c06060',
            fontSize: '0.88rem', fontWeight: 700,
          }}>
            {msg.text}
          </div>
        )}
      </div>

      <div style={{ padding: '0 4px' }}>
        <p style={{ fontSize: '0.8rem', color: '#b0967e', lineHeight: 1.7 }}>
          💡 iPhoneで通知を受け取るには<br />
          ① Safariでこのアプリを開く<br />
          ② 共有ボタン →「ホーム画面に追加」<br />
          ③ ホーム画面のアイコンからアプリを開く<br />
          ④ この画面で「通知をオンにする」を押す<br /><br />
          ※ 通知はオンにした端末ごとに届きます。スマホとPCどちらにも欲しい場合は、それぞれの端末でオンにしてね。
          {!isPushSupported() && (
            <><br /><br />⚠️ いま開いているこの環境はプッシュ通知に対応していません。上の手順でホーム画面から開き直してね。</>
          )}
        </p>
      </div>
    </div>
  );
}
