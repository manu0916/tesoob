export type StoreUser = {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
};
export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  observation: string | null;
  active: boolean;
  version: number;
};
export type ProductPage = {
  items: Product[];
  page: number;
  totalPages: number;
  totalElements: number;
};
export type Order = {
  id: string;
  productName: string;
  quantity: number;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
};
export type CheckoutResult = {
  order: Order;
  payment: { status: string; message: string; redirectUrl: string | null };
};
export class StoreError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function storeApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (typeof init.body === 'string' && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  if (init.method && !['GET', 'HEAD'].includes(init.method)) {
    const csrf = await storeApi<{ token: string; headerName: string }>(
      '/auth/csrf',
      { signal: init.signal },
    );
    headers.set(csrf.headerName, csrf.token);
  }
  let response: Response;
  try {
    response = await fetch(`/store-api${path}`, {
      ...init,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new StoreError(
      503,
      'A loja está temporariamente indisponível. Tente novamente.',
    );
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok || !body) {
    const message =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : 'Não foi possível acessar a loja. Tente novamente.';
    throw new StoreError(response.status, message);
  }
  return body as T;
}
export const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  );
export function storeMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir. Tente novamente.';
}
export function formText(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === 'string' ? value : '';
}
export function safeReturn(value: string | null) {
  return value &&
    (/^\/loja\/checkout\/[a-f0-9-]{36}$/.test(value) ||
      value === '/admin/produtos' || value === '/admin/produtos?novo=1')
    ? value
    : '/loja';
}
