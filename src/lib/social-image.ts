import { toPng } from 'html-to-image';

/**
 * Convert an external image URL to a base64 data URL.
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

/**
 * Generate a PNG from a DOM element.
 * Temporarily positions the element on-screen for reliable capture,
 * then restores it.
 */
export async function generatePostImage(
  element: HTMLElement,
  width: number,
  height: number
): Promise<string> {
  // Temporarily make visible for capture
  const originalStyle = element.style.cssText;
  element.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${width}px;
    height: ${height}px;
    z-index: 99999;
    overflow: hidden;
    opacity: 1;
  `;

  // Wait for render + images
  await new Promise((r) => setTimeout(r, 500));

  try {
    const dataUrl = await toPng(element, {
      width,
      height,
      pixelRatio: 1,
      cacheBust: false,
      skipAutoScale: true,
      canvasWidth: width,
      canvasHeight: height,
    });
    return dataUrl;
  } finally {
    // Restore hidden state
    element.style.cssText = originalStyle;
  }
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
