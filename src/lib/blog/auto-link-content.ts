import * as cheerio from 'cheerio/slim';
import { SPECIALTIES } from '@/config';
import { slugify } from '@/lib/slug';

interface LinkRule {
  patterns: string[];
  href: string;
}

const SPECIALTY_RULES: LinkRule[] = SPECIALTIES.map((name) => {
  const patterns: string[] = [name];
  if (name.endsWith('s') && !name.includes('/')) {
    const singular = name.slice(0, -1);
    if (singular.length >= 3) patterns.push(singular);
  }
  return {
    patterns,
    href: `/specialties/${slugify(name)}`,
  };
});

export const BLOG_LINK_RULES: LinkRule[] = [
  { patterns: ['Concierge Barber Registry'], href: '/' },
  { patterns: ['register as a barber', 'become a barber'], href: '/register?role=barber' },
  { patterns: ['find a barber', 'find barbers', 'browse barbers', 'search barbers'], href: '/search' },
  { patterns: ['verified barbers', 'licensed barbers', 'professional barbers'], href: '/search' },
  { patterns: ['barber profiles', 'barber portfolios'], href: '/barbers' },
  ...SPECIALTY_RULES,
];

const SKIP_PARENT_TAGS = new Set(['a', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function autoLinkBlogContent(html: string): string {
  if (!html) return html;

  const $ = cheerio.load(html, { xml: false }, false);
  const usedHrefs = new Set<string>();

  const rules = [...BLOG_LINK_RULES].sort(
    (a, b) =>
      Math.max(...b.patterns.map((p) => p.length)) -
      Math.max(...a.patterns.map((p) => p.length))
  );

  for (const rule of rules) {
    if (usedHrefs.has(rule.href)) continue;

    const sortedPatterns = [...rule.patterns].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`\\b(${sortedPatterns.map(escapeRegex).join('|')})\\b`, 'i');

    let matched = false;

    $('*')
      .contents()
      .each(function () {
        if (matched) return;
        if (this.type !== 'text') return;

        let ancestor = this.parent;
        while (ancestor && ancestor.type === 'tag') {
          if (SKIP_PARENT_TAGS.has(ancestor.name)) return;
          ancestor = ancestor.parent;
        }

        const text = this.data;
        const match = pattern.exec(text);
        if (!match) return;

        const before = text.slice(0, match.index);
        const matchedText = match[0];
        const after = text.slice(match.index + matchedText.length);

        const replacement =
          escapeHtml(before) +
          `<a href="${rule.href}">${escapeHtml(matchedText)}</a>` +
          escapeHtml(after);

        $(this).replaceWith(replacement);
        matched = true;
        usedHrefs.add(rule.href);
      });
  }

  return $.html();
}
