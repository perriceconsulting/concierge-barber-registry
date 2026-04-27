/**
 * Client-side CSRF token management + access-token auto-refresh.
 */

let csrfToken: string | null = null;

/**
 * Fetch CSRF token from server
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });
    const data = await response.json();

    if (data.success && data.data?.csrfToken) {
      csrfToken = data.data.csrfToken;
      return csrfToken as string;
    }

    throw new Error('Failed to fetch CSRF token');
  } catch (error) {
    // Keep as console.error for client-side visibility during development
    if (process.env.NODE_ENV !== 'production') console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Get current CSRF token (fetches if not available)
 */
export async function getCsrfToken(): Promise<string> {
  if (!csrfToken) {
    return await fetchCsrfToken();
  }
  return csrfToken;
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

// Mutex so concurrent 401s share a single refresh request
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token via /api/auth/refresh.
 * Returns true if refresh succeeded.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const token = await getCsrfToken();
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': token },
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      // Clear the in-flight reference after this microtask so subsequent
      // calls trigger a fresh refresh if needed.
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();

  return refreshInFlight;
}

/**
 * Enhanced fetch with automatic CSRF token, credentials, and access-token
 * auto-refresh on 401. If a request returns 401, this attempts a single
 * refresh via /api/auth/refresh and retries the original request once.
 *
 * Skips the auto-refresh dance for /api/auth/* routes themselves to avoid
 * loops (login/refresh failing → trying to refresh → failing → loop).
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  // Prepare headers
  const headers = new Headers(options.headers);

  // Add CSRF token for state-changing methods
  if (needsCsrf) {
    const token = await getCsrfToken();
    headers.set('x-csrf-token', token);
  }

  // Add Content-Type if not set and body exists (skip FormData — browser sets it with boundary)
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always include cookies
  });

  // Auto-refresh on 401 — but never retry refresh/login/logout endpoints
  // (would create a loop) and never retry recursively.
  const isAuthRoute =
    url.startsWith('/api/auth/refresh') ||
    url.startsWith('/api/auth/login') ||
    url.startsWith('/api/auth/logout');

  if (response.status === 401 && !_isRetry && !isAuthRoute) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry once with a fresh access token cookie set by the refresh response
      return secureFetch(url, options, true);
    }
  }

  return response;
}
