import { useRef, useState } from 'react';

interface Props {
  onRestore: () => void;
  onBack: () => void;
}

const KEYS = ['kurea-health-records', 'kurea-seiri-records', 'kurea-weight-records'];

export default function BackupView({ onRestore, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleExport = () => {
    const data: Record<string, unknown> = { exportedAt: new Date().toISOString() };
    KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `kurea-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        let restored = 0;
        KEYS.forEach(key => {
          if (data[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restored++;
          }
        });
        setImportMsg({ ok: true, text: `復元完了！${restored}件のデータをもどしました 🐾` });
        setTimeout(() => { onRestore(); }, 1500);
      } catch {
        setImportMsg({ ok: false, text: 'ファイルの読み込みに失敗しました。正しいバックアップファイルか確認してください。' });
      }
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="weight-view">
      <div className="today-header">
        <button className="back-btn" onClick={onBack}>← もどる</button>
        <h2 className="today-title">💾 バックアップ</h2>
      </div>

      {/* エクスポート */}
      <div className="weight-main-card" style={{ textAlign: 'left' }}>
        <div className="weight-status-label">データをほぞんする</div>
        <p style={{ fontSize: '0.88rem', color: '#9c7b6a', margin: '8px 0 16px' }}>
          全データをJSONファイルとしてダウンロードします。別のデバイスへの引き継ぎや、万が一のバックアップに使えます。
        </p>
        <button className="weight-save-btn" style={{ width: '100%', padding: '14px' }} onClick={handleExport}>
          ⬇️ バックアップをダウンロード
        </button>
      </div>

      {/* インポート */}
      <div className="weight-input-card">
        <div className="weight-input-label">データをふくげんする</div>
        <p style={{ fontSize: '0.85rem', color: '#9c7b6a', margin: '0 0 14px' }}>
          バックアップファイル（.json）を選ぶと、データが復元されます。<br />
          ⚠️ 現在のデータは上書きされます。
        </p>
        <button
          className="weight-save-btn"
          style={{ width: '100%', padding: '14px', background: '#d4b896' }}
          onClick={() => fileRef.current?.click()}
        >
          📂 ファイルを選んで復元
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        {importMsg && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 12,
            background: importMsg.ok ? '#d4f0d8' : '#fde8e8',
            color: importMsg.ok ? '#3a8a4a' : '#c06060',
            fontSize: '0.88rem',
            fontWeight: 700,
          }}>
            {importMsg.text}
          </div>
        )}
      </div>

      {/* 説明 */}
      <div style={{ padding: '0 4px' }}>
        <p style={{ fontSize: '0.8rem', color: '#b0967e', lineHeight: 1.7 }}>
          💡 スマホへの引き継ぎ方<br />
          ① このページで「バックアップをダウンロード」<br />
          ② ダウンロードしたファイルをスマホに送る（AirDrop・メール等）<br />
          ③ スマホのブラウザでアプリを開き、「ファイルを選んで復元」
        </p>
      </div>
    </div>
  );
}
