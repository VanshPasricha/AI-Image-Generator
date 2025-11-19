import { auth } from './firebase-admin.js';

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf('=');
        return idx > -1 ? [decodeURIComponent(c.slice(0, idx)), decodeURIComponent(c.slice(idx + 1))] : [c, ''];
      })
  );
}

export async function verifyAuth(req, res) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      const decoded = await auth.verifyIdToken(token, true);
      return decoded; // contains uid, email, name, etc.
    }

    // Fallback to Firebase session cookie
    const cookies = parseCookies(req.headers.cookie || '');
    const sessionCookie = cookies.session || cookies.__session; // __session works on some hosts
    if (sessionCookie) {
      const decoded = await auth.verifySessionCookie(sessionCookie, true);
      return decoded;
    }

    res.status(401).json({ error: 'Unauthorized' });
    return null;
  } catch (e) {
    console.error('Auth verification failed:', e);
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}
