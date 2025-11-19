// Comprehensive input validation and sanitization utilities
export class InputValidator {
  static patterns = {
    // Safe text patterns
    safeText: /^[a-zA-Z0-9\s.,!?@#$%^&*()_\-+=\[\]{}|;:'"<>\/\\`~]+$/,
    // Email pattern
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Firebase UID pattern (alphanumeric)
    uid: /^[a-zA-Z0-9\-_]{20,28}$/,
    // Hugging Face model pattern
    hfModel: /^[a-zA-Z0-9\-\/]+$/,
    // Safe filename pattern
    filename: /^[a-zA-Z0-9\-_.]+$/,
    // MIME type pattern
    mimeType: /^[a-zA-Z0-9\-\/]+$/
  };

  static sanitize(str, options = {}) {
    if (typeof str !== 'string') return str;
    
    const {
      maxLength = 10000,
      removeHTML = true,
      removeScripts = true,
      normalizeWhitespace = true,
      trim = true
    } = options;

    let sanitized = str;

    // Remove HTML tags
    if (removeHTML) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove script content and event handlers
    if (removeScripts) {
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    }

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize whitespace
    if (normalizeWhitespace) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }

    // Trim
    if (trim) {
      sanitized = sanitized.trim();
    }

    // Limit length
    if (maxLength > 0 && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  static validate(value, rules) {
    const errors = [];
    let result = value;

    for (const rule of rules) {
      try {
        const ruleResult = this.applyRule(result, rule);
        if (ruleResult.error) {
          errors.push(ruleResult.error);
        } else {
          result = ruleResult.value || result;
        }
      } catch (error) {
        errors.push(`${rule.name || 'validation'}: ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      value: result,
      errors
    };
  }

  static applyRule(value, rule) {
    const { type, name, options = {}, message } = rule;

    switch (type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return { error: message || `${name || 'field'} is required` };
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          return { error: message || `${name || 'field'} must be a string` };
        }
        if (options.maxLength && value.length > options.maxLength) {
          return { error: message || `${name || 'field'} exceeds maximum length of ${options.maxLength}` };
        }
        if (options.minLength && value.length < options.minLength) {
          return { error: message || `${name || 'field'} must be at least ${options.minLength} characters` };
        }
        break;

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return { error: message || `${name || 'field'} must be a number` };
        }
        if (options.min !== undefined && num < options.min) {
          return { error: message || `${name || 'field'} must be at least ${options.min}` };
        }
        if (options.max !== undefined && num > options.max) {
          return { error: message || `${name || 'field'} must be at most ${options.max}` };
        }
        return { value: num };

      case 'array':
        if (!Array.isArray(value)) {
          return { error: message || `${name || 'field'} must be an array` };
        }
        if (options.maxItems && value.length > options.maxItems) {
          return { error: message || `${name || 'field'} exceeds maximum of ${options.maxItems} items` };
        }
        if (options.minItems && value.length < options.minItems) {
          return { error: message || `${name || 'field'} must have at least ${options.minItems} items` };
        }
        break;

      case 'pattern':
        if (!this.patterns[options.pattern]) {
          throw new Error(`Unknown pattern: ${options.pattern}`);
        }
        if (!this.patterns[options.pattern].test(value)) {
          return { error: message || `${name || 'field'} format is invalid` };
        }
        break;

      case 'enum':
        if (!options.values.includes(value)) {
          return { error: message || `${name || 'field'} must be one of: ${options.values.join(', ')}` };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return { error: message || `${name || 'field'} must be an object` };
        }
        break;

      case 'sanitize':
        return { value: this.sanitize(value, options) };

      case 'custom':
        if (typeof options.validator !== 'function') {
          throw new Error('Custom rule must provide a validator function');
        }
        const customResult = options.validator(value);
        if (customResult === false || (typeof customResult === 'object' && customResult.valid === false)) {
          return { error: message || customResult.message || `${name || 'field'} validation failed` };
        }
        break;

      default:
        throw new Error(`Unknown validation rule type: ${type}`);
    }

    return { valid: true };
  }

  // Predefined validation schemas
  static schemas = {
    // Image generation request
    imageGeneration: {
      model: [
        { type: 'required', name: 'model' },
        { type: 'string', name: 'model', options: { maxLength: 100 } },
        { type: 'pattern', name: 'model', options: { pattern: 'hfModel' } }
      ],
      inputs: [
        { type: 'required', name: 'inputs' },
        { type: 'string', name: 'inputs', options: { maxLength: 1000 } },
        { type: 'sanitize', options: { maxLength: 1000 } }
      ],
      parameters: [
        { type: 'object', name: 'parameters' }
      ],
      count: [
        { type: 'number', name: 'count', options: { min: 1, max: 4 } }
      ]
    },

    // Voice-to-text request
    voiceToText: {
      audioBase64: [
        { type: 'required', name: 'audioBase64' },
        { type: 'string', name: 'audioBase64', options: { maxLength: 5000000 } }
      ],
      contentType: [
        { type: 'required', name: 'contentType' },
        { type: 'string', name: 'contentType', options: { maxLength: 50 } },
        { type: 'pattern', name: 'contentType', options: { pattern: 'mimeType' } }
      ],
      model: [
        { type: 'string', name: 'model', options: { maxLength: 100 } },
        { type: 'pattern', name: 'model', options: { pattern: 'hfModel' } }
      ]
    },

    // Chat request
    chat: {
      messages: [
        { type: 'required', name: 'messages' },
        { type: 'array', name: 'messages', options: { minItems: 1, maxItems: 10 } },
        { type: 'custom', options: { validator: (messages) => {
          return messages.every(msg => 
            msg && typeof msg === 'object' && 
            typeof msg.role === 'string' && 
            typeof msg.content === 'string'
          );
        }, message: 'Messages must have role and content fields' }}
      ],
      model: [
        { type: 'string', name: 'model', options: { maxLength: 100 } },
        { type: 'pattern', name: 'model', options: { pattern: 'hfModel' } }
      ]
    },

    // Summarization request
    summarization: {
      text: [
        { type: 'required', name: 'text' },
        { type: 'string', name: 'text', options: { minLength: 50, maxLength: 10000 } },
        { type: 'sanitize', options: { maxLength: 10000 } }
      ],
      model: [
        { type: 'string', name: 'model', options: { maxLength: 100 } },
        { type: 'pattern', name: 'model', options: { pattern: 'hfModel' } }
      ]
    }
  };

  static validateSchema(data, schemaName) {
    const schema = this.schemas[schemaName];
    if (!schema) {
      throw new Error(`Unknown schema: ${schemaName}`);
    }

    const errors = {};
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const result = this.validate(value, rules);

      if (!result.valid) {
        errors[field] = result.errors;
      } else {
        sanitized[field] = result.value;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      data: sanitized,
      errors
    };
  }
}

// Export convenience functions
export function validateAndSanitize(data, schemaName) {
  return InputValidator.validateSchema(data, schemaName);
}

export function sanitizeInput(str, options) {
  return InputValidator.sanitize(str, options);
}
