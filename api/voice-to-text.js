import { verifyAuth } from './_lib/verifyAuth.js';
import { rateLimit } from './_lib/rate-limit.js';
import { saveHistoryItem } from './_lib/saveHistory.js';
import { uploadBuffer } from './_lib/storage.js';
import { 
  asyncHandler, 
  validateMethod, 
  ValidationError, 
  ExternalServiceError,
  validators 
} from './_lib/error-handler.js';

export default asyncHandler(async function handler(req, res) {
  validateMethod(['POST'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  const { limited } = rateLimit({ key: `stt:${user.uid}` });
  if (limited) throw new ValidationError('Rate limit exceeded. Please try again later.');

  const { audioBase64, contentType, model: modelIn } = req.body || {};
  
  // Validate inputs
  validators.required(audioBase64, 'audioBase64');
  validators.required(contentType, 'contentType');
  validators.string(audioBase64, 'audioBase64', 5000000); // 5MB limit
  validators.string(contentType, 'contentType', 50);
  
  const model = modelIn || 'openai/whisper-large-v3';
  validators.string(model, 'model', 100);

  try {
    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;

    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.HF_API_KEY}`, 
        'Content-Type': contentType,
        'User-Agent': 'AI-Tools-Platform/1.0'
      },
      body: Buffer.from(audioBase64, 'base64'),
    });

    if (!hfResponse.ok) {
      let errMsg = 'Voice transcription service unavailable';
      try {
        const errJson = await hfResponse.json();
        errMsg = errJson?.error || errMsg;
      } catch {
        errMsg = hfResponse.statusText || errMsg;
      }
      throw new ExternalServiceError('HuggingFace', errMsg);
    }

    const result = await hfResponse.json();
    const text = result.text || result?.[0]?.text || JSON.stringify(result);
    
    if (!text || typeof text !== 'string') {
      throw new ValidationError('Transcription failed to return valid text');
    }

    // Upload audio to storage (optional)
    let audioUrl = null;
    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      const ext = contentType.split('/')[1] || 'webm';
      const path = `users/${user.uid}/voice/${Date.now()}.${ext}`;
      audioUrl = await uploadBuffer({ buffer, contentType, path });
    } catch (e) {
      console.warn('Audio upload failed (non-critical):', e.message);
    }

    // Save history
    try {
      await saveHistoryItem({
        userId: user.uid,
        serviceType: 'voice',
        input: audioUrl || '(inline-audio)',
        output: validators.sanitize(text),
        metadata: { model, contentType },
      });
    } catch (e) {
      console.warn('History save failed (non-critical):', e.message);
    }

    return res.status(200).json({ 
      text: validators.sanitize(text), 
      audioUrl 
    });
    
  } catch (error) {
    if (error instanceof ExternalServiceError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Voice-to-text error:', error);
    throw new ValidationError('Transcription failed. Please try again.');
  }
});
