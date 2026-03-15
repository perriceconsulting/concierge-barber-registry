import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API');

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown) {
  logger.error('Error:', error);

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please fix the following errors and try again.',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Custom API error
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
      },
    },
    { status: 500 }
  );
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

// Common API errors
export const AuthErrors = {
  INVALID_CREDENTIALS: new ApiError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password'),
  EMAIL_NOT_VERIFIED: new ApiError(401, 'AUTH_EMAIL_NOT_VERIFIED', 'Please verify your email address'),
  TOKEN_EXPIRED: new ApiError(401, 'AUTH_TOKEN_EXPIRED', 'Your session has expired. Please login again'),
  TOKEN_INVALID: new ApiError(401, 'AUTH_TOKEN_INVALID', 'Invalid authentication token'),
  ACCOUNT_DEACTIVATED: new ApiError(401, 'AUTH_ACCOUNT_DEACTIVATED', 'Your account has been deactivated'),
  UNAUTHORIZED: new ApiError(401, 'UNAUTHORIZED', 'You must be logged in to access this resource'),
  FORBIDDEN: new ApiError(403, 'FORBIDDEN', 'You do not have permission to access this resource'),
};

export const ValidationErrors = {
  EMAIL_EXISTS: new ApiError(409, 'ALREADY_EXISTS', 'An account with this email already exists'),
  SLUG_EXISTS: new ApiError(409, 'ALREADY_EXISTS', 'This profile name is already taken'),
  REVIEW_EXISTS: new ApiError(409, 'REVIEW_ALREADY_SUBMITTED', 'You have already reviewed this barber'),
};

export const ResourceErrors = {
  NOT_FOUND: new ApiError(404, 'NOT_FOUND', 'The requested resource was not found'),
  USER_NOT_FOUND: new ApiError(404, 'NOT_FOUND', 'User not found'),
  BARBER_NOT_FOUND: new ApiError(404, 'NOT_FOUND', 'Barber not found'),
  BARBER_NOT_APPROVED: new ApiError(403, 'BARBER_NOT_APPROVED', 'This barber profile is not yet approved'),
};

export const FileErrors = {
  FILE_TOO_LARGE: new ApiError(413, 'FILE_TOO_LARGE', 'File size exceeds the maximum limit'),
  INVALID_FILE_TYPE: new ApiError(400, 'FILE_INVALID_TYPE', 'Invalid file type'),
  PORTFOLIO_LIMIT_REACHED: new ApiError(400, 'PORTFOLIO_LIMIT_REACHED', 'Maximum number of portfolio images reached'),
};

export const RateLimitError = new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later');
