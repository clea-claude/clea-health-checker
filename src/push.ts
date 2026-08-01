import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// 通知用の公開鍵（VAPID公開鍵。秘密鍵はサーバー側のみ）
export const VAPID_PUBLIC_KEY =
  'BGNtwb-9n0NTe9SZanYr-KshplhxjyfKc9eu9jzSoLaY_5HpIW1lohPmFKldTgbt73dsQhlIWdvqP80BdLNs4QY';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// 通知を有効化：許可をとってこの端末を登録する
export async function enablePush(uid: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: 'この環境はプッシュ通知に対応してないみたい。iPhoneは「ホーム画面に追加」したアプリから開いてね。' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: '通知が許可されなかったよ。端末の設定から通知を許可してね。' };
  }

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });

  // Firestoreにこの端末の購読情報を保存（複数端末対応）
  const ref = doc(db, 'users', uid, 'data', 'push');
  const snap = await getDoc(ref);
  let subs: unknown[] = [];
  if (snap.exists()) {
    try { subs = JSON.parse(snap.data().value); } catch { subs = []; }
  }
  const json = sub.toJSON();
  const others = (subs as { endpoint?: string }[]).filter(s => s.endpoint !== json.endpoint);
  await setDoc(ref, { value: JSON.stringify([...others, json]) });

  return { ok: true };
}

// この端末の通知を解除する
export async function disablePush(uid: string): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    const ref = doc(db, 'users', uid, 'data', 'push');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      try {
        const subs = JSON.parse(snap.data().value) as { endpoint?: string }[];
        await setDoc(ref, { value: JSON.stringify(subs.filter(s => s.endpoint !== sub.endpoint)) });
      } catch { /* noop */ }
    }
    await sub.unsubscribe();
  }
}

// この端末が登録済みか確認
export async function isPushEnabled(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  return !!sub && Notification.permission === 'granted';
}
