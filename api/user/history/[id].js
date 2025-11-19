import { verifyAuth } from '../../_lib/verifyAuth.js';
import { deleteHistory } from '../../_lib/saveHistory.js';

export default async function handler(req, res) {
  const user = await verifyAuth(req, res);
  if (!user) return;

  const { id } = req.query || {};

  if (req.method === 'DELETE') {
    try {
      const ok = await deleteHistory({ userId: user.uid, id });
      if (!ok) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    } catch (e) {
      if (e.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' });
      console.error('history delete error', e);
      return res.status(500).json({ error: 'Failed to delete item' });
    }
  }

  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ error: 'Method Not Allowed' });
}
