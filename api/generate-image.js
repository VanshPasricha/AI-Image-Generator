import { verifyAuth } from './_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError, ExternalServiceError, validators } from './_lib/error-handler.js';
import { validateImageGeneration } from './_lib/input-validator.js';
import { rateLimiter } from './_lib/enhanced-rate-limit.js';
import { uploadBuffer } from './_lib/firebase-admin.js';
import { HistoryManager } from './_lib/user-manager.js';

export default asyncHandler(async function handler(req, res) {
  validateMethod(['POST'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  // Apply enhanced rate limiting
  await new Promise((resolve, reject) => {
    rateLimiter.image(() => `img:${user.uid}`)(req, res, (error) => {
      if (error) {
        return reject(new ValidationError(error.message || 'Rate limit exceeded'));
      }
      resolve();
    });
  });

  const startTime = Date.now();
  let publicUrl = null;

  try {
    // Validate and sanitize input
    const { prompt, ...params } = req.body || {};
    const sanitizedInput = validateImageGeneration({ prompt, ...params });
    const sanitizedPrompt = sanitizedInput.prompt;
    const sanitizedParams = sanitizedInput.parameters;

    // Call Hugging Face API
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: sanitizedPrompt, parameters: sanitizedParams }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new ExternalServiceError('Image generation service unavailable', hfResponse.status);
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
      publicUrl = imageUrl;
    } catch (e) {
      console.warn('Image upload failed (non-critical):', e.message);
    }

    // Save to history with enhanced metadata
    await HistoryManager.saveHistoryItem({
      userId: user.uid,
      serviceType: 'image',
      input: sanitizedPrompt,
      output: publicUrl,
      metadata: {
        model: 'black-forest-labs/FLUX.1-dev',
        parameters: sanitizedParams,
        processingTime: Date.now() - startTime,
        cost: '0.001', // Approximate cost
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).send(buffer);
    
  } catch (error) {
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    console.error('Image generation error:', error);
    throw new ValidationError('Failed to generate image');
  }
});
