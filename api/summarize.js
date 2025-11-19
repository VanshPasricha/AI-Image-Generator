import { verifyAuth } from './_lib/verifyAuth.js';
import { rateLimit } from './_lib/rate-limit.js';
import { saveHistoryItem } from './_lib/saveHistory.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const user = await verifyAuth(req, res);
  if (!user) return;

  const { limited } = rateLimit({ key: `sum:${user.uid}` });
  if (limited) return res.status(429).json({ error: 'Too Many Requests' });

  try {
    const { text, model: modelIn, max_length = 180 } = req.body || {};
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const model = modelIn || 'facebook/bart-large-cnn';
    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;

    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: text, parameters: { max_length } }),
    });

    if (!hfResponse.ok) {
      let errText = await hfResponse.text();
      try { errText = JSON.parse(errText).error || errText; } catch {}
      return res.status(hfResponse.status).json({ error: errText });
    }

    const data = await hfResponse.json();
    const summary = Array.isArray(data) && data[0]?.summary_text ? data[0].summary_text : (data.summary_text || JSON.stringify(data));

    try {
      await saveHistoryItem({
        userId: user.uid,
        serviceType: 'summarize',
        input: text.slice(0, 5000),
        output: summary,
        metadata: { model, max_length },
      });
    } catch {}

    return res.status(200).json({ summary });
  } catch (e) {
    console.error('summarize error', e);
    return res.status(500).json({ error: 'Summarization failed' });
  }
}
