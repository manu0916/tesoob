import { test, expect, type Page } from '@playwright/test';

// Browser-only fixtures. All API calls are intercepted, including mutations.
test.beforeEach(async ({ page, baseURL }) => {
  if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname))
    throw new Error('Admin workspace tests must run against a local preview.');
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({ json: path.endsWith('/session')
      ? { authenticated: true, configured: true, setupAvailable: false }
      : { conversations: [], nextCursor: null } });
  });
  await page.route('**/store-api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/store-api/auth/me')
      return route.fulfill({ json: { id: 'fixture-admin', email: 'preview@example.invalid', role: 'ADMIN' } });
    if (path === '/store-api/admin/products' && route.request().method() === 'GET')
      return route.fulfill({ json: { items: [{ id: 'fixture-product', name: 'Peça de prévia',
        price: 189, imageUrl: '/media/editorial-04.webp', description: 'Apenas uma prévia local.',
        observation: null, active: true, version: 0 }], page: 0, totalPages: 1, totalElements: 1 } });
    if (path === '/store-api/auth/csrf')
      return route.fulfill({ json: { token: 'fixture', headerName: 'X-CSRF-Token' } });
    if (path.startsWith('/store-api/admin/products') && route.request().method() !== 'GET')
      return route.fulfill({ status: 204 });
    return route.fulfill({ status: 401, json: { message: 'Entre na sua conta.' } });
  });
});

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const width of [390, 1440]) {
  test(`acesso à vitrine e edição de peças (${width}px)`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'SUA VITRINE.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ENCOMENDAS', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Encomendas', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath(`admin-${width}.png`), fullPage: true });
    await page.getByRole('link', { name: 'Gerenciar peças' }).click();
    await expect(page).toHaveURL(/\/admin\/produtos$/);
    await expect(page.getByRole('navigation', { name: 'Áreas do administrador' }).getByRole('link', { name: 'Vitrine', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Editar Peça de prévia' }).click();
    await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toHaveValue('Peça de prévia');
    await page.getByRole('button', { name: 'Fechar edição' }).click();
    await expect(page.getByRole('button', { name: 'Editar Peça de prévia' })).toBeFocused();
    await noOverflow(page);
    await page.getByRole('link', { name: 'Encomendas', exact: true }).click();
    await page.getByRole('link', { name: 'Adicionar peça' }).click();
    await expect(page.getByRole('region', { name: 'Nova peça', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Nome', exact: true })).toBeFocused();
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath(`editor-${width}.png`) });
    await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Peça apenas de teste');
    await page.getByRole('spinbutton', { name: 'Preço (R$)' }).fill('189');
    await page.getByRole('textbox', { name: 'URL da imagem' }).fill('/media/editorial-04.webp');
    await page.getByRole('textbox', { name: 'Descrição', exact: true }).fill('Teste no navegador, sem gravação no banco.');
    await page.getByRole('button', { name: 'Salvar produto' }).click();
    await expect(page.getByText('Produto salvo. A vitrine já usa os novos dados.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Nova peça', exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('atalhos não aparecem sem sessão e novo produto preserva destino no login', async ({ page }) => {
  await page.route('**/api/admin/session', (route) => route.fulfill({ json: { authenticated: false, configured: true, setupAvailable: false } }));
  await page.route('**/store-api/auth/me', (route) => route.fulfill({ status: 401, json: { message: 'Entre na sua conta.' } }));
  await page.goto('/admin');
  await expect(page.getByRole('button', { name: 'Entrar no painel' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gerenciar peças' })).toHaveCount(0);
  await page.goto('/admin/produtos?novo=1');
  await expect(page.getByRole('region', { name: 'Nova peça', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: /Entrar como administrador/ })).toHaveAttribute('href', '/loja/conta?next=%2Fadmin%2Fprodutos%3Fnovo%3D1');
});
