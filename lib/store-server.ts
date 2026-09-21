import { ChatError } from './chat-server';
import { storeDatabase, throttle } from './store-database';
import {
  customer,
  identity,
  localAuth,
  logout,
  requireStoreAdmin,
  googleConfigured,
  googleStart,
  googleCallback,
} from './store-auth';
import {
  listProducts,
  getProduct,
  saveProduct,
  archiveProduct,
  pageNumber,
} from './store-products';
import { createOrder, getOrder, listOrders } from './store-orders';
import {
  cookie,
  csrf,
  fail,
  integer,
  randomToken,
  readJson,
  setCookie,
  StoreHttpError,
  uuid,
  type StoreEnvironment,
} from './store-security';

function json(body: unknown, status = 200, init?: HeadersInit) {
  const headers = new Headers(init);
  headers.set('Cache-Control', 'no-store, private');
  headers.set('Vary', 'Cookie');
  headers.set('X-Content-Type-Options', 'nosniff');
  return status === 204
    ? new Response(null, { status, headers })
    : Response.json(body, { status, headers });
}
export async function handleStore(
  request: Request,
  settings: StoreEnvironment,
) {
  try {
    const url = new URL(request.url),
      path = url.pathname.replace(/^\/store-api/, '');
    const method = request.method;
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method))
      return json({ message: 'Método inválido.' }, 405);
    if (method !== 'GET') csrf(request);
    if (path === '/auth/csrf' && method === 'GET') {
      const old = cookie(request, 'TESOOB_STORE_CSRF');
      const token = /^[a-f0-9]{64}$/.test(old) ? old : randomToken();
      return json({ token, headerName: 'X-CSRF-TOKEN' }, 200, {
        'Set-Cookie': setCookie(request, 'TESOOB_STORE_CSRF', token, 1800),
      });
    }
    if (path === '/auth/options' && method === 'GET')
      return json({ google: googleConfigured(settings) });
    const db = await storeDatabase();
    if (path === '/auth/me' && method === 'GET')
      return json(await identity(db, request));
    if (['/auth/register', '/auth/login'].includes(path) && method === 'POST') {
      const result = await localAuth(
        db,
        request,
        await readJson(request),
        path === '/auth/register',
      );
      return json(
        result.body,
        result.status,
        result.cookie ? { 'Set-Cookie': result.cookie } : undefined,
      );
    }
    if (path === '/auth/logout' && method === 'POST')
      return json(null, 204, await logout(db, request));
    if (path === '/oauth2/authorization/google' && method === 'GET')
      return googleStart(db, request, settings);
    if (path === '/login/oauth2/code/google' && method === 'GET')
      return googleCallback(db, request, settings);
    if (path === '/products' && method === 'GET')
      return json(await listProducts(db, pageNumber(url)));
    const productId = path.match(/^\/products\/([^/]+)$/)?.[1];
    if (productId && method === 'GET')
      return json(await getProduct(db, productId));
    if (path.startsWith('/admin/')) {
      await requireStoreAdmin(request);
      if (path === '/admin/products' && method === 'GET')
        return json(await listProducts(db, pageNumber(url), true));
      if (path === '/admin/products' && method === 'POST')
        return json(await saveProduct(db, null, await readJson(request)), 201);
      const id = path.match(/^\/admin\/products\/([^/]+)$/)?.[1];
      if (id && uuid(id)) {
        if (method === 'PUT')
          return json(await saveProduct(db, id, await readJson(request)));
        if (method === 'DELETE') {
          if (!url.searchParams.has('version'))
            return fail(400, 'Informe a versão do produto.');
          await archiveProduct(
            db,
            id,
            integer(
              Number(url.searchParams.get('version')),
              0,
              Number.MAX_SAFE_INTEGER,
            ),
          );
          return json(null, 204);
        }
      }
    }
    if (path === '/orders' && method === 'GET') {
      const user = await identity(db, request);
      if (user.role === 'ADMIN')
        return json({ items: [], page: 0, totalPages: 0 });
      return json(await listOrders(db, user.id, pageNumber(url)));
    }
    if (path === '/checkout' && method === 'POST') {
      const user = await customer(db, request);
      if (!user) {
        const account = await identity(db, request);
        return fail(
          account.role === 'ADMIN' ? 403 : 401,
          'Para comprar, saia da conta administrativa e entre com uma conta de cliente.',
        );
      }
      await throttle(db, request, 'checkout', 30, user.id);
      return json(
        await createOrder(
          db,
          settings,
          user.id,
          request.headers.get('Idempotency-Key') || '',
          await readJson(request),
        ),
      );
    }
    const orderId = path.match(/^\/orders\/([^/]+)$/)?.[1];
    if (orderId && method === 'GET') {
      const user = await customer(db, request);
      if (!user) return fail(401, 'Entre na sua conta.');
      return json(await getOrder(db, user.id, orderId));
    }
    return json({ message: 'Rota não encontrada.' }, 404);
  } catch (error) {
    if (error instanceof StoreHttpError || error instanceof ChatError)
      return json(
        { message: error.message },
        error.status,
        error.status === 429 ? { 'Retry-After': '60' } : undefined,
      );
    // No SQL, passwords, encrypted payloads or billing fields in responses/logs.
    console.error(
      'Store request failed',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return json(
      { message: 'Não foi possível concluir a operação. Tente novamente.' },
      500,
    );
  }
}
