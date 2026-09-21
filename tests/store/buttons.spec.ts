import { test, expect } from '@playwright/test';

// Read-only interaction checks: never submit customer/admin forms on a live site.
test('produto: abrir detalhes, comprar e preservar retorno ao checkout', async ({
  page,
}) => {
  const product = {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Produto apenas no navegador de teste',
    price: 125,
    imageUrl: '/media/editorial-04.webp',
    description: 'Fixture interceptada, nunca gravada no banco.',
    observation: null,
    active: true,
    version: 0,
  };
  await page.route('**/store-api/products**', async (route) => {
    const listing =
      new URL(route.request().url()).pathname === '/store-api/products';
    await route.fulfill({
      json: listing
        ? { items: [product], page: 0, totalPages: 1, totalElements: 1 }
        : product,
    });
  });
  await page.goto('/loja');
  await page.getByRole('link', { name: 'Conhecer a peça' }).click();
  await expect(page).toHaveURL(new RegExp(`/loja/produtos/${product.id}$`));
  await page.getByRole('link', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/loja/conta\\?next=%2Floja%2Fcheckout%2F${product.id}$`),
  );
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`redirecionamentos: vitrine, conta e administrador (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && message.text().includes('[vinext]'))
        errors.push(message.text());
    });
    await page.goto('/');
    await page.locator('.store-magnetic').click();
    await expect(page).toHaveURL(/\/loja$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'VISTA O',
    );
    await page.getByRole('link', { name: 'Minha conta' }).click();
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Voltar à vitrine' }).click();
    await expect(page).toHaveURL(/\/loja$/);
    await page.getByRole('link', { name: 'Área do ateliê' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('button', { name: 'Entrar no painel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Gerenciar peças' })).toHaveCount(0);
    await page.goto('/admin/produtos');
    await expect(page).toHaveURL(/\/admin\/produtos$/);
    await page.getByRole('link', { name: /Entrar como administrador/ }).click();
    await expect(page).toHaveURL(/\/loja\/conta\?next=%2Fadmin%2Fprodutos$/);
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/produtos$/);
    expect(errors).toEqual([]);
  });
}

test('editorial: expandir, navegar e fechar fotografias', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ver arquivo completo/ }).click();
  await expect(page.locator('.editorial-grid .gallery-photo')).toHaveCount(16);
  await page.locator('.editorial-grid .gallery-photo').first().click();
  const dialog = page.getByRole('dialog', { name: 'Fotografias Tesoob' });
  await expect(dialog).toBeVisible();
  const image = dialog.locator('.lightbox-photo img');
  const first = await image.getAttribute('src');
  await dialog.getByRole('button', { name: 'Próxima fotografia' }).click();
  await expect(image).not.toHaveAttribute('src', first!);
  await dialog.getByRole('button', { name: 'Fotografia anterior' }).click();
  await expect(image).toHaveAttribute('src', first!);
  await dialog.getByRole('button', { name: 'Fechar fotografia' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Recolher arquivo' }).click();
  await expect(page.locator('.editorial-grid .gallery-photo')).toHaveCount(6);
});

test('referência: miniaturas e fechar fotografia ampliada', async ({
  page,
}) => {
  await page.goto('/pecas/vermelho-amarracoes');
  await page
    .getByRole('button', { name: 'Ver fotografia 2', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Ver fotografia 2', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Ampliar fotografia da referência' })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Próxima fotografia' }).click();
  await dialog.getByRole('button', { name: 'Fechar fotografia' }).click();
  await expect(dialog).toBeHidden();
});

test('menu móvel: todos os destinos na página inicial', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const [label, id] of [
    ['Peças', 'pecas'],
    ['Editorial', 'editorial'],
    ['Processo', 'processo'],
    ['Encomendar', 'encomendar'],
  ]) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const dialog = page.getByRole('dialog', { name: 'Navegação Tesoob' });
    await dialog.getByRole('button', { name: new RegExp(label) }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test('encomenda: escolher chat, voltar, fechar e reabrir', async ({ page }) => {
  await page.goto('/');
  const launcher = page
    .locator('.site-header')
    .getByRole('button', { name: 'Encomendar', exact: true });
  await launcher.click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: /Encomendar pelo chat/ }).click();
  await expect(dialog).toHaveAccessibleName('Conversa com a Tesoob');
  await dialog.getByRole('button', { name: 'Fechar encomenda' }).click();
  await expect(dialog).toBeHidden();
  await launcher.click();
  dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('button', { name: /Encomendar pelo chat/ }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar encomenda' }).click();
  await expect(dialog).toBeHidden();
});

test('conta: alternar cadastro/login e voltar à vitrine', async ({ page }) => {
  await page.goto('/loja/conta');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Criar minha conta' }),
  ).toBeVisible();
  await page
    .locator('.store-tabs')
    .getByRole('button', { name: 'Entrar', exact: true })
    .click();
  await expect(
    page.locator('form').getByRole('button', { name: 'Entrar', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Voltar à vitrine' }).click();
  await expect(page).toHaveURL(/\/loja$/);
});

test('rodapé: voltar ao topo nas páginas internas', async ({ page }) => {
  for (const path of ['/pecas/vermelho-amarracoes', '/loja/conta']) {
    await page.goto(path);
    await page.getByRole('link', { name: 'Voltar ao topo' }).click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(100);
  }
});
