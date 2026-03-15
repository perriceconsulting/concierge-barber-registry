/**
 * @jest-environment node
 */
import { sanitizeBio, sanitizeText, sanitizeUrl } from '@/lib/sanitize';

describe('Input Sanitization', () => {
  describe('sanitizeBio', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const output = sanitizeBio(input);

      expect(output).toBe('<p>Hello <strong>world</strong></p>');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeBio(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
    });

    it('should remove onclick attributes', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const output = sanitizeBio(input);

      expect(output).not.toContain('onclick');
      expect(output).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const output = sanitizeBio(input);

      expect(output).not.toContain('javascript:');
    });

    it('should preserve line breaks', () => {
      const input = 'Line 1<br>Line 2';
      const output = sanitizeBio(input);

      expect(output).toBe('Line 1<br>Line 2');
    });

    it('should remove dangerous tags', () => {
      const input = '<iframe src="http://evil.com"></iframe>';
      const output = sanitizeBio(input);

      expect(output).not.toContain('<iframe');
    });
  });

  describe('sanitizeText', () => {
    it('should strip all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const output = sanitizeText(input);

      expect(output).toBe('Hello world');
    });

    it('should remove script tags and content', () => {
      const input = 'Text<script>alert("XSS")</script>More text';
      const output = sanitizeText(input);

      expect(output).not.toContain('<script>');
      expect(output).not.toContain('alert');
    });

    it('should handle empty string', () => {
      const output = sanitizeText('');

      expect(output).toBe('');
    });

    it('should preserve plain text', () => {
      const input = 'This is plain text';
      const output = sanitizeText(input);

      expect(output).toBe('This is plain text');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow HTTP URLs', () => {
      const input = 'http://example.com';
      const output = sanitizeUrl(input);

      expect(output).toBe('http://example.com');
    });

    it('should allow HTTPS URLs', () => {
      const input = 'https://example.com';
      const output = sanitizeUrl(input);

      expect(output).toBe('https://example.com');
    });

    it('should remove javascript: URLs', () => {
      const input = 'javascript:alert("XSS")';
      const output = sanitizeUrl(input);

      expect(output).toBe('about:blank');
    });

    it('should remove data: URLs', () => {
      const input = 'data:text/html,<script>alert("XSS")</script>';
      const output = sanitizeUrl(input);

      expect(output).toBe('about:blank');
    });

    it('should handle empty string', () => {
      const output = sanitizeUrl('');

      expect(output).toBe('');
    });
  });
});
