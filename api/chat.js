import { verifyAuth } from './_lib/verifyAuth.js';
import { rateLimit } from './_lib/rate-limit.js';
import { saveHistoryItem } from './_lib/saveHistory.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Optional auth: respond 401 for now to enforce login for chat service
  const user = await verifyAuth(req, res);
  if (!user) return;

  const { limited } = rateLimit({ key: `chat:${user.uid}` });
  if (limited) return res.status(429).json({ error: 'Too Many Requests' });

  try {
    const { messages, model: modelIn, temperature = 0.7, max_new_tokens = 256 } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    const model = modelIn || 'HuggingFaceH4/zephyr-7b-beta';

    // Build a prompt from messages
    const prompt = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n') + '\nAssistant:';

    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;
    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HF_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { temperature, max_new_tokens, return_full_text: false },
      }),
    });

    if (!hfResponse.ok) {
      let errText = await hfResponse.text();
      try { errText = JSON.parse(errText).error || errText; } catch {}
      return res.status(hfResponse.status).json({ error: errText });
    }

    const data = await hfResponse.json();
    let reply = '';
    if (Array.isArray(data) && data[0]?.generated_text) reply = data[0].generated_text;
    else if (typeof data?.generated_text === 'string') reply = data.generated_text;
    else reply = JSON.stringify(data);

    try {
      await saveHistoryItem({
        userId: user.uid,
        serviceType: 'chat',
        input: messages[messages.length - 1]?.content || '(no input)',
        output: reply,
        metadata: { model, temperature, tokens: max_new_tokens },
      });
    } catch {}

    return res.status(200).json({ reply });
  } catch (e) {
    console.error('chat error', e);
    return res.status(500).json({ error: 'Chat failed' });
  }
}
