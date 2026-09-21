import { fail, hex, type StoreEnvironment } from './store-security';
import { MAX_IMAGE_BYTES, uploadedImagePattern, validWebp } from './store-image-format';

export async function uploadProductImage(request: Request, settings: StoreEnvironment) {
  const bucket = settings.STORE_IMAGES;
  if (!bucket) return fail(503, 'O armazenamento de imagens ainda não foi configurado.');
  if (request.headers.get('content-type') !== 'image/webp')
    return fail(415, 'Selecione uma imagem JPG, PNG ou WebP pelo formulário.');
  if (Number(request.headers.get('content-length')) > MAX_IMAGE_BYTES)
    return fail(413, 'A imagem preparada deve ter no máximo 5 MB.');
  const reader = request.body?.getReader();
  if (!reader) return fail(400, 'Selecione uma imagem.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel();
      return fail(413, 'A imagem preparada deve ter no máximo 5 MB.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  if (!validWebp(bytes)) return fail(415, 'Imagem inválida. Selecione outra foto e tente novamente.');
  const hash = hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
  const name = `${hash}.webp`;
  await bucket.put(`products/${name}`, bytes, {
    httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
  });
  return { imageUrl: `/store-api/images/${name}` };
}

export async function serveProductImage(request: Request, settings: StoreEnvironment) {
  const name = new URL(request.url).pathname.match(uploadedImagePattern)?.[1];
  if (!name) return fail(404, 'Imagem não encontrada.');
  if (!settings.STORE_IMAGES) return fail(503, 'Armazenamento indisponível.');
  const object = request.method === 'HEAD'
    ? await settings.STORE_IMAGES.head(`products/${name}`)
    : await settings.STORE_IMAGES.get(`products/${name}`);
  if (!object) return fail(404, 'Imagem não encontrada.');
  const headers = new Headers({
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'ETag': object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Content-Disposition': 'inline',
  });
  if (request.headers.get('If-None-Match') === object.httpEtag)
    return new Response(null, { status: 304, headers });
  headers.set('Content-Length', String(object.size));
  return new Response(request.method === 'HEAD' ? null : (object as R2ObjectBody).body, { headers });
}
