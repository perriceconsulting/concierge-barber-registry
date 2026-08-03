/**
 * Stamp the brand mark onto every blog image, for branding and IP.
 *
 *   npx tsx scripts/watermark-blog-images.ts
 *
 * Reads from assets/blog-masters/ and writes to public/blog/. That direction
 * matters: the script is idempotent because it never reads its own output, so
 * re-running it (after a logo tweak, a size change, or a new photo) restamps
 * from clean originals instead of layering a second watermark on the first.
 *
 * Add new blog photos to assets/blog-masters/ — not to public/blog/ — and run
 * this. Anything placed only in public/blog/ will be overwritten or ignored.
 *
 * assets/ is outside public/, so masters are never served.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const MASTERS = path.join(process.cwd(), 'assets', 'blog-masters');
const PUBLIC = path.join(process.cwd(), 'public', 'blog');
const MARK = path.join(process.cwd(), 'assets', 'brand-mark.png');

/** Watermark width as a fraction of the image width. */
const MARK_WIDTH_RATIO = 0.11;
/** Inset from the bottom-right corner, as a fraction of image width. */
const MARGIN_RATIO = 0.018;
/** How present the mark is. Low enough not to fight the photo. */
const OPACITY = 0.75;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(jpe?g|png)$/i.test(entry.name) ? [full] : [];
  });
}

async function main() {
  if (!fs.existsSync(MARK)) {
    console.error(`Missing brand mark at ${MARK}`);
    process.exit(1);
  }
  if (!fs.existsSync(MASTERS)) {
    console.error(`Missing masters at ${MASTERS}`);
    process.exit(1);
  }

  const files = walk(MASTERS);
  console.log(`Stamping ${files.length} images...\n`);

  for (const master of files) {
    const rel = path.relative(MASTERS, master);
    const dest = path.join(PUBLIC, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    const meta = await sharp(master).metadata();
    const width = meta.width ?? 1376;
    const height = meta.height ?? 768;

    const markWidth = Math.round(width * MARK_WIDTH_RATIO);
    const margin = Math.round(width * MARGIN_RATIO);

    // Resize the mark, then knock its alpha down uniformly. dest-in multiplies
    // the existing alpha by the tile's alpha, so the cut-out shape is kept and
    // only its opacity changes.
    const mark = await sharp(MARK)
      .resize({ width: markWidth })
      .ensureAlpha()
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * OPACITY)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    const markMeta = await sharp(mark).metadata();

    await sharp(master)
      .composite([
        {
          input: mark,
          top: height - (markMeta.height ?? 0) - margin,
          left: width - (markMeta.width ?? 0) - margin,
        },
      ])
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(dest);

    const kb = (fs.statSync(dest).size / 1024).toFixed(0);
    console.log(`  ${rel.replace(/\\/g, '/').padEnd(48)} ${kb}KB`);
  }

  console.log(`\nDone. ${files.length} images stamped.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
