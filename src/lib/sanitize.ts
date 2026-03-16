import sanitize from 'sanitize-html';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this for any user-generated content that may contain HTML
 */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
  });
}

/**
 * Sanitize plain text content (strips all HTML)
 * Use this for content that should never contain HTML
 */
export function sanitizeText(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

/**
 * Sanitize bio/description with basic formatting
 * Allows basic formatting like bold, italic, and links
 */
export function sanitizeBio(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes: {},
  });
}

/**
 * Sanitize a URL to ensure it's safe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Block dangerous URL schemes
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return 'about:blank';
  }

  // Strip any HTML tags from the URL
  const cleaned = sanitize(url, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Ensure the URL starts with http:// or https://
  if (cleaned && !cleaned.match(/^https?:\/\//i)) {
    return `https://${cleaned}`;
  }

  return cleaned;
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
