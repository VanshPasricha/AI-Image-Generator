import { verifyAuth } from './_lib/verifyAuth.js';

export default async function handler(req, res) {
  // Only accept POST requests for image generation
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Authentication is optional for demo purposes
  // In production, you'd want to enforce authentication
  let user = null;

  // Extract parameters from request body
  // Support both 'prompt' and 'inputs' field names for flexibility
  const { model, inputs, prompt, parameters, options } = req.body || {};
  const promptText = prompt || inputs;

  // Validate required fields
  if (!model || !promptText) {
    return res.status(400).json({ error: 'Missing required fields: model and prompt/inputs' });
  }

  // Get API key from environment variables (never hardcode!)
  const apiKey = process.env.HF_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfiguration: HF_API_KEY is not set' });
  }

  try {
    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;

    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: promptText,
        parameters,
        options: { wait_for_model: true, user_cache: false, ...(options || {}) },
      }),
    });

    if (!hfResponse.ok) {
      let errMsg = 'Upstream error';
      try {
        const errJson = await hfResponse.json();
        errMsg = errJson?.error || errMsg;
      } catch (e) {
        // Ignore JSON parse error
      }
      return res.status(hfResponse.status).json({ error: errMsg });
    }

    // Get image data
    const contentType = hfResponse.headers.get('content-type') || 'image/png';
    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('HF proxy error:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
