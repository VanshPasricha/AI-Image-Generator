import { db } from './firebase-admin.js';

export async function saveHistoryItem({ userId, serviceType, input, output, metadata = {} }) {
  if (!userId) throw new Error('Missing userId');
  const doc = {
    userId,
    serviceType,
    input,
    output,
    metadata,
    timestamp: new Date().toISOString(),
  };
  const ref = await db.collection('history').add(doc);
  return { id: ref.id, ...doc };
}

export async function listHistory({ userId, limit = 50, serviceType }) {
  let q = db.collection('history').where('userId', '==', userId).orderBy('timestamp', 'desc');
  if (serviceType) q = q.where('serviceType', '==', serviceType);
  if (limit) q = q.limit(limit);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteHistory({ userId, id }) {
  const ref = db.collection('history').doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  const data = doc.data();
  if (data.userId !== userId) throw new Error('Forbidden');
  await ref.delete();
  return true;
}
