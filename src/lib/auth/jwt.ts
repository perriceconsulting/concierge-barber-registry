import { SignJWT, jwtVerify, errors } from 'jose';

// Enforce JWT secrets in production
const getSecret = (envVar: string | undefined, name: string) => {
  if (!envVar) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
      throw new Error(`${name} must be set in production environment`);
    }
    // Only warn in development - production throws above
    if (typeof console !== 'undefined') console.warn(`${name} not set - using development default`);
    return `dev-secret-${name}-for-local-development-only`;
  }
  return envVar;
};

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  getSecret(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET')
);

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  getSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET')
);

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRY_REMEMBER = '30d'; // 30 days with "remember me"

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export class TokenExpiredError extends Error {
  constructor(message = 'Token has expired') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends Error {
  constructor(message = 'Token is invalid') {
    super(message);
    this.name = 'TokenInvalidError';
  }
}

/**
 * Generate an access token (short-lived)
 */
export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

/**
 * Generate a refresh token (long-lived)
 */
export async function generateRefreshToken(payload: JWTPayload, rememberMe: boolean = false): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? REFRESH_TOKEN_EXPIRY_REMEMBER : REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

/**
 * Verify an access token
 * @throws {TokenExpiredError} If token has expired
 * @throws {TokenInvalidError} If token is invalid or tampered with
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new TokenExpiredError('Access token has expired');
    }
    throw new TokenInvalidError('Access token is invalid');
  }
}

/**
 * Verify a refresh token
 * @throws {TokenExpiredError} If token has expired
 * @throws {TokenInvalidError} If token is invalid or tampered with
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      throw new TokenExpiredError('Refresh token has expired');
    }
    throw new TokenInvalidError('Refresh token is invalid');
  }
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(payload: JWTPayload, rememberMe: boolean = false): Promise<{
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload, rememberMe),
  ]);

  return { accessToken, refreshToken, rememberMe };
}
