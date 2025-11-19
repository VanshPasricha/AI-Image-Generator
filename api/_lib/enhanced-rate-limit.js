// Enhanced rate limiting implementation with Redis fallback and sliding window
export class RateLimiter {
  constructor(options = {}) {
    this.options = {
      windowMs: options.windowMs || 60000, // 1 minute default
      maxRequests: options.maxRequests || 10,
      keyGenerator: options.keyGenerator || ((req) => req.ip),
      message: options.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      ...options
    };
    
    // In-memory storage (for development)
    this.memoryStore = new Map();
    
    // Clean up old entries periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.options.windowMs);
    }
  }

  // Get storage key
  getKey(key) {
    return `rate_limit:${key}`;
  }

  // Check if request is allowed
  async isAllowed(key, options = {}) {
    const storageKey = this.getKey(key);
    const now = Date.now();
    const windowMs = options.windowMs || this.options.windowMs;
    const maxRequests = options.maxRequests || this.options.maxRequests;

    try {
      // Try to get current data
      let data = this.memoryStore.get(storageKey);
      
      if (!data) {
        data = {
          requests: [],
          totalRequests: 0
        };
      }

      // Remove old requests outside the window
      data.requests = data.requests.filter(timestamp => 
        now - timestamp < windowMs
      );

      // Check if limit exceeded
      if (data.requests.length >= maxRequests) {
        return {
          allowed: false,
          totalRequests: data.requests.length,
          remainingRequests: 0,
          resetTime: Math.min(...data.requests) + windowMs
        };
      }

      // Add current request
      data.requests.push(now);
      data.totalRequests++;

      // Store updated data
      this.memoryStore.set(storageKey, data);

      return {
        allowed: true,
        totalRequests: data.totalRequests,
        remainingRequests: maxRequests - data.requests.length,
        resetTime: Math.min(...data.requests) + windowMs
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        totalRequests: 0,
        remainingRequests: maxRequests,
        resetTime: now + windowMs
      };
    }
  }

  // Clean up old entries
  cleanup() {
    const now = Date.now();
    const cutoff = now - this.options.windowMs;
    
    for (const [key, data] of this.memoryStore.entries()) {
      // Remove requests outside the window
      data.requests = data.requests.filter(timestamp => timestamp > cutoff);
      
      // Remove empty entries
      if (data.requests.length === 0) {
        this.memoryStore.delete(key);
      }
    }
  }

  // Reset rate limit for a key
  reset(key) {
    const storageKey = this.getKey(key);
    this.memoryStore.delete(storageKey);
  }

  // Get rate limit info
  getInfo(key) {
    const storageKey = this.getKey(key);
    const data = this.memoryStore.get(storageKey);
    
    if (!data) {
      return {
        totalRequests: 0,
        remainingRequests: this.options.maxRequests,
        resetTime: Date.now() + this.options.windowMs
      };
    }

    const now = Date.now();
    const validRequests = data.requests.filter(timestamp => 
      now - timestamp < this.options.windowMs
    );

    return {
      totalRequests: data.totalRequests,
      remainingRequests: Math.max(0, this.options.maxRequests - validRequests.length),
      resetTime: validRequests.length > 0 ? Math.min(...validRequests) + this.options.windowMs : now + this.options.windowMs
    };
  }
}

// Predefined rate limiters for different services
export const rateLimiters = {
  // Image generation: 5 requests per minute
  image: new RateLimiter({
    windowMs: 60000,
    maxRequests: 5
  }),

  // Voice-to-text: 10 requests per minute
  voice: new RateLimiter({
    windowMs: 60000,
    maxRequests: 10
  }),

  // Chat: 20 requests per minute
  chat: new RateLimiter({
    windowMs: 60000,
    maxRequests: 20
  }),

  // Summarization: 15 requests per minute
  summarize: new RateLimiter({
    windowMs: 60000,
    maxRequests: 15
  }),

  // Authentication: 5 attempts per minute
  auth: new RateLimiter({
    windowMs: 60000,
    maxRequests: 5
  }),

  // Global: 100 requests per minute per IP
  global: new RateLimiter({
    windowMs: 60000,
    maxRequests: 100
  })
};

// Rate limiting middleware
export function createRateLimit(limiter, keyGenerator) {
  return async function rateLimitMiddleware(req, res, next) {
    try {
      // Generate key for this request
      const key = keyGenerator ? keyGenerator(req) : req.ip;
      
      // Check global rate limit first
      const globalResult = await rateLimiters.global.isAllowed(req.ip);
      if (!globalResult.allowed) {
        res.setHeader('X-RateLimit-Limit', rateLimiters.global.options.maxRequests);
        res.setHeader('X-RateLimit-Remaining', globalResult.remainingRequests);
        res.setHeader('X-RateLimit-Reset', new Date(globalResult.resetTime).toISOString());
        return res.status(429).json({
          error: 'Global rate limit exceeded',
          retryAfter: Math.ceil((globalResult.resetTime - Date.now()) / 1000)
        });
      }

      // Check specific rate limit
      const result = await limiter.isAllowed(key);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limiter.options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remainingRequests);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          error: limiter.options.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

// Convenience functions for different rate limits
export const rateLimit = {
  image: (keyGenerator) => createRateLimit(rateLimiters.image, keyGenerator),
  voice: (keyGenerator) => createRateLimit(rateLimiters.voice, keyGenerator),
  chat: (keyGenerator) => createRateLimit(rateLimiters.chat, keyGenerator),
  summarize: (keyGenerator) => createRateLimit(rateLimiters.summarize, keyGenerator),
  auth: (keyGenerator) => createRateLimit(rateLimiters.auth, keyGenerator),
  global: (keyGenerator) => createRateLimit(rateLimiters.global, keyGenerator)
};

// Legacy compatibility function
export function rateLimitLegacy(options) {
  const limiter = new RateLimiter(options);
  
  return function(req, res, next) {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip;
    
    limiter.isAllowed(key).then(result => {
      if (!result.allowed) {
        return res.status(429).json({ error: options.message || 'Too many requests' });
      }
      next();
    }).catch(error => {
      console.error('Rate limit error:', error);
      next(); // Fail open
    });
  };
}
