/**
 * Custom error classes for better error handling and type safety.
 */

/**
 * Thrown when input validation fails.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Thrown when a paste is not found or is unavailable.
 */
export class PasteNotFoundError extends Error {
  constructor(message: string = 'Paste not found') {
    super(message);
    this.name = 'PasteNotFoundError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PasteNotFoundError);
    }
  }
}

/**
 * Thrown when a database operation fails.
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

/**
 * Standard error response format for API endpoints.
 */
export interface ErrorResponse {
  error: string;
  message?: string;
}

