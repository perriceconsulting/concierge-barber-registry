/**
 * Filename sanitizing for uploads.
 *
 * Deliberately separate from `lib/upload.ts`: that module imports the Vercel
 * Blob SDK (and transitively undici), so anything importing it drags a storage
 * client along. This is pure string work with no storage dependency, which
 * keeps it usable — and testable — on its own.
 */

/**
 * Reduce a user-supplied filename to a safe storage key segment.
 *
 * Replaces anything outside `[a-zA-Z0-9.-]`, then collapses runs of dots.
 * The second step matters: replacing separators alone turns
 * `../../../etc/passwd.jpg` into `.._.._.._etc_passwd.jpg`, which still
 * carries `..`. Vercel Blob treats the result as an opaque key rather than a
 * filesystem path, so that survivor is not exploitable today — but this
 * function should not depend on the storage backend to be correct, and this
 * upload path was filesystem-backed in an earlier version.
 */
export function sanitizeUploadFilename(originalName: string): string {
  return originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '_');
}
