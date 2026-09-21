import { test, expect, type Page } from '@playwright/test';

test.beforeAll(async ({ baseURL }) => {
  if (
    !baseURL ||
    !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)
  ) {
    throw new Error(
      'Estes testes só podem criar dados no D1 local isolado de QA.',
    );
  }
});

async function capture(page: Page, path: string) {
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
}

test('vitrine, ausência de observações, login e checkout sem cobrança', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/loja');
  await expect(
    page.locator('.store-card').filter({ hasText: '[DEMO]' }),
  ).toHaveCount(3);
  await expect(
    page
      .locator('.store-card')
      .filter({ hasText: 'Vermelho.' })
      .locator('.store-observation'),
  ).toHaveCount(0);
  await expect(
    page
      .locator('.store-card')
      .filter({ hasText: 'Verde.' })
      .locator('.store-observation'),
  ).toHaveCount(1);
  await capture(page, 'test-results/store-desktop.png');
  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, 'test-results/store-mobile.png');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator('.store-card')
    .filter({ hasText: 'Vermelho.' })
    .getByRole('link', { name: 'Conhecer a peça' })
    .click();
  await expect(
    page.locator('.store-detail-copy .store-observation'),
  ).toHaveCount(0);
  await page.getByRole('link', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/loja\/conta\?next=/);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  const email = `buyer-${Date.now()}@example.test`;
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page
    .getByLabel('Senha', { exact: true })
    .fill('Customer-browser-test-2026');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(
    page.getByText('Conta criada. Entre para continuar.'),
  ).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page
    .getByLabel('Senha', { exact: true })
    .fill('Customer-browser-test-2026');
  await page
    .locator('form')
    .getByRole('button', { name: 'Entrar', exact: true })
    .click();
  await expect(page).toHaveURL(/\/loja\/checkout\//);
  await page
    .getByLabel('Nome completo', { exact: true })
    .fill('Pessoa de Teste');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByLabel('CEP', { exact: true }).fill('01310100');
  await page.getByLabel('Rua / avenida', { exact: true }).fill('Rua de Teste');
  await page.getByLabel('Número', { exact: true }).fill('42');
  await page.getByLabel('Bairro', { exact: true }).fill('Centro');
  await page.getByLabel('Cidade', { exact: true }).fill('São Paulo');
  await page
    .getByRole('combobox', { name: 'Estado', exact: true })
    .selectOption('SP');
  await capture(page, 'test-results/checkout-mobile.png');
  await page
    .getByRole('button', { name: 'Registrar pedido sem cobrança' })
    .click();
  await expect(page.getByText(/nenhuma cobrança foi feita/)).toBeVisible();
  await page.getByRole('link', { name: 'Acompanhar meus pedidos' }).click();
  await expect(page.locator('.store-order-row')).toHaveCount(1);
  await page.goto('/admin/produtos');
  await expect(
    page.getByText('Esta área é exclusiva para administradores da vitrine.'),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('administrador cria, edita e retira produto; observação branca não ocupa espaço', async ({
  page,
}) => {
  const password = process.env.STORE_PREVIEW_PASSWORD;
  const productName = `Produto de QA ${Date.now()}`;
  if (!password)
    throw new Error(
      'Use test:store:d1 no D1 isolado com STORE_PREVIEW_PASSWORD antes deste teste.',
    );
  await page.goto('/loja/conta?next=%2Fadmin%2Fprodutos');
  await page.getByLabel('E-mail', { exact: true }).fill('admin@preview.test');
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page
    .locator('form')
    .getByRole('button', { name: 'Entrar', exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/produtos$/);
  await page.getByRole('button', { name: 'Novo produto' }).click();
  await page.getByLabel('Nome', { exact: true }).fill(productName);
  await page.getByLabel('Preço (R$)', { exact: true }).fill('199.90');
  await page
    .getByLabel('Foto da peça', { exact: true })
    .setInputFiles('public/media/editorial-04.webp');
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Descrição do produto de teste.');
  await page.getByLabel('Observação', { exact: false }).fill('   ');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  await expect(
    page.getByText('Produto salvo. A vitrine já usa os novos dados.'),
  ).toBeVisible();
  await page.goto('/loja');
  const card = page.locator('.store-card').filter({ hasText: productName });
  await expect(card).toBeVisible();
  await expect(card.locator('.store-observation')).toHaveCount(0);
  await page.goto('/admin/produtos');
  await page
    .getByRole('button', { name: `Editar ${productName}`, exact: true })
    .click();
  await page
    .getByLabel('Observação', { exact: false })
    .fill('Esta observação deve aparecer.');
  await page.getByRole('button', { name: 'Salvar produto' }).click();
  await expect(
    page.getByText('Produto salvo. A vitrine já usa os novos dados.'),
  ).toBeVisible();
  await page.goto('/loja');
  await expect(page.getByText('Esta observação deve aparecer.')).toBeVisible();
  await page.goto('/admin/produtos');
  await page
    .getByRole('button', { name: `Retirar ${productName}`, exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Retirar produto', exact: true })
    .click();
  await expect(
    page.getByText(
      'Produto retirado da vitrine. Os pedidos anteriores foram preservados.',
    ),
  ).toBeVisible();
  await page.goto('/loja');
  await expect(
    page.locator('.store-card').filter({ hasText: '[DEMO]' }),
  ).toHaveCount(3);
  await expect(page.getByText(productName, { exact: true })).toHaveCount(0);
});

test('CTA inicial e todas as ações do menu móvel navegam e fecham o diálogo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Ver vitrine', exact: true }).click();
  await expect(page).toHaveURL(/\/loja$/);
  for (const [name, hash] of [
    ['Peças', 'pecas'],
    ['Editorial', 'editorial'],
    ['Processo', 'processo'],
    ['Encomendar', 'encomendar'],
  ]) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Navegação Tesoob' });
    await expect(menu).toBeVisible();
    if (hash === 'pecas')
      await page.screenshot({
        path: 'test-results/store-menu-mobile.png',
        animations: 'disabled',
      });
    await menu.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page).toHaveURL(new RegExp(`/#${hash}$`));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect
      .poll(() =>
        page
          .locator(`#${hash}`)
          .evaluate((el) => Math.abs(el.getBoundingClientRect().top) < 200),
      )
      .toBe(true);
  }
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('button', { name: 'Fechar menu' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page.getByRole('link', { name: 'Visitar a vitrine' }).click();
  await expect(page).toHaveURL(/\/loja$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
