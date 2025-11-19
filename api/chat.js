import { verifyAuth } from './_lib/verifyAuth.js';
import { rateLimit } from './_lib/rate-limit.js';
import { saveHistoryItem } from './_lib/saveHistory.js';
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

  const { limited } = rateLimit({ key: `chat:${user.uid}` });
  if (limited) throw new ValidationError('Rate limit exceeded. Please try again later.');

  const { messages, model: modelIn } = req.body || {};
  
  // Validate inputs
  validators.required(messages, 'messages');
  validators.array(messages, 'messages', 10);
  
  const model = modelIn || 'microsoft/DialoGPT-medium';
  validators.string(model, 'model', 100);

  // Validate message format
  messages.forEach((msg, i) => {
    if (typeof msg !== 'object' || !msg.role || !msg.content) {
      throw new ValidationError(`Invalid message format at index ${i}`, 'messages');
    }
    validators.string(msg.role, `messages[${i}].role`, 20);
    validators.string(msg.content, `messages[${i}].content`, 500);
  });

  try {
    const url = `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(model)}`;

    // Build conversation prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';

    const hfResponse = await fetch(url, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.HF_API_KEY}`, 
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Tools-Platform/1.0'
      },
      body: JSON.stringify({ 
        inputs: prompt,
        parameters: { 
          max_length: 200,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
        },
      }),
    });

    if (!hfResponse.ok) {
      let errMsg = 'Chat service unavailable';
      try {
        const errJson = await hfResponse.json();
        errMsg = errJson?.error || errMsg;
      } catch {
        errMsg = hfResponse.statusText || errMsg;
      }
      throw new ExternalServiceError('HuggingFace', errMsg);
    }

    const result = await hfResponse.json();
    const reply = result?.[0]?.generated_text || result.generated_text || prompt;
    const cleanReply = reply.replace(prompt, '').trim();
    
    if (!cleanReply) {
      throw new ValidationError('Chat failed to generate a response');
    }

    // Save history
    try {
      await saveHistoryItem({
        userId: user.uid,
        serviceType: 'chat',
        input: validators.sanitize(messages[messages.length - 1]?.content || 'conversation'),
        output: validators.sanitize(cleanReply),
        metadata: { model, messageCount: messages.length },
      });
    } catch (e) {
      console.warn('History save failed (non-critical):', e.message);
    }

    return res.status(200).json({ 
      reply: validators.sanitize(cleanReply) 
    });
    
  } catch (error) {
    if (error instanceof ExternalServiceError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Chat error:', error);
    throw new ValidationError('Chat failed. Please try again.');
  }
});
