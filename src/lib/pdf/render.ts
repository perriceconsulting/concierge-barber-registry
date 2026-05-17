import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

/**
 * Render a React-PDF document to a Buffer suitable for a NextResponse body.
 *
 * @react-pdf/renderer ships with `renderToBuffer` but it pulls a different
 * code path that's flaky on Vercel's Node 22 runtime. Streaming is reliable —
 * collect the chunks ourselves.
 */
export async function pdfToBuffer(doc: ReactElement<DocumentProps>): Promise<Buffer> {
  const stream = await renderToStream(doc);
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
