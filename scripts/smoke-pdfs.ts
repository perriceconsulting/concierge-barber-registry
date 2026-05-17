/**
 * One-off smoke runner for the three W6 credential PDFs.
 *
 * Renders each template with realistic sample data and writes the bytes to
 * <repo>/tmp/. Bypasses auth — exercises the React-PDF pipeline directly,
 * which is where the rendering risk lives.
 *
 * Run with:  npx tsx scripts/smoke-pdfs.ts
 */
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import QRCode from 'qrcode';
import { CredentialCard } from '../src/lib/pdf/credential-card';
import { Certificate } from '../src/lib/pdf/certificate';
import { NdaTemplate } from '../src/lib/pdf/nda';
import { pdfToBuffer } from '../src/lib/pdf/render';

const OUT = join(process.cwd(), 'tmp');

function describe(label: string, buf: Buffer) {
  const magic = buf.subarray(0, 5).toString('utf8');
  const isPdf = magic === '%PDF-';
  // eslint-disable-next-line no-console
  console.log(
    `${isPdf ? '✓' : '✗'}  ${label.padEnd(28)} ${buf.length.toString().padStart(7)} bytes  magic="${magic}"`,
  );
  return isPdf;
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // ─── 1. Credential card (founding member, with QR) ─────────────────────────
  const qrPng = await QRCode.toDataURL('https://conciergebarberregistry.com/barbers/john-doe', {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 280,
    color: { dark: '#0D0D0D', light: '#F5F5F5' },
  });

  const cardBuf = await pdfToBuffer(
    CredentialCard({
      displayName: 'John Doe',
      shopName: 'Old Town Barbers',
      city: 'Newark',
      state: 'NJ',
      isFoundingMember: true,
      publicUrl: 'https://conciergebarberregistry.com/barbers/john-doe',
      qrPngDataUrl: qrPng,
    }),
  );
  await writeFile(join(OUT, 'cbr-smoke-card.pdf'), cardBuf);

  // ─── 2. Certificate (founding member) ──────────────────────────────────────
  const certFmBuf = await pdfToBuffer(
    Certificate({
      displayName: 'John Doe',
      isFoundingMember: true,
      verifiedAt: new Date('2026-05-01'),
      certificateNumber: 'CBR-FM-C749F92D',
    }),
  );
  await writeFile(join(OUT, 'cbr-smoke-cert-founding.pdf'), certFmBuf);

  // ─── 2b. Certificate (standard verified, for visual diff) ──────────────────
  const certVpBuf = await pdfToBuffer(
    Certificate({
      displayName: 'Jane Smith',
      isFoundingMember: false,
      verifiedAt: new Date('2026-05-01'),
      certificateNumber: 'CBR-VP-A1B2C3D4',
    }),
  );
  await writeFile(join(OUT, 'cbr-smoke-cert-verified.pdf'), certVpBuf);

  // ─── 3. NDA template ───────────────────────────────────────────────────────
  const ndaBuf = await pdfToBuffer(NdaTemplate({ professionalName: 'John Doe' }));
  await writeFile(join(OUT, 'cbr-smoke-nda.pdf'), ndaBuf);

  // eslint-disable-next-line no-console
  console.log('\nResults:');
  const results = [
    describe('credential card', cardBuf),
    describe('certificate (founding)', certFmBuf),
    describe('certificate (verified)', certVpBuf),
    describe('NDA template', ndaBuf),
  ];
  // eslint-disable-next-line no-console
  console.log(`\nFiles written to: ${OUT}`);
  if (results.every(Boolean)) {
    // eslint-disable-next-line no-console
    console.log('All four PDFs valid (start with %PDF- magic).');
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error('One or more outputs are not valid PDFs.');
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Smoke runner failed:', err);
  process.exit(1);
});
