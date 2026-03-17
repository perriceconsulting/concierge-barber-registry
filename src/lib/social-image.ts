import { toPng } from 'html-to-image';

export async function generatePostImage(
  element: HTMLElement,
  width: number,
  height: number
): Promise<string> {
  return toPng(element, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
  });
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
