import { verifyAuth } from './_lib/verifyAuth.js';
import { asyncHandler, validateMethod, ValidationError, ExternalServiceError, validators } from './_lib/error-handler.js';
import { validateSummarization } from './_lib/input-validator.js';
import { rateLimiter } from './_lib/enhanced-rate-limit.js';
import { HistoryManager } from './_lib/user-manager.js';

export default asyncHandler(async function handler(req, res) {
  validateMethod(['POST'])(req, res);

  const user = await verifyAuth(req, res);
  if (!user) return;

  // Apply enhanced rate limiting
  await new Promise((resolve, reject) => {
    rateLimiter.summarize(() => `sum:${user.uid}`)(req, res, (error) => {
      if (error) {
        return reject(new ValidationError(error.message || 'Rate limit exceeded'));
      }
      resolve();
    });
  });

  const startTime = Date.now();

  try {
    // Validate and sanitize input
    const { text } = req.body || {};
    const sanitizedInput = validateSummarization({ text });
    const sanitizedText = sanitizedInput.text;

    // Call Hugging Face API
    const hfResponse = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-cnn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: sanitizedText,
        parameters: {
          max_length: 150,
          min_length: 30,
          do_sample: false
        }
      }),
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      try {
        const errorData = JSON.parse(errorText);
        const errMsg = errorData.error || errorData.message || 'Summarization service unavailable';
        throw new ExternalServiceError('HuggingFace', errMsg);
      } catch {
        throw new ExternalServiceError('HuggingFace', errorText);
      }
    }

    const result = await hfResponse.json();
    const summary = result?.[0]?.summary_text || result.summary_text;
    
    if (!summary || typeof summary !== 'string') {
      throw new ValidationError('Summarization failed to generate a valid summary');
    }

    const sanitizedSummary = validators.sanitize(summary);

    // Save to history with enhanced metadata
    await HistoryManager.saveHistoryItem({
      userId: user.uid,
      serviceType: 'summarize',
      input: sanitizedText,
      output: sanitizedSummary,
      metadata: {
        model: 'facebook/bart-large-cnn',
        parameters: { max_length: 150, min_length: 30 },
        processingTime: Date.now() - startTime,
        cost: '0.001', // Approximate cost
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      }
    });

    return res.status(200).json({ 
      summary: sanitizedSummary 
    });
    
  } catch (error) {
    if (error instanceof ExternalServiceError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Summarization error:', error);
    throw new ValidationError('Failed to summarize text');
  }
});
