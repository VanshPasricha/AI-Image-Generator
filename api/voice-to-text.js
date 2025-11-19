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
  if (!user) return; // response already sent

  const { limited } = rateLimit({ key: `stt:${user.uid}` });
  if (limited) return res.status(429).json({ error: 'Too Many Requests' });

  try {
    const { audioBase64, contentType, model: modelIn } = req.body || {};
    if (!audioBase64 || !contentType) {
      return res.status(400).json({ error: 'Missing fields: audioBase64, contentType' });
    }

    const model = modelIn || 'openai/whisper-large-v3';
    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;

    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': contentType },
      body: Buffer.from(audioBase64, 'base64'),
    });

    if (!hfResponse.ok) {
      let msg = await hfResponse.text();
      try { msg = JSON.parse(msg).error || msg; } catch {}
      return res.status(hfResponse.status).json({ error: msg });
    }

    const result = await hfResponse.json();
    const text = result.text || result?.[0]?.text || JSON.stringify(result);

    // Upload audio to storage (optional)
    let audioUrl = null;
    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      const ext = contentType.split('/')[1] || 'webm';
      const path = `users/${user.uid}/voice/${Date.now()}.${ext}`;
      audioUrl = await uploadBuffer({ buffer, contentType, path });
    } catch (e) {
      // best-effort
      console.warn('Audio upload failed', e);
    }

    // Save history
    try {
      await saveHistoryItem({
        userId: user.uid,
        serviceType: 'voice',
        input: audioUrl || '(inline-audio)',
        output: text,
        metadata: { model, contentType },
      });
    } catch {}

    return res.status(200).json({ text, audioUrl });
  } catch (e) {
    console.error('voice-to-text error', e);
    return res.status(500).json({ error: 'Transcription failed' });
  }
}
