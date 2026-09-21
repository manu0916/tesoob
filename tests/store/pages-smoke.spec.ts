import { test, expect } from '@playwright/test';

test('artefato Pages: SSR, assets, D1, CSRF e área administrativa', async ({
  page,
  request,
}) => {
  test.skip(
    !process.env.STORE_PAGES_SMOKE,
    'Executado separadamente contra wrangler pages dev.',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/loja');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'VISTA O',
  );
  await expect
    .poll(async () => (await request.get('/store-api/products')).status())
    .toBe(200);
  const products = await (await request.get('/store-api/products')).json();
  expect(products.items).toEqual([]);
  expect((await request.get('/media/logo-tesoob.png')).status()).toBe(200);
  const csrf = await request.get('/store-api/auth/csrf');
  expect((await csrf.json()).token).toMatch(/^[a-f0-9]{64}$/);
  expect(csrf.headers()['set-cookie']).toContain('HttpOnly');
  expect(
    (await request.post('/store-api/admin/products', { data: {} })).status(),
  ).toBe(403);
  await page.goto('/loja/conta');
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Navegação Tesoob' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Fechar menu' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({
    path: 'test-results/pages-account.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
