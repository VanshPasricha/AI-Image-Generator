// Standardized error handling utility for API endpoints
export class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends ApiError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends ApiError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

// Error response formatter
export function formatErrorResponse(error, includeStack = false) {
  const response = {
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  // Add field for validation errors
  if (error.field) {
    response.error.field = error.field;
  }

  // Add service for external service errors
  if (error.service) {
    response.error.service = error.service;
  }

  // Add stack trace in development (never in production)
  if (includeStack && process.env.NODE_ENV !== 'production' && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

// Generic error handler for API endpoints
export function handleApiError(error, res) {
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack
  });

  const statusCode = error.statusCode || 500;
  const response = formatErrorResponse(error, process.env.NODE_ENV !== 'production');

  return res.status(statusCode).json(response);
}

// Async wrapper to catch errors and handle them consistently
export function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      if (error instanceof ApiError) {
        return handleApiError(error, res);
      }

      // Handle unexpected errors
      console.error('Unexpected error in async handler:', error);
      return handleApiError(
        new ApiError('An unexpected error occurred', 500, 'UNEXPECTED_ERROR'),
        res
      );
    }
  };
}

// Method validation helper
export function validateMethod(allowedMethods) {
  return (req, res) => {
    if (!allowedMethods.includes(req.method)) {
      throw new ApiError(`Method ${req.method} not allowed`, 405, 'METHOD_NOT_ALLOWED');
    }
  };
}

// Common validation patterns
export const validators = {
  required: (value, fieldName = 'field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return value;
  },

  string: (value, fieldName = 'field', maxLength = 1000) => {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} exceeds maximum length of ${maxLength}`, fieldName);
    }
    return value.trim();
  },

  array: (value, fieldName = 'field', maxItems = 10) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }
    if (value.length > maxItems) {
      throw new ValidationError(`${fieldName} exceeds maximum of ${maxItems} items`, fieldName);
    }
    return value;
  },

  number: (value, fieldName = 'field', min = 0, max = Infinity) => {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(`${fieldName} must be a number`, fieldName);
    }
    if (num < min || num > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, fieldName);
    }
    return num;
  },

  email: (value, fieldName = 'email') => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`, fieldName);
    }
    return value.toLowerCase();
  },

  sanitize: (str) => {
    if (typeof str !== 'string') return str;
    // Basic sanitization - remove potentially harmful characters
    return str.replace(/[<>]/g, '').trim();
  }
};
