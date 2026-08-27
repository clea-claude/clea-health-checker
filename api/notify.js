// 定時通知を送るサーバーレス関数（Vercel Cronから呼ばれる）
// /api/notify?type=weight  … 月曜朝の体重リマインド
// /api/notify?type=seiri   … 生理予定日前日・当日のリマインド
// /api/notify?type=sleep   … 就寝・起床時間の入力忘れリマインド
// /api/notify?type=morning … 朝10時のまとめ実行（seiri + sleep）
//   ※Vercel Hobbyプランはcron 2本までなので、毎日の通知は morning に統合している
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
  const TYPES = ['weight', 'seiri', 'sleep', 'morning'];
  if (!TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${TYPES.join(', ')}` });
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

    const payloads = [];
    if (type === 'weight') {
      payloads.push({
        title: '⚖️ 体重をはかる日だよ！',
        body: '月曜日だよ！体重を測ってきろくしてね！',
      });
    }
    if (type === 'seiri' || type === 'morning') {
      const seiri = parseValue(await userRef.collection('data').doc('seiri').get(), []);
      const next = calcNextPeriodDate(seiri);
      if (next && next === jstDateStr(1)) {
        // 前日リマインド
        payloads.push({
          title: '🩸 生理予定日のお知らせ',
          body: '明日は生理の予定日だよ〜ナプキン用意しておこうね！',
        });
      } else if (next && next === jstDateStr(0)) {
        // 当日リマインド
        payloads.push({
          title: '🩸 今日は生理の予定日',
          body: '今日は生理の予定日だよ。きたらアプリで「開始をきろく」してね。むりせず過ごそうね🫶',
        });
      }
    }
    if (type === 'sleep' || type === 'morning') {
      // 今日の記録に就寝・起床時間が両方そろっていなければリマインド
      const health = parseValue(await userRef.collection('data').doc('health').get(), {});
      const today = health[jstDateStr(0)];
      if (!today || !today.suiminJikan || !today.kiShoBjikan) {
        payloads.push({
          title: '😴 すいみんの記録わすれてない？',
          body: '今日の就寝時間と起床時間がまだ入力されてないよ！忘れないうちにきろくしてね🐾',
        });
      }
    }
    if (!payloads.length) { skipped++; continue; }

    const alive = [];
    for (const sub of subs) {
      let ok = true;
      for (const payload of payloads) {
        try {
          await webpush.sendNotification(sub, JSON.stringify(payload));
          sent++;
        } catch (e) {
          // 端末側で解除された購読は掃除する
          if (e.statusCode === 404 || e.statusCode === 410) { ok = false; removed++; }
          else { console.error('送信エラー:', e.statusCode, e.message); }
          break;
        }
      }
      if (ok) alive.push(sub);
    }
    if (alive.length !== subs.length) {
      await userRef.collection('data').doc('push').set({ value: JSON.stringify(alive) });
    }
  }

  return res.status(200).json({ type, sent, skipped, removed });
}
