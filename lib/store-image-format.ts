export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_SIDE = 2400;
export const uploadedImagePattern = /^\/store-api\/images\/([a-f0-9]{64}\.webp)$/;

// Inspect the WebP container, not its filename or browser-supplied MIME type.
export function validWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 30 || bytes.length > MAX_IMAGE_BYTES) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WEBP' || view.getUint32(4, true) + 8 !== bytes.length) return false;
  let imageFound = false;
  let offset = 12;
  const dimensions = (width: number, height: number) =>
    width > 0 && height > 0 && width <= MAX_IMAGE_SIDE && height <= MAX_IMAGE_SIDE;
  while (offset + 8 <= bytes.length) {
    const kind = tag(offset);
    const length = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + length > bytes.length) return false;
    if (kind === 'VP8 ') {
      if (length < 10 || bytes[start + 3] !== 0x9d || bytes[start + 4] !== 1 || bytes[start + 5] !== 0x2a ||
        !dimensions(view.getUint16(start + 6, true) & 0x3fff, view.getUint16(start + 8, true) & 0x3fff)) return false;
      imageFound = true;
    } else if (kind === 'VP8L') {
      if (length < 5 || bytes[start] !== 0x2f) return false;
      const bits = view.getUint32(start + 1, true);
      if (!dimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1)) return false;
      imageFound = true;
    } else if (kind === 'VP8X') {
      if (length !== 10 || (bytes[start] & 0x02)) return false; // No animation.
      const dimension = (at: number) => 1 + bytes[at] + (bytes[at + 1] << 8) + (bytes[at + 2] << 16);
      if (!dimensions(dimension(start + 4), dimension(start + 7))) return false;
    } else if (['EXIF', 'XMP ', 'ANIM', 'ANMF'].includes(kind)) {
      return false; // Browser conversion strips private metadata and animation.
    }
    offset = start + length + (length % 2);
  }
  return imageFound && offset === bytes.length;
}
