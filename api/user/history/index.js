import { verifyAuth } from '../../_lib/verifyAuth.js';
import { listHistory } from '../../_lib/saveHistory.js';

export default async function handler(req, res) {
  const user = await verifyAuth(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    const { serviceType, limit } = req.query || {};
    try {
      const items = await listHistory({ userId: user.uid, serviceType, limit: limit ? Number(limit) : 50 });
      return res.status(200).json({ items });
    } catch (e) {
      console.error('history list error', e);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
