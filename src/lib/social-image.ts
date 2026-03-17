import { toPng } from 'html-to-image';

/**
 * Convert an external image URL to a base64 data URL.
 * This avoids CORS issues with html-to-image by embedding
 * the image data directly.
 */
export async function imageUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generatePostImage(
  element: HTMLElement,
  width: number,
  height: number
): Promise<string> {
  // Wait a tick for any images to render
  await new Promise((r) => setTimeout(r, 100));

  return toPng(element, {
    width,
    height,
    pixelRatio: 1,
    cacheBust: true,
    includeQueryParams: true,
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
