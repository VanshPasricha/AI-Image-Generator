import { verifyAuth } from './_lib/verifyAuth.js';
import { rateLimit } from './_lib/rate-limit.js';
import { saveHistoryItem } from './_lib/saveHistory.js';
import { uploadBuffer } from './_lib/storage.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return;

  const { limited } = rateLimit({ key: `img:${user.uid}` });
  if (limited) return res.status(429).json({ error: 'Too Many Requests' });

  const { model, inputs, parameters, options } = req.body || {};
  if (!model || !inputs) {
    return res.status(400).json({ error: 'Missing required fields: model and inputs' });
  }

  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfiguration: HF_API_KEY is not set' });

  try {
    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;
    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs, parameters, options: { wait_for_model: true, user_cache: false, ...(options || {}) } }),
    });

    if (!hfResponse.ok) {
      let errMsg = 'Upstream error';
      try { const errJson = await hfResponse.json(); errMsg = errJson?.error || errMsg; } catch {}
      return res.status(hfResponse.status).json({ error: errMsg });
    }

    const contentType = hfResponse.headers.get('content-type') || 'image/png';
    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage and save history
    let imageUrl = null;
    try {
      const ext = contentType.includes('jpeg') ? 'jpg' : contentType.split('/')[1] || 'png';
      const path = `users/${user.uid}/images/${Date.now()}.${ext}`;
      imageUrl = await uploadBuffer({ buffer, contentType, path });
    } catch (e) {
      console.warn('Image upload failed', e);
    }

    try {
      await saveHistoryItem({
        userId: user.uid,
        serviceType: 'image',
        input: inputs,
        output: imageUrl || '(inline-image)',
        metadata: { model, parameters },
      });
    } catch (e) {
      console.warn('History save failed', e);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('generate-image error:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
