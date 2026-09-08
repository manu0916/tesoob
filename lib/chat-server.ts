import { env } from 'cloudflare:workers';
import initialMigration from '@/drizzle/0000_chat.sql?raw';
import adminMigration from '@/drizzle/0001_admin_login.sql?raw';
import type {
  ChatThread,
  Conversation,
  ConversationPreview,
  OrderStatus,
} from './chat-types';

type ChatEnvironment = {
  DB?: D1Database;
  TESOOB_ADMIN_EMAIL?: string;
  TESOOB_ADMIN_PASSWORD_HASH?: string;
};
const settings = () => env as unknown as ChatEnvironment;
const CUSTOMER_COOKIE = 'tesoob_conversation';
const CUSTOMER_AGE = 60 * 60 * 24 * 30;
const ADMIN_COOKIE = 'tesoob_admin';
const ADMIN_AGE = 60 * 60 * 8;
let initialized: Promise<void> | undefined;

export class ChatError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function database() {
  const db = settings().DB;
  if (!db)
    throw new ChatError(
      503,
      'O chat está temporariamente indisponível. Tente novamente em instantes.',
    );
  initialized ??= db
    .batch(
      [initialMigration, adminMigration]
        .flatMap((migration) => migration.split('--> statement-breakpoint'))
        .map((sql) =>
          db.prepare(
            sql
              .trim()
              .replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ')
              .replace(
                /^CREATE UNIQUE INDEX /,
                'CREATE UNIQUE INDEX IF NOT EXISTS ',
              )
              .replace(/^CREATE INDEX /, 'CREATE INDEX IF NOT EXISTS '),
          ),
        ),
    )
    .then(async () => {
      const config = settings();
      const adminEmail = config.TESOOB_ADMIN_EMAIL?.trim().toLowerCase();
      if (
        adminEmail &&
        adminEmail.length <= 254 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) &&
        /^pbkdf2_sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(
          config.TESOOB_ADMIN_PASSWORD_HASH || '',
        )
      ) {
        await db
          .prepare(`INSERT INTO chat_admin_accounts (id, email, password_hash, created_at)
          SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM chat_admin_accounts)`)
          .bind(
            crypto.randomUUID(),
            adminEmail,
            config.TESOOB_ADMIN_PASSWORD_HASH,
            Date.now(),
          )
          .run();
      }
    })
    .catch((error) => {
      initialized = undefined;
      throw error;
    });
  await initialized;
  return db;
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Cache-Control', 'no-store, private');
  responseHeaders.set('Vary', 'Cookie');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  return Response.json(data, { status, headers: responseHeaders });
}

export async function handleChat(action: () => Promise<Response>) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ChatError)
      return json({ error: error.message }, error.status);
    console.error(
      'Chat request failed',
      error instanceof Error ? error.name : 'UnknownError',
    );
    return json(
      {
        error:
          'Não foi possível concluir. Sua mensagem continua no campo; tente novamente.',
      },
      500,
    );
  }
}

export function sameOrigin(request: Request) {
  if (
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new ChatError(
      403,
      'Abra o chat pelo site da Tesoob e tente novamente.',
    );
}

export async function readBody(
  request: Request,
): Promise<Record<string, unknown>> {
  sameOrigin(request);
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    throw new ChatError(415, 'Formato de mensagem inválido.');
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError(400, 'Preencha a mensagem.');
  const parts: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 12000) {
      await reader.cancel();
      throw new ChatError(413, 'A mensagem está muito longa.');
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  try {
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== 'object' || Array.isArray(data))
      throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new ChatError(400, 'A mensagem não pôde ser lida.');
  }
}

export function field(
  data: Record<string, unknown>,
  key: string,
  max: number,
  required = true,
) {
  const value = data[key];
  if (value == null && !required) return '';
  if (typeof value !== 'string')
    throw new ChatError(400, 'Confira os campos e tente novamente.');
  const clean = value.trim();
  if ((required && !clean) || clean.length > max || clean.includes('\0'))
    throw new ChatError(
      400,
      'Confira o tamanho dos campos e preencha a mensagem.',
    );
  return clean;
}

function cookie(request: Request, name: string) {
  const value = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}

function token() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    ),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
}

function setCookie(request: Request, name: string, value: string, age: number) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}

export function customerSession(request: Request, reset = false) {
  const current = cookie(request, CUSTOMER_COOKIE);
  const value = (!reset && current) || token();
  return {
    value,
    header: setCookie(request, CUSTOMER_COOKIE, value, CUSTOMER_AGE),
  };
}

