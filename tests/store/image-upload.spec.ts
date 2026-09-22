import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomUUID, createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { uploadProductImage } from '../../lib/store-images';
import { validWebp } from '../../lib/store-image-format';

// Real D1 + R2 local integration. NEVER point this suite at deployed URLs.
// Start Pages with --port 4191 --persist-to .wrangler/upload-tests.
test.describe.configure({ mode: 'serial' });
const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
  'hex',
);
const id = randomUUID();

test.beforeAll(async ({ request, baseURL }) => {
  if (process.env.STORE_UPLOAD_TEST !== '1' || baseURL !== 'http://127.0.0.1:4191')
    throw new Error('Use STORE_UPLOAD_TEST=1 with the isolated upload-tests preview on port 4191.');
  expect((await request.get('/api/admin/session')).ok()).toBe(true);
  const find = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? find(join(directory, entry.name)) : entry.name.endsWith('.sqlite') ? [join(directory, entry.name)] : []);
  const file = find('.wrangler/upload-tests/v3/d1').find((path) => {
    const db = new DatabaseSync(path);
    try { return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE name='chat_admin_accounts'").get()); }
    finally { db.close(); }
  });
  if (!file) throw new Error('Isolated test D1 not found.');
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA busy_timeout=10000');
    db.prepare('INSERT INTO chat_admin_accounts VALUES (?,?,?,?)').run(id, `${id}@example.invalid`, 'disabled-fixture-password', Date.now());
    db.prepare('INSERT INTO chat_admin_sessions VALUES (?,?,?)').run(createHash('sha256').update(token).digest('hex'), id, Date.now() + 3600000);
  } finally { db.close(); }
});

test('upload real, foto pública, edição sem troca, substituição e validação mobile', async ({ page, context, request }, info) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  await context.addCookies([{ name: 'tesoob_admin', value: token, url: 'http://127.0.0.1:4191', httpOnly: true, sameSite: 'Lax' }]);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/admin/produtos?novo=1');
  const name = `Upload local ${id}`;
  await page.getByLabel('Nome', { exact: true }).fill(name);
  await page.getByLabel('Preço (R$)').fill('129.90');
  await page.getByLabel('Descrição', { exact: true }).fill('Produto isolado para teste de arquivos.');
  const input = page.getByLabel('Foto da peça', { exact: true });
  await expect(input).toHaveAttribute('type', 'file');
  await input.setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByRole('alert')).toContainText('JPG, PNG ou WebP');
  await input.setInputFiles('public/media/social-card.jpg');
  await expect(page.getByAltText('Prévia da foto da peça')).toBeVisible();
  await expect.poll(() => page.getByAltText('Prévia da foto da peça').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: info.outputPath('image-picker-mobile.png'), fullPage: true });
  const upload = page.waitForResponse((response) => response.url().endsWith('/admin/images') && response.request().method() === 'POST');
  const saved = page.waitForResponse((response) => response.url().endsWith('/admin/products') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  const uploadResponse = await upload;
  expect(uploadResponse.status()).toBe(201);
  const { imageUrl } = await uploadResponse.json();
  expect(imageUrl).toMatch(/^\/store-api\/images\/[a-f0-9]{64}\.webp$/);
  expect((await saved).status()).toBe(201);
  await expect(page.getByText('Produto salvo. A vitrine já usa os novos dados.')).toBeVisible();
  // This request fixture has no administrative cookie.
  const image = await request.get(imageUrl);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toBe('image/webp');
  expect(image.headers()['x-content-type-options']).toBe('nosniff');
  expect((await image.body()).length).toBeGreaterThan(100);
  const bytes = new Uint8Array(await image.body());
  expect(validWebp(bytes)).toBe(true);
  expect(validWebp(bytes.slice(0, -1))).toBe(false);
  const fake = bytes.slice();
  fake[0] = 0;
  expect(validWebp(fake)).toBe(false);
  const metadata = new Uint8Array(bytes.length + 8);
  metadata.set(bytes);
  metadata.set(new TextEncoder().encode('EXIF'), bytes.length);
  new DataView(metadata.buffer).setUint32(4, metadata.length - 8, true);
  expect(validWebp(metadata)).toBe(false);
  expect((await request.head(imageUrl)).status()).toBe(200);
  expect((await request.get(imageUrl, { headers: { 'If-None-Match': image.headers().etag } })).status()).toBe(304);
  expect((await request.get(`/store-api/images/${'0'.repeat(64)}.webp`)).status()).toBe(404);
  await page.getByRole('button', { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByAltText('Prévia da foto da peça')).toHaveAttribute('src', imageUrl);
  let additionalUploads = 0;
  page.on('request', (r) => { if (r.url().endsWith('/admin/images')) additionalUploads++; });
  const updated = page.waitForResponse((r) => r.request().method() === 'PUT');
  await page.getByRole('textbox', { name: 'Descrição', exact: true }).fill('Descrição atualizada sem trocar foto.');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  expect((await (await updated).json()).imageUrl).toBe(imageUrl);
  expect(additionalUploads).toBe(0);
  await expect(page.getByText('Produto salvo. A vitrine já usa os novos dados.')).toBeVisible();
  await page.getByRole('button', { name: `Editar ${name}`, exact: true }).click();
  await input.setInputFiles('public/media/editorial-04.webp');
  const replaced = page.waitForResponse((r) => r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  const newImage = (await (await replaced).json()).imageUrl;
  expect(newImage).not.toBe(imageUrl);
  expect((await request.get(newImage)).status()).toBe(200);
  expect((await request.get(imageUrl)).status()).toBe(200); // No deletion of older references.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('limite real do stream e ausência de R2 falham sem gravar objeto', async () => {
  let puts = 0;
  const bucket = { put: async () => { puts++; } } as unknown as R2Bucket;
  const missing = new Request('http://localhost/store-api/admin/images', { method: 'POST', body: 'x', headers: { 'Content-Type': 'image/webp' } });
  await expect(uploadProductImage(missing, {})).rejects.toMatchObject({ status: 503 });
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); },
    cancel() { cancelled = true; },
  });
  const init: RequestInit & { duplex: string } = {
    method: 'POST', headers: { 'Content-Type': 'image/webp' }, body: stream,
    duplex: 'half',
  };
  const request = new Request('http://localhost/store-api/admin/images', init);
  await expect(uploadProductImage(request, { STORE_IMAGES: bucket })).rejects.toMatchObject({ status: 413 });
  expect(cancelled).toBe(true);
  expect(puts).toBe(0);
});

