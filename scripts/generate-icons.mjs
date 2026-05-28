// Regenerates favicon/app icons from the brand logo.
//   node scripts/generate-icons.mjs
// sharp can't emit .ico, so we hand-assemble a multi-size ICO that embeds PNGs
// (PNG-in-ICO is supported by all modern browsers).
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const SRC = 'public/brand-logo.jpeg';

function png(size) {
  // ensureAlpha → RGBA PNGs; Next's ICO decoder rejects non-RGBA PNGs.
  return sharp(SRC).resize(size, size, { fit: 'cover' }).ensureAlpha().png().toBuffer();
}

function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const datas = [];
  images.forEach((img, i) => {
    const b = i * 16;
    const dim = img.size >= 256 ? 0 : img.size; // 0 means 256 in ICO
    dir.writeUInt8(dim, b + 0); // width
    dir.writeUInt8(dim, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette colors
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(img.buf.length, b + 8); // image data size
    dir.writeUInt32LE(offset, b + 12); // offset
    offset += img.buf.length;
    datas.push(img.buf);
  });
  return Buffer.concat([header, dir, ...datas]);
}

async function main() {
  const icoSizes = [16, 32, 48];
  const icoImgs = [];
  for (const size of icoSizes) icoImgs.push({ size, buf: await png(size) });

  await writeFile('src/app/favicon.ico', buildIco(icoImgs));
  await writeFile('src/app/apple-icon.png', await png(180));
  await writeFile('public/icon-192.png', await png(192));
  await writeFile('public/icon-512.png', await png(512));

  console.log('Generated: src/app/favicon.ico, src/app/apple-icon.png, public/icon-192.png, public/icon-512.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
