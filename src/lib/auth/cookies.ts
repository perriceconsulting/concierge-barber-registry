/**
 * Canonical session-cookie policy.
 *
 * These attributes were hand-copied across seven files — login, register,
 * refresh, logout, verify-email, claim, and the middleware's silent refresh.
 * Seventeen copies of one security decision, which is the reason the bug below
 * existed in five places at once and could not be fixed in one.
 *
 * ── Why `lax` and not `strict` ──────────────────────────────────────────────
 *
 * A `strict` cookie is withheld on *every* cross-site navigation, including a
 * plain top-level GET that the user themselves initiated. That is not a
 * theoretical edge here — it broke two flows that matter:
 *
 *   1. Returning from Stripe Checkout. The barber pays the setup fee, Stripe
 *      redirects to /dashboard/profile?setup_fee=paid, the browser withholds
 *      the session cookie, middleware sees an anonymous request and bounces
 *      them to /login. They have just been charged and the site greets them as
 *      a stranger, and the success toast they should have seen is discarded
 *      with the query string.
 *   2. Every link we email. Verification, password reset, magic-link claim —
 *      all arrive from a mail client, all count as cross-site.
 *
 * `lax` sends the cookie on top-level GET navigations and withholds it from
 * cross-site POSTs, iframes, and subresource requests — which is the actual
 * CSRF surface. It is also the modern browser default for cookies that omit the
 * attribute entirely.
 *
 * This is not the only thing standing between us and CSRF: state-changing
 * routes carry a double-submit token (lib/api/csrf.ts), and that cookie
 * deliberately stays `strict` — it is read by same-site script and never needs
 * to survive an inbound link.
 */

/** Short-lived: the middleware silently refreshes it from the refresh token. */
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

/** Default session length when "remember me" is not checked. */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** "Remember me for 30 days" — the wording on the sign-in form. */
export const REFRESH_TOKEN_REMEMBERED_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: '/';
}

/**
 * Options for any auth cookie. Pass the lifetime; everything else is policy and
 * is not a per-call-site decision.
 */
export function authCookieOptions(maxAgeSeconds: number): AuthCookieOptions {
  return {
    httpOnly: true,
    // Plain http in local dev, where there is no TLS to mark it against.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeSeconds,
    path: '/',
  };
}

/** maxAge 0 expires the cookie immediately. Used by logout. */
export function clearedAuthCookieOptions(): AuthCookieOptions {
  return authCookieOptions(0);
}
