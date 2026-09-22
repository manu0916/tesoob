import bcrypt from 'bcryptjs';

export type StoreEnvironment = {
  DB?: D1Database;
  STORE_IMAGES?: R2Bucket;
  STORE_AES_KEY?: string;
  STORE_AES_KEYS?: string;
  STORE_ACTIVE_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
};
export class StoreHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const fail = (status: number, message: string): never => {
  throw new StoreHttpError(status, message);
};
const bytes = (s: string) => new TextEncoder().encode(s);
export const hex = (b: Uint8Array) =>
  Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
export const randomToken = () =>
  hex(crypto.getRandomValues(new Uint8Array(32)));
export const digest = async (s: string) =>
  hex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes(s))));
export function cookie(request: Request, name: string) {
  return (
    request.headers
      .get('cookie')
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(name + '='))
      ?.slice(name.length + 1) || ''
  );
}
export function setCookie(
  request: Request,
  name: string,
  value: string,
  age: number,
) {
  return `${name}=${value}; Path=/store-api; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export function equal(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export function csrf(request: Request) {
  const token = cookie(request, 'TESOOB_STORE_CSRF');
  if (
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site' ||
    !/^[a-f0-9]{64}$/.test(token) ||
    !equal(token, request.headers.get('X-CSRF-TOKEN') || '')
  )
    fail(403, 'Sessão expirada ou origem inválida. Atualize a página.');
}
export async function readJson(request: Request) {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    fail(415, 'Envie JSON.');
  const reader = request.body?.getReader();
  if (!reader) return fail(400, 'Preencha os campos.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) {
      await reader.cancel();
      return fail(413, 'Conteúdo muito grande.');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const part of chunks) {
    body.set(part, offset);
    offset += part.length;
  }
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(body));
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    return value as Record<string, unknown>;
  } catch {
    return fail(400, 'JSON inválido.');
  }
}
export function fields(data: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(data).some((key) => !allowed.includes(key)))
    fail(400, 'Campo não permitido.');
}
export function textField(
  data: Record<string, unknown>,
  key: string,
  max: number,
  optional = false,
): string {
  const value = data[key];
  if (optional && value == null) return '';
  if (
    typeof value !== 'string' ||
    value.length > max ||
    value.includes('\0') ||
    (!optional && !value.trim())
  )
    return fail(400, `Confira o campo ${key}.`);
  return value.trim();
}
export function credentials(
  data: Record<string, unknown>,
  registering: boolean,
) {
  fields(
    data,
    registering
      ? ['name', 'email', 'password', 'legalAccepted']
      : ['email', 'password'],
  );
  const email = textField(data, 'email', 254).toLowerCase();
  const name = registering ? textField(data, 'name', 140) : '';
  if (registering && data.legalAccepted !== true)
    return fail(400, 'Aceite os Termos de Uso e a Política de Privacidade.');
  const password = data.password;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== 'string' ||
    password.length < (registering ? 12 : 1) ||
    bytes(password).length > 72
  )
    return fail(
      400,
      'Informe e-mail válido e senha de 12+ caracteres (até 72 bytes).',
    );
  return { email, name, password };
}
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) =>
  bcrypt.compare(password, hash);
export const uuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export function integer(value: unknown, min: number, max: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    return fail(400, 'Número inválido.');
  return value;
}
const base64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unbase64 = (s: string) =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aesKey(settings: StoreEnvironment, id: string) {
  try {
    const keys: Record<string, string | undefined> = settings.STORE_AES_KEYS
      ? (JSON.parse(settings.STORE_AES_KEYS) as Record<string, string>)
      : { v1: settings.STORE_AES_KEY };
    const raw = unbase64(keys[id] || '');
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(id) || raw.length !== 32)
      throw new Error();
    return await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
  } catch {
    return fail(
      503,
      'Checkout indisponível: configuração de segurança pendente.',
    );
  }
}
export async function encryptCheckout(
  settings: StoreEnvironment,
  value: string,
  context: string,
) {
  const id = settings.STORE_ACTIVE_KEY || 'v1';
  const key = await aesKey(settings, id);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: bytes(`tesoob/d1/checkout/${id}/${context}`),
    },
    key,
    bytes(value),
  );
  return `${id}.${base64(iv)}.${base64(new Uint8Array(encrypted))}`;
}
export async function decryptCheckout(
  settings: StoreEnvironment,
  value: string,
  context: string,
) {
  try {
    const parts = value.split('.');
    if (parts.length !== 3) throw new Error();
    const [id, iv, ciphertext] = parts;
    const nonce = unbase64(iv);
    if (nonce.length !== 12) throw new Error();
    const key = await aesKey(settings, id);
    return new TextDecoder().decode(
      await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          additionalData: bytes(`tesoob/d1/checkout/${id}/${context}`),
        },
        key,
        unbase64(ciphertext),
      ),
    );
  } catch {
    return fail(503, 'Não foi possível validar os dados protegidos do pedido.');
  }
}
