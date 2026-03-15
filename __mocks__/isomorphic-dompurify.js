/**
 * Manual Jest mock for isomorphic-dompurify.
 * Avoids the deep ESM dependency chain (jsdom → cssstyle → @asamuzakjp/css-color → @csstools/*)
 * that cannot be transformed by Jest/SWC.
 */

function sanitize(dirty, config) {
  if (!dirty) return '';

  const allowedTags = (config && config.ALLOWED_TAGS) || [];
  const allowed = new Set(allowedTags.map(function (t) { return t.toLowerCase(); }));

  var result = dirty;

  // Remove script/iframe/style tags and their content
  result = result.replace(/<(script|iframe|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Remove event handler attributes (onclick, onload, onerror, etc.)
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: href attributes
  result = result.replace(/\s+href\s*=\s*"javascript:[^"]*"/gi, '');
  result = result.replace(/\s+href\s*=\s*'javascript:[^']*'/gi, '');

  if (allowed.size === 0) {
    // Strip ALL tags — return text content only
    result = result.replace(/<[^>]*>/g, '');
  } else {
    // Keep only allowed tags, strip all attributes from them
    result = result.replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*\/?>/gi, function (match, slash, tag) {
      if (allowed.has(tag.toLowerCase())) {
        return '<' + slash + tag + '>';
      }
      return '';
    });
  }

  return result;
}

var DOMPurify = { sanitize: sanitize };

module.exports = DOMPurify;
module.exports.default = DOMPurify;
module.exports.__esModule = true;
