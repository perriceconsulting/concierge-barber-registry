import { sanitizeUploadFilename } from '@/lib/upload-filename';

/**
 * Ported from the deleted integration/security/file-upload suite, which
 * asserted against a filesystem upload path the product no longer uses
 * (it writes to Vercel Blob now). The traversal claim was the one assertion
 * in that file still worth keeping, so it lives here — in a suite that runs.
 */
describe('sanitizeUploadFilename', () => {
  it('leaves an ordinary filename intact', () => {
    expect(sanitizeUploadFilename('license.jpg')).toBe('license.jpg');
    expect(sanitizeUploadFilename('my-license.2024.pdf')).toBe('my-license.2024.pdf');
  });

  it('replaces path separators and spaces', () => {
    expect(sanitizeUploadFilename('my license.jpg')).toBe('my_license.jpg');
    expect(sanitizeUploadFilename('folder/file.png')).toBe('folder_file.png');
    expect(sanitizeUploadFilename('folder\\file.png')).toBe('folder_file.png');
  });

  it('leaves no traversal sequence behind', () => {
    // Replacing separators alone would yield `.._.._.._etc_passwd.jpg`.
    const result = sanitizeUploadFilename('../../../etc/passwd.jpg');
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  it('collapses dot runs anywhere in the name', () => {
    expect(sanitizeUploadFilename('..')).not.toContain('..');
    expect(sanitizeUploadFilename('a...b.jpg')).not.toContain('..');
    expect(sanitizeUploadFilename('....//....//evil.sh')).not.toContain('..');
  });

  it('strips characters outside the allowlist', () => {
    const result = sanitizeUploadFilename('<script>alert(1)</script>.png');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('(');
    expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
  });
});