export async function refreshCustomerSession(request: Request) {
  const current = cookie(request, CUSTOMER_COOKIE);
  if (current) {
    const db = await database();
    await db
      .prepare(
        'UPDATE chat_conversations SET expires_at = ? WHERE token_hash = ? AND expires_at > ?',
      )
      .bind(Date.now() + CUSTOMER_AGE * 1000, await hash(current), Date.now())
      .run();
  }
  return customerSession(request).header;
}

export async function customerSessionExpired(request: Request) {
  const current = cookie(request, CUSTOMER_COOKIE);
  if (!current) return false;
  const db = await database();
  return !!(await db
    .prepare(
      'SELECT id FROM chat_conversations WHERE token_hash = ? AND expires_at <= ?',
    )
    .bind(await hash(current), Date.now())
    .first());
}

const columns = `id, customer_name AS customerName, contact, reference, status,
  created_at AS createdAt, updated_at AS updatedAt, customer_read_id AS customerReadId, admin_read_id AS adminReadId`;

export async function customerConversation(request: Request, required = true) {
  const value = cookie(request, CUSTOMER_COOKIE);
  if (!value) {
    if (required)
      throw new ChatError(401, 'Reabra o chat para iniciar sua conversa.');
    return null;
  }
  const db = await database();
  const conversation = await db
    .prepare(
      `SELECT ${columns} FROM chat_conversations WHERE token_hash = ? AND expires_at > ?`,
    )
    .bind(await hash(value), Date.now())
    .first<Conversation>();
  if (!conversation && required)
    throw new ChatError(404, 'Inicie uma conversa para enviar sua mensagem.');
  return conversation;
}

export async function conversationById(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new ChatError(404, 'Encomenda não encontrada.');
  const db = await database();
  const conversation = await db
    .prepare(`SELECT ${columns} FROM chat_conversations WHERE id = ?`)
    .bind(id)
    .first<Conversation>();
  if (!conversation) throw new ChatError(404, 'Encomenda não encontrada.');
  return conversation;
}

export async function thread(
  conversation: Conversation,
  before?: string | null,
): Promise<ChatThread> {
  const db = await database();
  if (
    before &&
    (!/^\d+$/.test(before) || !Number.isSafeInteger(Number(before)))
  )
    throw new ChatError(400, 'Página inválida.');
  const result = await db
    .prepare(`SELECT id, sender, body, created_at AS createdAt FROM chat_messages
    WHERE conversation_id = ? ${before ? 'AND id < ?' : ''} ORDER BY id DESC LIMIT 101`)
    .bind(...(before ? [conversation.id, Number(before)] : [conversation.id]))
    .all<ChatThread['messages'][number]>();
  return {
    conversation,
    messages: result.results.slice(0, 100).reverse(),
    hasEarlier: result.results.length > 100,
  };
}

export async function rateLimit(key: string, limit: number, seconds: number) {
  const db = await database();
  const now = Date.now();
  const bucket = `${key}:${Math.floor(now / (seconds * 1000))}`;
  const result = await db
    .prepare(`INSERT INTO chat_rate_limits (key, hits, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET hits = hits + 1 RETURNING hits`)
    .bind(bucket, now + seconds * 2000)
    .first<{ hits: number }>();
  if (result && result.hits > limit)
    throw new ChatError(
      429,
      'Você enviou várias tentativas. Aguarde um pouco e tente novamente.',
    );
  // Expired counters do not retain visitor identifiers indefinitely.
  if (result?.hits === 1)
    await db.batch([
      db.prepare('DELETE FROM chat_rate_limits WHERE expires_at < ?').bind(now),
    ]);
}

export async function peerKey(request: Request) {
  return hash(request.headers.get('cf-connecting-ip') || 'local-preview');
}

