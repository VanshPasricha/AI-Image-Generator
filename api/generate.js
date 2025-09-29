export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { model, inputs, parameters, options } = req.body || {};
  if (!model || !inputs) {
    return res.status(400).json({ error: 'Missing required fields: model and inputs' });
  }

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
        inputs,
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
        // ignore
      }
      return res.status(hfResponse.status).json({ error: errMsg });
    }

    // Proxy content back to the client as an image/blob
    const contentType = hfResponse.headers.get('content-type') || 'image/png';
    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('HF proxy error:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
