import { verifyAuth } from '../_lib/verifyAuth.js';
import { db } from '../_lib/firebase-admin.js';

export default async function handler(req, res) {
  const user = await verifyAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const ref = db.collection('users').doc(user.uid);
      const doc = await ref.get();
      const data = doc.exists ? doc.data() : { uid: user.uid, email: user.email || '', name: user.name || user.displayName || '' };
      return res.status(200).json({ profile: data });
    } catch (e) {
      console.error('profile get error', e);
      return res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  if (req.method === 'PATCH' || req.method === 'POST') {
    try {
      const { name } = req.body || {};
      const ref = db.collection('users').doc(user.uid);
      await ref.set({ uid: user.uid, email: user.email || '', name: name || '', createdAt: new Date().toISOString() }, { merge: true });
      const doc = await ref.get();
      return res.status(200).json({ profile: doc.data() });
    } catch (e) {
      console.error('profile patch error', e);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
