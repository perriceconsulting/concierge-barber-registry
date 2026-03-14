import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated content that may contain HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text content (strips all HTML)
 * Use this for content that should never contain HTML
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize bio/description with basic formatting
 * Allows basic formatting like bold, italic, and links
 */
export function sanitizeBio(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize a URL to ensure it's safe
 */
export function sanitizeUrl(url: string): string {
  const sanitized = DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  // Ensure the URL starts with http:// or https://
  if (sanitized && !sanitized.match(/^https?:\/\//i)) {
    return `https://${sanitized}`;
  }

  return sanitized;
}

/**
 * Escape special characters for safe display
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}
