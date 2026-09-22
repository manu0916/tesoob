import { test, expect, type Page } from '@playwright/test';

// Browser-only fixtures. All API calls are intercepted, including mutations.
test.beforeEach(async ({ page, baseURL }) => {
  if (
    !baseURL ||
    !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)
  )
    throw new Error('Admin workspace tests must run against a local preview.');
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      json: path.endsWith('/session')
        ? { authenticated: true, configured: true, setupAvailable: false }
        : { conversations: [], nextCursor: null },
    });
  });
  let dashboardStatus = 'AWAITING_INTEGRATION';
  await page.route('**/store-api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/store-api/auth/me')
      return route.fulfill({
        json: {
          id: 'fixture-admin',
          email: 'preview@example.invalid',
          role: 'ADMIN',
        },
      });
    if (
      path === '/store-api/admin/products' &&
      route.request().method() === 'GET'
    )
      return route.fulfill({
        json: {
          items: [
            {
              id: 'fixture-product',
              name: 'Peça de prévia',
              price: 189,
              imageUrl: '/media/editorial-04.webp',
              description: 'Apenas uma prévia local.',
              observation: null,
              sizes: ['P', '38'],
              dropId: null,
              active: true,
              version: 0,
            },
          ],
          page: 0,
          totalPages: 1,
          totalElements: 1,
        },
      });
    if (path === '/store-api/admin/drops' && route.request().method() === 'GET')
      return route.fulfill({ json: { items: [] } });
    if (
      path === '/store-api/admin/drops' &&
      route.request().method() === 'POST'
    )
      return route.fulfill({
        status: 201,
        json: {
          id: 'fixture-drop',
          name: 'Noite em movimento',
          launchesAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'SCHEDULED',
          productCount: 1,
          version: 0,
        },
      });
    if (
      path === '/store-api/admin/dashboard' &&
      route.request().method() === 'GET'
    ) {
      const confirmed = dashboardStatus !== 'AWAITING_INTEGRATION';
      return route.fulfill({
        json: {
          metrics: {
            soldPieces: confirmed ? 2 : 0,
            revenue: confirmed ? 378 : 0,
            pendingOrders: confirmed ? 0 : 1,
            acceptedOrders: dashboardStatus === 'PENDING_PAYMENT' ? 1 : 0,
            productionOrders: dashboardStatus === 'PAID' ? 1 : 0,
            totalOrders: 1,
            averageTicket: confirmed ? 378 : 0,
          },
          orders: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              customerName: 'Ana Cliente',
              customerEmail: 'ana@example.invalid',
              productName: 'PeÃ§a de prÃ©via',
              quantity: 2,
              total: 378,
              currency: 'BRL',
              status: dashboardStatus,
              createdAt: '2026-09-22T10:30:00.000Z',
            },
          ],
          page: 0,
          totalPages: 1,
          totalElements: 1,
        },
      });
    }
    if (
      path === '/store-api/admin/orders/11111111-1111-4111-8111-111111111111' &&
      route.request().method() === 'PUT'
    ) {
      const body = route.request().postDataJSON() as { status: string };
      dashboardStatus = body.status === 'ACCEPTED' ? 'PENDING_PAYMENT' : 'PAID';
      return route.fulfill({
        json: {
          id: '11111111-1111-4111-8111-111111111111',
          status: dashboardStatus,
        },
      });
    }
    if (path === '/store-api/auth/csrf')
      return route.fulfill({
        json: { token: 'fixture', headerName: 'X-CSRF-Token' },
      });
    if (path === '/store-api/admin/images')
      return route.fulfill({
        status: 201,
        json: { imageUrl: `/store-api/images/${'a'.repeat(64)}.webp` },
      });
    if (
      path.startsWith('/store-api/admin/products') &&
      route.request().method() !== 'GET'
    )
      return route.fulfill({ status: 204 });
    return route.fulfill({
      status: 401,
      json: { message: 'Entre na sua conta.' },
    });
  });
});

