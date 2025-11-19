export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    res.setHeader('Set-Cookie', 'session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure');
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(200).json({ success: true });
  }
}
