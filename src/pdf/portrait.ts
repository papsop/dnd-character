/**
 * Portrait encoding.
 *
 * react-pdf embeds JPEG and PNG and nothing else: handed a WebP data URL it logs
 * "Base64 image invalid format: webp" to the console and renders the page *without* the picture.
 * The portrait looked right in the browser - an `<img>` takes WebP happily - and then quietly
 * failed to appear on the printed sheet, which is the worst way for this to go wrong.
 *
 * So portraits are stored as JPEG. Photographs is what they are, and a JPEG of a 512px portrait is
 * smaller than the PNG anyway, which matters because the whole build lives in localStorage.
 */

/** What react-pdf can actually embed. */
const PRINTABLE = /^data:image\/(jpeg|jpg|png);base64,/i;

export const isPrintablePortrait = (dataUrl: string): boolean => PRINTABLE.test(dataUrl);

export const PORTRAIT_MAX_PX = 512;

/**
 * Downscales an uploaded image and encodes it as JPEG.
 *
 * A phone photo is several megabytes and would fill localStorage on its own, so the long edge is
 * capped. Transparency is flattened onto white rather than dropped to black, because a PNG with an
 * alpha channel is a normal thing to upload.
 */
export async function encodePortrait(file: Blob, max = PORTRAIT_MAX_PX): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    return drawToJpeg(bitmap, max);
  } finally {
    bitmap.close();
  }
}

/**
 * Re-encodes a stored portrait if it is in a format the PDF cannot take.
 *
 * Saves made before portraits were stored as JPEG hold a WebP data URL, and an exported JSON file
 * can be as old as you like. Converting at print time keeps those characters printable instead of
 * silently dropping their picture.
 */
export async function toPrintablePortrait(dataUrl: string): Promise<string | undefined> {
  if (isPrintablePortrait(dataUrl)) return dataUrl;
  try {
    const response = await fetch(dataUrl);
    return await encodePortrait(await response.blob());
  } catch {
    // A portrait is never worth failing the download over - print the sheet without it.
    return undefined;
  }
}

function drawToJpeg(bitmap: ImageBitmap, max: number): string {
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.82);
}
