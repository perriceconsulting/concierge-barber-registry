// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Next.js Request/Response objects
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = 'test-resend-api-key';
process.env.FROM_EMAIL = 'test@example.com';
process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
// Exercise the real rate limiter. It self-bypasses outside production unless
// this opt-out is set, so without it every rate-limit assertion tests nothing.
process.env.DISABLE_RATE_LIMITING_IN_DEV = 'false';

// Mock Prisma Client.
//
// DOSI > Single Source: this used to hand-list 4 of the schema's 26 models and
// a guess at each one's methods, so every new model or method silently produced
// `Cannot read properties of undefined (reading 'create')` in a test that had
// no way to know it was out of date. schema.prisma is the canonical origin, and
// a hand-maintained mirror of it will always drift.
//
// Instead, vivify on access: any model, any method, is a jest.fn() the moment a
// test reaches for it. Nothing to keep in sync.
jest.mock('@/lib/db', () => {
  const modelProxy = () =>
    new Proxy(
      {},
      {
        get(target, prop) {
          if (typeof prop === 'symbol') return target[prop];
          if (!(prop in target)) target[prop] = jest.fn();
          return target[prop];
        },
      }
    );

  const prisma = new Proxy(
    {},
    {
      get(target, prop) {
        if (typeof prop === 'symbol') return target[prop];
        // Never look thenable — an accidental `await prisma` must not hang.
        if (prop === 'then') return undefined;
        if (!(prop in target)) {
          // $transaction / $connect / $queryRaw are callables, not models.
          target[prop] = String(prop).startsWith('$') ? jest.fn() : modelProxy();
        }
        return target[prop];
      },
    }
  );

  return { prisma };
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));
