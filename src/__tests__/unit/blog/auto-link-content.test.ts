import { autoLinkBlogContent } from '@/lib/blog/auto-link-content';

describe('autoLinkBlogContent', () => {
  it('returns input untouched when no rules match', () => {
    const html = '<p>Just a generic sentence about hair.</p>';
    expect(autoLinkBlogContent(html)).toBe(html);
  });

  it('wraps the first occurrence of a phrase in an <a> tag', () => {
    const html = '<p>You can find barbers in your area easily.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).toContain('<a href="/search">find barbers</a>');
  });

  it('only wraps the first occurrence per rule (no spam)', () => {
    const html = '<p>find barbers here. find barbers there. find barbers everywhere.</p>';
    const out = autoLinkBlogContent(html);
    const matches = out.match(/<a href="\/search">find barbers<\/a>/g);
    expect(matches).toHaveLength(1);
  });

  it('preserves original casing of matched text', () => {
    const html = '<p>Want to Find Barbers fast?</p>';
    const out = autoLinkBlogContent(html);
    expect(out).toContain('<a href="/search">Find Barbers</a>');
  });

  it('skips text already inside an <a> tag', () => {
    const html = '<p>Click <a href="/external">find barbers</a> here.</p>';
    const out = autoLinkBlogContent(html);
    const matches = out.match(/<a href="\/search">/g);
    expect(matches).toBeNull();
  });

  it('skips text inside heading tags', () => {
    const html = '<h2>How to find barbers</h2><p>Some intro text.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).not.toContain('<h2>How to <a');
  });

  it('skips text inside <code> and <pre> blocks', () => {
    const html = '<pre><code>find barbers via API</code></pre>';
    const out = autoLinkBlogContent(html);
    expect(out).not.toContain('<a href="/search"');
  });

  it('links specialty names to /specialties/<slug>', () => {
    const html = '<p>Get a fresh fade today.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).toContain('<a href="/specialties/fades">');
  });

  it('links the brand mention to /', () => {
    const html = '<p>Welcome to Concierge Barber Registry.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).toContain('<a href="/">Concierge Barber Registry</a>');
  });

  it('handles empty input safely', () => {
    expect(autoLinkBlogContent('')).toBe('');
  });

  it('escapes HTML special chars in surrounding text', () => {
    const html = '<p>Use &lt;tags&gt; with find barbers carefully.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).toContain('&lt;tags&gt;');
    expect(out).toContain('<a href="/search">find barbers</a>');
  });

  it('applies multiple distinct rules to the same content', () => {
    const html = '<p>You can find barbers and read the fade guide on Concierge Barber Registry.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).toContain('<a href="/search">find barbers</a>');
    expect(out).toContain('<a href="/specialties/fades">');
    expect(out).toContain('<a href="/">Concierge Barber Registry</a>');
  });

  it('respects word boundaries (does not match within other words)', () => {
    const html = '<p>The fader was loud.</p>';
    const out = autoLinkBlogContent(html);
    expect(out).not.toContain('<a href="/specialties/fades">');
  });
});