export async function createConversation(
  request: Request,
  data: Record<string, unknown>,
) {
  const value = cookie(request, CUSTOMER_COOKIE);
  if (!value) throw new ChatError(401, 'Reabra o chat e tente novamente.');
  const existing = await customerConversation(request, false);
  if (existing) {
    await sendMessage(existing, 'customer', data);
    return conversationById(existing.id);
  }
  const name = field(data, 'name', 80);
  const contact = field(data, 'contact', 160, false);
  const reference = field(data, 'reference', 240, false);
  const body = field(data, 'message', 2000);
  const clientId = field(data, 'clientId', 80);
  await rateLimit(`start:${await peerKey(request)}`, 10, 3600);
  const db = await database();
  const id = crypto.randomUUID();
  const now = Date.now();
  const tokenHash = await hash(value);
  // One cookie owns one durable conversation; simultaneous submits reuse it.
  await db.batch([
    db
      .prepare(`INSERT INTO chat_conversations (id, token_hash, expires_at, customer_name, contact, reference, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?) ON CONFLICT(token_hash) DO NOTHING`)
      .bind(
        id,
        tokenHash,
        now + CUSTOMER_AGE * 1000,
        name,
        contact,
        reference,
        now,
        now,
      ),
    db
      .prepare(`INSERT INTO chat_messages (conversation_id, sender, body, client_id, created_at)
      SELECT id, 'customer', ?, ?, ? FROM chat_conversations WHERE token_hash = ? AND expires_at > ?
      ON CONFLICT(conversation_id, sender, client_id) DO NOTHING`)
      .bind(body, clientId, now, tokenHash, now),
    db
      .prepare(
        `UPDATE chat_conversations SET updated_at = ?, status = 'new' WHERE token_hash = ? AND changes() = 1`,
      )
      .bind(now, tokenHash),
  ]);
  return (await customerConversation(request))!;
}

export async function sendMessage(
  conversation: Conversation,
  sender: 'customer' | 'admin',
  data: Record<string, unknown>,
) {
  const body = field(data, 'message', 2000);
  const clientId = field(data, 'clientId', 80);
  const db = await database();
  const duplicate = await db
    .prepare(
      'SELECT id FROM chat_messages WHERE conversation_id = ? AND sender = ? AND client_id = ?',
    )
    .bind(conversation.id, sender, clientId)
    .first();
  if (duplicate) return;
  await rateLimit(`message:${sender}:${conversation.id}`, 30, 60);
  const now = Date.now();
  await db.batch([
    db
      .prepare(`INSERT INTO chat_messages (conversation_id, sender, body, client_id, created_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(conversation_id, sender, client_id) DO NOTHING`)
      .bind(conversation.id, sender, body, clientId, now),
    db
      .prepare(
        `UPDATE chat_conversations SET updated_at = ?, status = ?, expires_at = ? WHERE id = ? AND changes() = 1`,
      )
      .bind(
        now,
        sender === 'admin' ? 'active' : 'new',
        now + CUSTOMER_AGE * 1000,
        conversation.id,
      ),
  ]);
}

export async function markRead(
  conversation: Conversation,
  sender: 'customer' | 'admin',
  data: Record<string, unknown>,
) {
  const throughId = data.throughId;
  if (!Number.isSafeInteger(throughId) || Number(throughId) < 0)
    throw new ChatError(400, 'Leitura inválida.');
  const column = sender === 'admin' ? 'admin_read_id' : 'customer_read_id';
  const db = await database();
  await db
    .prepare(`UPDATE chat_conversations SET ${column} = MAX(${column}, MIN(?,
    COALESCE((SELECT MAX(id) FROM chat_messages WHERE conversation_id = ?), 0))) WHERE id = ?`)
    .bind(throughId, conversation.id, conversation.id)
    .run();
}

export async function changeStatus(
  conversation: Conversation,
  status: unknown,
) {
  if (!['new', 'active', 'closed'].includes(String(status)))
    throw new ChatError(400, 'Escolha um status válido.');
  const db = await database();
  await db
    .prepare(
      'UPDATE chat_conversations SET status = ?, updated_at = ? WHERE id = ?',
    )
    .bind(status as OrderStatus, Date.now(), conversation.id)
    .run();
}

export async function listConversations(before?: string | null) {
  const db = await database();
  let cursor: { updatedAt: number; id: string } | undefined;
  if (before) {
    const [date, id] = before.split(':');
    if (!/^\d{13}$/.test(date || '') || !/^[a-f0-9-]{36}$/.test(id || ''))
      throw new ChatError(400, 'Página inválida.');
    cursor = { updatedAt: Number(date), id };
  }
  const result = await db
    .prepare(`SELECT ${columns},
    COALESCE((SELECT body FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1), '') AS lastMessage,
    (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.sender = 'customer' AND m.id > c.admin_read_id) AS unread
    FROM chat_conversations c ${cursor ? 'WHERE updated_at < ? OR (updated_at = ? AND id < ?)' : ''}
    ORDER BY updated_at DESC, id DESC LIMIT 101`)
    .bind(...(cursor ? [cursor.updatedAt, cursor.updatedAt, cursor.id] : []))
    .all<ConversationPreview>();
  const conversations = result.results.slice(0, 100);
  const last = conversations.at(-1);
  return {
    conversations,
    nextCursor:
      result.results.length > 100 && last
        ? `${last.updatedAt}:${last.id}`
        : null,
  };
}