test('dashboard resume vendas e avanÃ§a o pedido atÃ© a produÃ§Ã£o', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/admin');
  await expect(
    page.getByRole('button', { name: 'Dashboard', exact: true }),
  ).toHaveAttribute('aria-expanded', 'true');
  await expect(
    page.getByRole('heading', { name: 'PAINEL DE VENDAS' }),
  ).toBeVisible();
  await expect(
    page
      .getByText('PeÃ§as vendidas')
      .locator('..')
      .getByText('0', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Pendente', { exact: true })).toBeVisible();
  await page.screenshot({
    path: info.outputPath('dashboard-desktop.png'),
    fullPage: true,
  });

  await page.getByRole('button', { name: 'Aceitar pedido' }).click();
  await expect(page.getByText('Aceito', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Iniciar produÃ§Ã£o' }),
  ).toBeVisible();
  await expect(
    page
      .getByText('PeÃ§as vendidas')
      .locator('..')
      .getByText('2', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Iniciar produÃ§Ã£o' }).click();
  await expect(page.locator('.admin-order-status-paid')).toHaveText(
    'Em produÃ§Ã£o',
  );
  await expect(page.getByText('Em andamento', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 1000 });
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath('dashboard-mobile.png'),
    fullPage: true,
  });
});

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test('lançar drop com peça e tamanhos alfanuméricos', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 900 });
  let submittedSizes: string[] = [];
  await page.route('**/store-api/admin/drops', async (route) => {
    if (route.request().method() === 'POST') {
      const submitted = route.request().postDataJSON() as {
        products: { sizes: string[] }[];
      };
      submittedSizes = submitted.products[0].sizes;
      return route.fulfill({
        status: 201,
        json: {
          id: 'fixture-drop',
          name: 'Noite em movimento',
          launchesAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'SCHEDULED',
          productCount: 1,
          version: 0,
        },
      });
    }
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto('/admin/produtos');
  await page.getByRole('button', { name: 'Lançar drop' }).click();
  await page
    .getByRole('textbox', { name: 'Nome do drop' })
    .fill('Noite em movimento');
  await expect(page.locator('.store-drop-preview h3')).toHaveText(
    'Noite em movimento',
  );
  await page
    .getByRole('textbox', { name: 'Nome', exact: true })
    .fill('Vestido de teste');
  await page.getByRole('spinbutton', { name: 'Preço (R$)' }).fill('249.90');
  await page
    .getByLabel('Foto da peça', { exact: true })
    .setInputFiles('public/media/editorial-04.webp');
  await page
    .getByRole('textbox', { name: 'Descrição', exact: true })
    .fill('Peça de teste do drop.');
  await page.getByRole('textbox', { name: 'Adicionar tamanho' }).fill('P');
  await page.getByRole('button', { name: 'Confirmar tamanho' }).click();
  await page.getByRole('textbox', { name: 'Adicionar tamanho' }).fill('38');
  await page.getByRole('button', { name: 'Confirmar tamanho' }).click();
  await page.getByRole('button', { name: 'Incluir peça no drop' }).click();
  await expect(page.locator('.store-drop-piece-list article')).toHaveCount(1);
  await noOverflow(page);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.screenshot({
    path: info.outputPath('drop-mobile.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Agendar lançamento' }).click();
  await expect(
    page.getByText('Drop agendado. Todas as peças entrarão no ar juntas.'),
  ).toBeVisible();
  expect(submittedSizes).toEqual(['P', '38']);
});

for (const width of [390, 1440]) {
  test(`acesso à vitrine e edição de peças (${width}px)`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/admin');
    await expect(
      page.getByRole('button', { name: 'Vitrine', exact: true }),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(
      page.getByRole('button', { name: 'Encomendas', exact: true }),
    ).toHaveAttribute('aria-expanded', 'false');
    await expect(
      page.getByRole('link', { name: 'Gerenciar peças' }),
    ).toBeHidden();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: info.outputPath(`admin-closed-${width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Vitrine', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'SUA VITRINE.' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Encomendas', exact: true }),
    ).toBeHidden();
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    await page.screenshot({
      path: info.outputPath(`admin-${width}.png`),
      fullPage: true,
    });
    await page.getByRole('link', { name: 'Gerenciar peças' }).click();
    await expect(page).toHaveURL(/\/admin\/produtos$/);
    await expect(
      page
        .getByRole('navigation', { name: 'Áreas do administrador' })
        .getByRole('link', { name: 'Vitrine', exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await page.getByRole('button', { name: 'Editar Peça de prévia' }).click();
    await expect(
      page.getByRole('textbox', { name: 'Nome', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole('textbox', { name: 'Nome', exact: true }),
    ).toHaveValue('Peça de prévia');
    await page.getByRole('button', { name: 'Fechar edição' }).click();
    await expect(
      page.getByRole('button', { name: 'Editar Peça de prévia' }),
    ).toBeFocused();
    await noOverflow(page);
    await page.getByRole('link', { name: 'Encomendas', exact: true }).click();
    await page.getByRole('button', { name: 'Vitrine', exact: true }).click();
    await page.getByRole('link', { name: 'Adicionar peça' }).click();
    await expect(
      page.getByRole('region', { name: 'Nova peça', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Nome', exact: true }),
    ).toBeFocused();
    await noOverflow(page);
    await page.screenshot({ path: info.outputPath(`editor-${width}.png`) });
    await page
      .getByRole('textbox', { name: 'Nome', exact: true })
      .fill('Peça apenas de teste');
    await page.getByRole('spinbutton', { name: 'Preço (R$)' }).fill('189');
    await page
      .getByLabel('Foto da peça', { exact: true })
      .setInputFiles('public/media/editorial-04.webp');
    await page
      .getByRole('textbox', { name: 'Descrição', exact: true })
      .fill('Teste no navegador, sem gravação no banco.');
    await page.getByRole('button', { name: 'Salvar produto' }).click();
    await expect(
      page.getByText('Produto salvo. A vitrine já usa os novos dados.'),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Nova peça', exact: true }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('atalhos não aparecem sem sessão e novo produto preserva destino no login', async ({
  page,
}) => {
  await page.route('**/api/admin/session', (route) =>
    route.fulfill({
      json: { authenticated: false, configured: true, setupAvailable: false },
    }),
  );
  await page.route('**/store-api/auth/me', (route) =>
    route.fulfill({ status: 401, json: { message: 'Entre na sua conta.' } }),
  );
  await page.goto('/admin');
  await expect(
    page.getByRole('button', { name: 'Entrar no painel' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gerenciar peças' })).toHaveCount(
    0,
  );
  await page.goto('/admin/produtos?novo=1');
  await expect(
    page.getByRole('region', { name: 'Nova peça', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /Entrar como administrador/ }),
  ).toHaveAttribute('href', '/loja/conta?next=%2Fadmin%2Fprodutos%3Fnovo%3D1');
});

test('divisórias abrem por teclado, fecham entre si e preservam filtros', async ({
  page,
}, info) => {
  let orderReads = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/admin/conversations')
      orderReads++;
  });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/admin');
  const store = page.getByRole('button', { name: 'Vitrine', exact: true });
  const orders = page.getByRole('button', { name: 'Encomendas', exact: true });
  await expect(orders).toBeVisible();
  expect(orderReads).toBe(0);
  await orders.focus();
  await orders.press('Enter');
  await expect(orders).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByLabel('Buscar encomendas')).toBeVisible();
  await page.getByLabel('Buscar encomendas').fill('Busca mantida');
  await page.screenshot({
    path: info.outputPath('admin-orders-open.png'),
    fullPage: true,
  });
  await store.click();
  await expect(orders).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('Buscar encomendas')).toBeHidden();
  await expect(
    page.getByRole('link', { name: 'Gerenciar peças' }),
  ).toBeVisible();
  await orders.click();
  await expect(store).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('Buscar encomendas')).toHaveValue(
    'Busca mantida',
  );
  await orders.press('Space');
  await expect(orders).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('Buscar encomendas')).toBeHidden();
  await page.reload();
  await expect(store).toHaveAttribute('aria-expanded', 'false');
  await expect(orders).toHaveAttribute('aria-expanded', 'false');
  await noOverflow(page);
});
