import { createCsrfTokenEndpoint } from '@/lib/api/csrf';
import { rateLimiters } from '@/lib/api/rate-limit';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Apply rate limiting to prevent DoS on token generation
  await rateLimiters.api(request);

  const handler = createCsrfTokenEndpoint();
  return handler(request);
}
