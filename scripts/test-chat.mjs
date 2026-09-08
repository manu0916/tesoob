import assert from 'node:assert/strict';
import { randomUUID, randomBytes, pbkdf2Sync } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const origin = process.env.CHAT_TEST_ORIGIN || 'http://localhost:3000';
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw new Error('Run these tests only against a local preview.');
const testIds = new Set();
const testAdminEmail = `chat-test-${randomUUID()}@example.invalid`;
const testAdminPassword = randomBytes(24).toString('base64url');
let checks = 0;
function check(condition, label) {
  assert.ok(condition, label);
  checks++;
  console.log(`PASS ${label}`);
}
function client() {
  const cookies = new Map();
  return async (path, data, options = {}) => {
    const response = await fetch(origin + path, {
      method: options.method || (data === undefined ? 'GET' : 'POST'),
      redirect: 'manual',
      headers: {
        Origin: origin,
        Cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join('; '),
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const index = pair.indexOf('=');
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    const result = await response.json().catch(() => null);
    if (result?.conversation?.id) testIds.add(result.conversation.id);
    return { response, result };
  };
}
async function sqliteFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    () => [],
  );
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sqliteFiles(path)));
    else if (entry.name.endsWith('.sqlite')) files.push(path);
  }
  return files;
}
async function withLocalDatabase(action) {
  for (const file of await sqliteFiles('.wrangler/state/v3/d1')) {
    const db = new DatabaseSync(file);
    try {
      if (
        db
          .prepare(
            "SELECT name FROM sqlite_master WHERE name = 'chat_conversations'",
          )
          .get()
      )
        return action(db);
    } finally {
      db.close();
    }
  }
  throw new Error('Local chat database not found.');
}

