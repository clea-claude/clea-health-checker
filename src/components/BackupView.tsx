import { useRef, useState } from 'react';
import type { DayRecord, SeiriRecord, WeightRecord } from '../types';

interface BackupData {
  exportedAt: string;
  health?: Record<string, DayRecord>;
  seiri?: SeiriRecord[];
  weight?: WeightRecord[];
}

interface Props {
  records: Record<string, DayRecord>;
  seiriRecords: SeiriRecord[];
  weightRecords: WeightRecord[];
  onRestore: (health: Record<string, DayRecord>, seiri: SeiriRecord[], weight: WeightRecord[]) => Promise<void>;
  onBack: () => void;
}

export default function BackupView({ records, seiriRecords, weightRecords, onRestore, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const data: BackupData = {
      exportedAt: new Date().toISOString(),
      health: records,
      seiri: seiriRecords,
      weight: weightRecords,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `clea-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;

        // 旧形式（kurea-*キー）との互換性
        const rawData = data as unknown as Record<string, unknown>;
        const health: Record<string, DayRecord> =
          (data.health as Record<string, DayRecord>) ??
          (rawData['kurea-health-records'] as Record<string, DayRecord>) ?? {};
        const seiri: SeiriRecord[] =
          (data.seiri as SeiriRecord[]) ??
          (rawData['kurea-seiri-records'] as SeiriRecord[]) ?? [];
        const weight: WeightRecord[] =
          (data.weight as WeightRecord[]) ??
          (rawData['kurea-weight-records'] as WeightRecord[]) ?? [];

        setImporting(true);
        await onRestore(health, seiri, weight);
        setImportMsg({ ok: true, text: '復元完了！データをもどしました 🐾' });
      } catch {
        setImportMsg({ ok: false, text: 'ファイルの読み込みに失敗しました。正しいバックアップファイルか確認してください。' });
      } finally {
        setImporting(false);
        if (fileRef.current) fileRef.current.value = '';
      }
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
          全データをJSONファイルとしてダウンロードします。
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
          disabled={importing}
        >
          {importing ? '復元中…' : '📂 ファイルを選んで復元'}
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
    </div>
  );
}
