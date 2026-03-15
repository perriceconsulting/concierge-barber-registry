/**
 * Client-side CSRF token management
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

/**
 * Enhanced fetch with automatic CSRF token and credentials
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
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

  // Add Content-Type if not set and body exists
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Make request with credentials
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Always include cookies
  });
}