export async function adminOptions(request: Request) {
  const localPreview =
    process.env.NODE_ENV === 'development' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);
  const db = await database();
  const account = await db
    .prepare('SELECT id FROM chat_admin_accounts LIMIT 1')
    .first();
  return {
    setupAvailable: localPreview && !account,
    configured: !!account,
  };
}

export async function isAdmin(request: Request) {
  const value = cookie(request, ADMIN_COOKIE);
  if (!value) return false;
  const db = await database();
  return !!(await db
    .prepare(`SELECT s.admin_id FROM chat_admin_sessions s
    JOIN chat_admin_accounts a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?`)
    .bind(await hash(value), Date.now())
    .first());
}

export async function requireAdmin(request: Request) {
  if (!(await isAdmin(request)))
    throw new ChatError(401, 'Entre no painel para acessar as encomendas.');
}

async function passwordDigest(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 100000,
      salt: Uint8Array.from(salt.match(/../g)!, (part) => parseInt(part, 16)),
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

function credentialFields(data: Record<string, unknown>) {
  const email = field(data, 'email', 254).toLowerCase();
  const password = data.password;
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    typeof password !== 'string' ||
    !password ||
    password.length > 128
  )
    throw new ChatError(400, 'Informe um e-mail válido e sua senha.');
  return { email, password };
}

export async function setupAdmin(
  request: Request,
  data: Record<string, unknown>,
) {
  const options = await adminOptions(request);
  if (!options.setupAvailable)
    throw new ChatError(403, 'O cadastro administrativo não está disponível.');
  const { email, password } = credentialFields(data);
  if (password.length < 12)
    throw new ChatError(400, 'Crie uma senha com pelo menos 12 caracteres.');
  await rateLimit(`setup:${await peerKey(request)}`, 5, 600);
  const salt = token().slice(0, 32);
  const passwordHash = `pbkdf2_sha256$100000$${salt}$${await passwordDigest(password, salt)}`;
  const id = crypto.randomUUID();
  const db = await database();
  const inserted = await db
    .prepare(`INSERT INTO chat_admin_accounts (id, email, password_hash, created_at)
    SELECT ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM chat_admin_accounts)`)
    .bind(id, email, passwordHash, Date.now())
    .run();
  if (!inserted.meta.changes)
    throw new ChatError(
      409,
      'O acesso já foi cadastrado. Entre com seu e-mail e senha.',
    );
  return createAdminSession(request, id);
}

export async function loginAdmin(
  request: Request,
  data: Record<string, unknown>,
) {
  const { email, password } = credentialFields(data);
  await rateLimit(`login:${await peerKey(request)}`, 10, 600);
  await rateLimit(`login-account:${await hash(email)}`, 30, 600);
  const db = await database();
  const account = await db
    .prepare(
      'SELECT id, password_hash AS passwordHash FROM chat_admin_accounts WHERE email = ?',
    )
    .bind(email)
    .first<{ id: string; passwordHash: string }>();
  const fallback =
    'pbkdf2_sha256$100000$00000000000000000000000000000000$' + '0'.repeat(64);
  const encoded = account?.passwordHash || fallback;
  const [, , salt, expected] = encoded.split('$');
  const actual = await passwordDigest(password, salt);
  let difference = 0;
  for (let i = 0; i < expected.length; i++)
    difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  if (!account || difference !== 0)
    throw new ChatError(
      401,
      'E-mail ou senha incorretos. Confira e tente novamente.',
    );
  return createAdminSession(request, account.id);
}

async function createAdminSession(request: Request, adminId: string) {
  const db = await database();
  const value = token();
  const previous = cookie(request, ADMIN_COOKIE);
  const statements = [
    db
      .prepare('DELETE FROM chat_admin_sessions WHERE expires_at < ?')
      .bind(Date.now()),
  ];
  if (previous)
    statements.push(
      db
        .prepare('DELETE FROM chat_admin_sessions WHERE token_hash = ?')
        .bind(await hash(previous)),
    );
  statements.push(
    db
      .prepare(
        'INSERT INTO chat_admin_sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)',
      )
      .bind(await hash(value), adminId, Date.now() + ADMIN_AGE * 1000),
  );
  await db.batch(statements);
  return setCookie(request, ADMIN_COOKIE, value, ADMIN_AGE);
}

export async function logoutAdmin(request: Request) {
  sameOrigin(request);
  const value = cookie(request, ADMIN_COOKIE);
  if (value) {
    const db = await database();
    await db
      .prepare('DELETE FROM chat_admin_sessions WHERE token_hash = ?')
      .bind(await hash(value))
      .run();
  }
  return setCookie(request, ADMIN_COOKIE, '', 0);
}
