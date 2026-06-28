import { useRef, useState } from 'react';

interface Props {
  initialNickname?: string;
  initialPhotoURL?: string;
  onSave: (nickname: string, photoURL: string) => Promise<void>;
  isEdit?: boolean;
  onBack?: () => void;
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ProfileSetupView({ initialNickname = '', initialPhotoURL = '', onSave, isEdit, onBack }: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [photoURL, setPhotoURL] = useState(initialPhotoURL);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const resized = await resizeImage(file, 200);
    setPhotoURL(resized);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!nickname.trim()) return;
    setSaving(true);
    await onSave(nickname.trim(), photoURL);
    setSaving(false);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100svh', padding: '32px 24px', gap: 24,
      background: '#faf4ec',
    }}>
      {isEdit && onBack && (
        <div style={{ alignSelf: 'flex-start' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: '#9c7b6a', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ← もどる
          </button>
        </div>
      )}

      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#5c4033' }}>
        {isEdit ? 'プロフィールを編集' : 'はじめまして！'}
      </div>
      {!isEdit && (
        <div style={{ fontSize: '0.9rem', color: '#9c7b6a', textAlign: 'center' }}>
          ニックネームとアイコンを設定してね
        </div>
      )}

      {/* アイコン */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 120, height: 120, borderRadius: '50%',
            background: '#f5e6d0', border: '3px solid #e8c9a0',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {photoURL ? (
            <img src={photoURL} alt="アイコン" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '3rem' }}>🐾</span>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            background: 'white', border: '1.5px solid #f0e0c8', borderRadius: 20,
            padding: '8px 20px', fontSize: '0.85rem', color: '#9c7b6a',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          画像を選ぶ
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

      {/* ニックネーム */}
      <div style={{ width: '100%', maxWidth: 320 }}>
        <div style={{ fontSize: '0.85rem', color: '#9c7b6a', marginBottom: 8 }}>ニックネーム</div>
        <input
          type="text"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="名前を入力してね"
          maxLength={20}
          style={{
            width: '100%', padding: '14px 16px',
            border: '1.5px solid #f0e0c8', borderRadius: 14,
            fontSize: '1rem', fontFamily: 'inherit', color: '#5c4033',
            background: 'white', boxSizing: 'border-box',
            outline: 'none',
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!nickname.trim() || saving}
        style={{
          width: '100%', maxWidth: 320,
          padding: '16px', background: nickname.trim() ? '#c49a6c' : '#e0cdb8',
          color: 'white', border: 'none', borderRadius: 20,
          fontSize: '1rem', fontWeight: 700, cursor: nickname.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        {saving ? '保存中…' : isEdit ? '保存する' : 'スタート！🐾'}
      </button>
    </div>
  );
}
