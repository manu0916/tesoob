import { MAX_IMAGE_BYTES, MAX_IMAGE_SIDE, MAX_SOURCE_BYTES, validWebp } from './store-image-format';

export function checkImageFile(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  if (!file.size || file.size > MAX_SOURCE_BYTES)
    throw new Error('Escolha uma imagem de até 10 MB.');
}

export async function prepareProductImage(file: File): Promise<Blob> {
  checkImageFile(file);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error('Não foi possível abrir a imagem. Escolha outra foto.'); }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000)
      throw new Error('Imagem grande demais. Escolha uma foto de até 40 megapixels.');
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Seu navegador não conseguiu preparar a foto.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encode instead of uploading the original: removes EXIF/location data.
    const blob = await new Promise<Blob>((done, fail) => {
      canvas.toBlob((value) => value ? done(value) : fail(new Error('Não foi possível preparar a foto.')), 'image/webp', 0.88);
    });
    if (blob.size > MAX_IMAGE_BYTES) throw new Error('A imagem ficou grande demais. Escolha uma foto menor.');
    if (blob.type !== 'image/webp' || !validWebp(new Uint8Array(await blob.arrayBuffer())))
      throw new Error('Seu navegador não conseguiu converter a imagem. Tente com um navegador atualizado.');
    return blob;
  } finally { bitmap.close(); }
}