async function csrfHeaders(request: APIRequestContext) {
  const csrf = await (await request.get('/store-api/auth/csrf')).json();
  return { Origin: 'http://127.0.0.1:4191', [csrf.headerName]: csrf.token, 'Content-Type': 'image/webp' };
}

test('API bloqueia visitante, CSRF, arquivo falso, excesso de tamanho e caminho inválido', async ({ playwright, request }) => {
  const headers = await csrfHeaders(request);
  expect((await request.post('/store-api/admin/images', { headers, data: 'not-image' })).status()).toBe(403);
  const admin = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:4191',
    storageState: { cookies: [{ name: 'tesoob_admin', value: token, domain: '127.0.0.1', path: '/', expires: -1, httpOnly: true, secure: false, sameSite: 'Lax' }], origins: [] } });
  try {
    const valid = await csrfHeaders(admin);
    expect((await admin.post('/store-api/admin/images', { data: 'x' })).status()).toBe(403);
    expect((await admin.post('/store-api/admin/images', { headers: { ...valid, Origin: 'https://wrong.invalid' }, data: 'x' })).status()).toBe(403);
    expect((await admin.post('/store-api/admin/images', { headers: { ...valid, 'Content-Type': 'image/svg+xml' }, data: '<svg/>' })).status()).toBe(415);
    expect((await admin.post('/store-api/admin/images', { headers: valid, data: '<svg/>' })).status()).toBe(415);
    expect((await admin.post('/store-api/admin/images', { headers: valid, data: Buffer.alloc(5 * 1024 * 1024 + 1) })).status()).toBe(413);
    expect((await request.get('/store-api/images/not-an-image.svg')).status()).toBe(404);
  } finally { await admin.dispose(); }
});
