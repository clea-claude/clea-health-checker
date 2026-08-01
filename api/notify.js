// 定時通知を送るサーバーレス関数（Vercel Cronから呼ばれる）
// /api/notify?type=weight … 月曜朝の体重リマインド
// /api/notify?type=seiri  … 生理予定日前日のリマインド
import admin from 'firebase-admin';
import webpush from 'web-push';

function initAdmin() {
  if (admin.apps.length) return;
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

// JSTの日付文字列 YYYY-MM-DD（daysOffset日後）
function jstDateStr(daysOffset = 0) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + daysOffset * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

// 過去の生理記録から次回予定日を計算（アプリ側と同じロジック）
function calcNextPeriodDate(records) {
  const starts = records.map(r => r.startDate).sort();
  if (starts.length < 2) return null;
  const diffs = starts.slice(1).map((s, i) =>
    Math.round((new Date(s).getTime() - new Date(starts[i]).getTime()) / 86400000));
  const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  const next = new Date(starts[starts.length - 1]);
  next.setDate(next.getDate() + avg);
  return next.toISOString().slice(0, 10);
}

function parseValue(snap, fallback) {
  if (!snap.exists) return fallback;
  try { return JSON.parse(snap.data().value); } catch { return fallback; }
}

export default async function handler(req, res) {
  // Cron以外からの呼び出しを拒否
  if (process.env.CRON_SECRET &&
      req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const type = req.query.type;
  if (type !== 'weight' && type !== 'seiri') {
    return res.status(400).json({ error: 'type must be weight or seiri' });
  }

  initAdmin();
  webpush.setVapidDetails(
    'mailto:subemiviny@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const db = admin.firestore();
  const userRefs = await db.collection('users').listDocuments();
  let sent = 0, skipped = 0, removed = 0;

  for (const userRef of userRefs) {
    const pushSnap = await userRef.collection('data').doc('push').get();
    const subs = parseValue(pushSnap, []);
    if (!subs.length) { skipped++; continue; }

    let payload = null;
    if (type === 'weight') {
      payload = {
        title: '⚖️ 体重をはかる日だよ！',
        body: '月曜日だよ！体重を測ってきろくしてね！',
      };
    } else {
      const seiri = parseValue(await userRef.collection('data').doc('seiri').get(), []);
      const next = calcNextPeriodDate(seiri);
      if (next && next === jstDateStr(1)) {
        payload = {
          title: '🩸 生理予定日のお知らせ',
          body: '明日は生理の予定日だよ〜ナプキン用意しておこうね！',
        };
      }
    }
    if (!payload) { skipped++; continue; }

    const alive = [];
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
        alive.push(sub);
        sent++;
      } catch (e) {
        // 端末側で解除された購読は掃除する
        if (e.statusCode === 404 || e.statusCode === 410) { removed++; }
        else { alive.push(sub); console.error('送信エラー:', e.statusCode, e.message); }
      }
    }
    if (alive.length !== subs.length) {
      await userRef.collection('data').doc('push').set({ value: JSON.stringify(alive) });
    }
  }

  return res.status(200).json({ type, sent, skipped, removed });
}
