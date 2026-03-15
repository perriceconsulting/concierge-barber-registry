import { NextRequest } from 'next/server';
import { RateLimitError } from './errors';
import { createLogger } from '@/lib/logger';

const logger = createLogger('RATE_LIMIT');

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory fallback for local development (when KV not available)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Optional: Custom key generator (defaults to IP address)
   */
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Get KV client with fallback to in-memory for development
 */
async function getKVClient() {
  // Only use Vercel KV in production/preview with proper env vars
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      return kv;
    } catch (error) {
      logger.warn('Vercel KV unavailable, falling back to in-memory:', error);
      return null;
    }
  }
  return null;
}

/**
 * Rate limit using Vercel KV (distributed)
 */
async function rateLimitWithKV(
  kv: { incr: (key: string) => Promise<number>; expire: (key: string, seconds: number) => Promise<unknown> },
  key: string,
  config: RateLimitConfig
): Promise<void> {
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  // Use Redis INCR for atomic increment
  const count = await kv.incr(key);

  // Set expiry on first request
  if (count === 1) {
    await kv.expire(key, windowSeconds);
  }

  if (count > config.limit) {
    throw RateLimitError;
  }
}

/**
 * Rate limit using in-memory Map (fallback for development)
 */
function rateLimitInMemory(key: string, config: RateLimitConfig): void {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // No record or expired - create new record
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return;
  }

  // Increment count
  record.count++;

  // Check if limit exceeded
  if (record.count > config.limit) {
    throw RateLimitError;
  }
}

/**
 * Rate limit middleware for API routes
 * Uses Vercel KV in production (distributed) or in-memory Map in development
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   await rateLimit(request, { limit: 5, windowMs: 15 * 60 * 1000 }); // 5 requests per 15 minutes
 *   // ... rest of handler
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<void> {
  const identifier = config.keyGenerator
    ? config.keyGenerator(request)
    : getClientIdentifier(request);

  const key = `rate-limit:${identifier}`;

  // Try to use KV, fallback to in-memory
  const kv = await getKVClient();

  if (kv) {
    await rateLimitWithKV(kv, key, config);
  } else {
    rateLimitInMemory(key, config);
  }
}

/**
 * Get client identifier for rate limiting
 * Uses IP address, or fallback to user agent
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from common headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip =
    cfConnectingIp ||
    realIp ||
    forwarded?.split(',')[0].trim() ||
    'unknown';

  return ip;
}

/**
 * Create a rate limiter with specific config
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (request: NextRequest) => rateLimit(request, config);
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /**
   * Auth endpoints: 5 requests per 15 minutes
   */
  auth: createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 }),

  /**
   * Strict auth (registration): 3 requests per hour
   */
  authStrict: createRateLimiter({ limit: 3, windowMs: 60 * 60 * 1000 }),

  /**
   * General API: 100 requests per minute
   */
  api: createRateLimiter({ limit: 100, windowMs: 60 * 1000 }),

  /**
   * File upload: 10 per hour
   */
  upload: createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 }),

  /**
   * Contact form: 5 per hour
   */
  contact: createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }),

  /**
   * Reviews: 5 per day
   */
  reviews: createRateLimiter({ limit: 5, windowMs: 24 * 60 * 60 * 1000 }),
};
