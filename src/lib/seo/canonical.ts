import { APP_CONFIG } from '@/config';

export function buildCanonical(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${APP_CONFIG.url}${normalized === '/' ? '' : normalized}`;
}

export function canonicalPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}