const a = client();
const b = client();
const admin = client();
try {
  const initial = await a('/api/chat');
  check(
    initial.response.status === 200 && initial.result.conversation === null,
    'customer session starts empty',
  );
  check(
    initial.response.headers.get('set-cookie').includes('HttpOnly') &&
      initial.response.headers.get('cache-control').includes('no-store'),
    'session cookie and private caching',
  );
  await b('/api/chat');
  const anonymous = await b('/api/admin/conversations');
  check(anonymous.response.status === 401, 'anonymous cannot read admin inbox');
  const forged = await b('/api/admin/conversations', undefined, {
    headers: { 'oai-authenticated-user-id': 'local_seedy' },
  });
  check(forged.response.status === 401, 'forged admin identity is rejected');
  const startId = randomUUID();
  const first = await a('/api/chat', {
    name: 'Teste de encomenda',
    contact: 'contato de teste',
    reference: 'REF. TESTE',
    message: 'Quero conversar sobre uma peça.',
    clientId: startId,
  });
  check(
    first.response.status === 201 && first.result.messages.length === 1,
    'customer creates a persisted order',
  );
  const id = first.result.conversation.id;
  check(
    !JSON.stringify(first.result).includes('tokenHash'),
    'session credential never appears in JSON',
  );
  const replay = await a('/api/chat', {
    name: 'Teste de encomenda',
    message: 'Quero conversar sobre uma peça.',
    clientId: startId,
  });
  check(
    replay.result.messages.length === 1,
    'retry does not duplicate initial message',
  );
  const second = await b('/api/chat');
  check(
    second.result.conversation === null,
    'second visitor cannot see first order',
  );
  const unauthorized = await b(`/api/admin/conversations/${id}`, {
    message: 'Tentativa',
    clientId: randomUUID(),
  });
  check(
    unauthorized.response.status === 401,
    'second visitor cannot reply as admin',
  );
  const csrf = await a(
    '/api/chat/messages',
    { message: 'Não deve entrar', clientId: randomUUID() },
    { headers: { Origin: 'https://external.invalid' } },
  );
  check(csrf.response.status === 403, 'cross-origin message rejected');
  const long = await a('/api/chat/messages', {
    message: 'x'.repeat(2001),
    clientId: randomUUID(),
  });
  check(long.response.status === 400, 'message length validated');
  const concurrent = await Promise.all([
    a('/api/chat', {
      name: 'Teste de encomenda',
      message: 'Ideia enviada em outra aba.',
      clientId: randomUUID(),
    }),
    a('/api/chat', {
      name: 'Teste de encomenda',
      message: 'Outra ideia simultânea.',
      clientId: randomUUID(),
    }),
  ]);
  check(
    concurrent.every((entry) => entry.response.ok) &&
      (await a('/api/chat')).result.messages.length === 3,
    'concurrent create requests keep both messages',
  );
  const adminState = await admin('/api/admin/session');
  if (adminState.result.setupAvailable) {
    const setup = await admin('/api/admin/session', {
      action: 'setup',
      email: testAdminEmail,
      password: testAdminPassword,
    });
    check(
      setup.response.ok && setup.result.authenticated,
      'first local admin can set email and password',
    );
    const repeatSetup = await b('/api/admin/session', {
      action: 'setup',
      email: 'outsider@example.invalid',
      password: testAdminPassword,
    });
    check(
      repeatSetup.response.status === 403,
      'initial registration closes after creating the admin',
    );
    await admin('/api/admin/session', undefined, { method: 'DELETE' });
  } else {
    await withLocalDatabase((db) => {
      const salt = randomBytes(16).toString('hex');
      const digest = pbkdf2Sync(
        testAdminPassword,
        Buffer.from(salt, 'hex'),
        100000,
        32,
        'sha256',
      ).toString('hex');
      db.prepare(
        'INSERT INTO chat_admin_accounts (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
      ).run(
        randomUUID(),
        testAdminEmail,
        `pbkdf2_sha256$100000$${salt}$${digest}`,
        Date.now(),
      );
    });
  }
  const storedHash = await withLocalDatabase(
    (db) =>
      db
        .prepare(
          'SELECT password_hash FROM chat_admin_accounts WHERE email = ?',
        )
        .get(testAdminEmail).password_hash,
  );
  check(
    storedHash.startsWith('pbkdf2_sha256$') &&
      !storedHash.includes(testAdminPassword),
    'password stored as salted hash',
  );
  const wrongPassword = await admin('/api/admin/session', {
    email: testAdminEmail,
    password: 'senha-incorreta',
  });
  check(wrongPassword.response.status === 401, 'incorrect password rejected');
  const signIn = await admin('/api/admin/session', {
    email: testAdminEmail.toUpperCase(),
    password: testAdminPassword,
  });
  check(
    signIn.response.status === 200 &&
      signIn.response.headers.get('set-cookie').includes('HttpOnly'),
    'email and password login creates protected session',
  );
  check(
    (await admin('/api/admin/session')).result.authenticated === true,
    'authenticated admin authorized',
  );
  const inbox = await admin('/api/admin/conversations');
  check(
    inbox.result.conversations.some(
      (entry) => entry.id === id && entry.unread === 3,
    ),
    'admin inbox receives order and unread messages',
  );
  const replyId = randomUUID();
  const reply = await admin(`/api/admin/conversations/${id}`, {
    message: 'Oi! Vamos criar sua peça.',
    clientId: replyId,
  });
  check(
    reply.response.ok &&
      reply.result.messages.at(-1).sender === 'admin' &&
      reply.result.conversation.status === 'active',
    'admin reply persisted with correct sender',
  );
  check(
    (await a('/api/chat')).result.messages.at(-1).body ===
      'Oi! Vamos criar sua peça.',
    'customer receives admin response',
  );
  await admin(`/api/admin/conversations/${id}`, {
    action: 'read',
    throughId: reply.result.messages.at(-1).id,
  });
  check(
    (await admin('/api/admin/conversations')).result.conversations.find(
      (entry) => entry.id === id,
    ).unread === 0,
    'read receipt clears unread count',
  );
  await admin(`/api/admin/conversations/${id}`, {
    action: 'status',
    status: 'closed',
  });
  await admin(`/api/admin/conversations/${id}`, {
    message: 'Oi! Vamos criar sua peça.',
    clientId: replyId,
  });
  check(
    (await a('/api/chat')).result.conversation.status === 'closed',
    'replaying a message does not reopen order',
  );
  const reopen = await a('/api/chat/messages', {
    message: 'Tenho mais uma pergunta.',
    clientId: randomUUID(),
  });
  check(
    reopen.result.conversation.status === 'new',
    'new customer message reopens order',
  );
  const expires = await withLocalDatabase(
    (db) =>
      db
        .prepare('SELECT expires_at FROM chat_conversations WHERE id = ?')
        .get(id).expires_at,
  );
  check(
    expires > Date.now() + 29 * 86400000,
    'active customer session is renewed',
  );
  await withLocalDatabase((db) => {
    const statement = db.prepare(
      `INSERT INTO chat_messages (conversation_id, sender, body, client_id, created_at) VALUES (?, 'customer', ?, ?, ?)`,
    );
    for (let i = 0; i < 105; i++)
      statement.run(
        id,
        `Mensagem de histórico ${i}`,
        randomUUID(),
        Date.now() + i,
      );
    const order = db.prepare(
      `INSERT INTO chat_conversations (id, token_hash, expires_at, customer_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    for (let i = 0; i < 105; i++) {
      const seededId = randomUUID();
      testIds.add(seededId);
      order.run(
        seededId,
        randomBytes(32).toString('hex'),
        Date.now() + 86400000,
        'Teste paginação',
        Date.now() + i,
        Date.now() + i,
      );
    }
  });
  const latest = await a('/api/chat');
  check(
    latest.result.messages.length === 100 && latest.result.hasEarlier,
    'long history returned in bounded pages',
  );
  const earlier = await a(`/api/chat?before=${latest.result.messages[0].id}`);
  check(
    earlier.result.messages.length > 0 &&
      earlier.result.messages.at(-1).id < latest.result.messages[0].id,
    'older messages remain accessible',
  );
  const firstPage = await admin('/api/admin/conversations');
  const nextPage = await admin(
    `/api/admin/conversations?before=${encodeURIComponent(firstPage.result.nextCursor)}`,
  );
  check(
    firstPage.result.conversations.length === 100 &&
      nextPage.result.conversations.length > 0,
    'older orders remain accessible through pagination',
  );
  await withLocalDatabase((db) =>
    db
      .prepare('UPDATE chat_conversations SET expires_at = 1 WHERE id = ?')
      .run(id),
  );
  const expired = await a('/api/chat');
  check(
    expired.result.conversation === null &&
      expired.response.headers.has('set-cookie'),
    'expired session receives fresh cookie',
  );
  const fresh = await a('/api/chat', {
    name: 'Teste nova sessão',
    message: 'Uma nova conversa.',
    clientId: randomUUID(),
  });
  check(
    fresh.response.status === 201 && fresh.result.conversation.id !== id,
    'expired visitor can start again',
  );
  await admin('/api/admin/session', undefined, { method: 'DELETE' });
  check(
    (await admin('/api/admin/conversations')).response.status === 401,
    'logout revokes access to inbox',
  );
  console.log(`${checks} chat integration checks passed.`);
} finally {
  if (testIds.size)
    await withLocalDatabase((db) => {
      for (const id of testIds) {
        db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(
          id,
        );
        db.prepare('DELETE FROM chat_conversations WHERE id = ?').run(id);
      }
      db.prepare(
        'DELETE FROM chat_admin_sessions WHERE admin_id IN (SELECT id FROM chat_admin_accounts WHERE email = ?)',
      ).run(testAdminEmail);
      db.prepare('DELETE FROM chat_admin_accounts WHERE email = ?').run(
        testAdminEmail,
      );
    });
}
