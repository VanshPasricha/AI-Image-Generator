import { app, auth, db } from '../_lib/firebase-admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Ensure user profile doc
    const decoded = await auth.verifyIdToken(idToken);
    const ref = db.collection('users').doc(decoded.uid);
    await ref.set({
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || decoded.displayName || '',
      createdAt: new Date().toISOString(),
    }, { merge: true });

    const proto = (req.headers['x-forwarded-proto'] || '').toString();
    const secure = proto === 'https' || process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', `session=${sessionCookie}; Max-Age=${expiresIn / 1000}; Path=/; HttpOnly; SameSite=Lax; ${secure ? 'Secure' : ''}`);
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('session cookie error', e);
    return res.status(401).json({ error: 'Failed to create session' });
  }
}
