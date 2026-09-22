import assert from 'node:assert/strict';
import { randomUUID, randomBytes, pbkdf2Sync, createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const origin = process.env.STORE_TEST_ORIGIN || 'http://127.0.0.1:4177';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
  throw new Error('Local isolated QA only.');
const state = '.wrangler/store-tests/v3/d1';
let checks = 0;
const check = (value, label) => {
  assert.ok(value, label);
  checks++;
  console.log(`PASS ${label}`);
};
async function files(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true }).catch(
    () => [],
  )) {
    const item = join(path, entry.name);
    if (entry.isDirectory()) result.push(...(await files(item)));
    else if (entry.name.endsWith('.sqlite') && entry.name !== 'metadata.sqlite')
      result.push(item);
  }
  return result;
}
function client() {
  const cookies = new Map();
  const call = async (path, data, options = {}) => {
    const method = options.method || (data === undefined ? 'GET' : 'POST');
    let csrf = {};
    if (method !== 'GET' && options.csrf !== false) {
      const t = await call('/store-api/auth/csrf');
      csrf = { 'X-CSRF-TOKEN': t.body.token };
    }
    const response = await fetch(origin + path, {
      method,
      redirect: 'manual',
      headers: {
        Origin: origin,
        Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
        ...csrf,
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    for (const item of response.headers.getSetCookie()) {
      const pair = item.split(';')[0],
        i = pair.indexOf('=');
      cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    return {
      status: response.status,
      body: await response.json().catch(() => null),
      headers: response.headers,
    };
  };
  return call;
}
const publicClient = client();
// Initialize the existing chat first, then put a legacy fixture in the isolated DB before the new migration.
await publicClient('/api/admin/session');
const paths = await files(state);
const path = paths.find((p) => {
  const db = new DatabaseSync(p, { readOnly: true });
  try {
    return !!db
      .prepare("SELECT name FROM sqlite_master WHERE name='chat_conversations'")
      .get();
  } finally {
    db.close();
  }
});
if (!path)
  throw new Error(
    'Start Vite with STORE_LOCAL_TEST=1. Never run tests on the normal D1 state.',
  );
const db = new DatabaseSync(path);
db.exec('PRAGMA busy_timeout=10000');
try {
  const adminPassword =
    process.env.STORE_PREVIEW_PASSWORD || randomBytes(20).toString('hex');
  const salt = randomBytes(16).toString('hex'),
    encoded = `pbkdf2_sha256$100000$${salt}$${pbkdf2Sync(adminPassword, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex')}`;
  const legacyId = 'legacy-store-preservation-fixture';
  db.prepare(
    'INSERT OR IGNORE INTO chat_admin_accounts(id,email,password_hash,created_at) VALUES (?,?,?,?)',
  ).run('store-d1-test-admin', 'admin@preview.test', encoded, Date.now());
  // Only this synthetic account in isolated state may be refreshed between QA runs.
  db.prepare('UPDATE chat_admin_accounts SET password_hash=? WHERE id=?').run(
    encoded,
    'store-d1-test-admin',
  );
  db.prepare(
    'INSERT OR IGNORE INTO chat_conversations(id,token_hash,expires_at,customer_name,created_at,updated_at) VALUES (?,?,?,?,?,?)',
  ).run(
    legacyId,
    createHash('sha256').update(legacyId).digest('hex'),
    Date.now() + 86400000,
    'Registro antigo de teste',
    Date.now(),
    Date.now(),
  );
  db.prepare(
    'INSERT OR IGNORE INTO chat_messages(conversation_id,sender,body,client_id,created_at) VALUES (?,?,?,?,?)',
  ).run(
    legacyId,
    'customer',
    'Mensagem anterior à migração.',
    'legacy-store-message',
    Date.now(),
  );
  const snapshot = () =>
    JSON.stringify(
      ['chat_conversations', 'chat_messages', 'chat_admin_accounts'].map(
        (table) => db.prepare(`SELECT * FROM ${table} ORDER BY id`).all(),
      ),
    );
  const before = snapshot();
  check(
    (await publicClient('/store-api/products')).status === 200,
    'D1 storefront initializes',
  );
  check(
    snapshot() === before,
    'migration preserves every legacy row and password hash',
  );
  db.exec(await readFile('drizzle/0002_storefront.sql', 'utf8'));
  check(
    snapshot() === before,
    'additive SQL is repeatable and preserves legacy data',
  );
  const admin = client();
  const login = await admin('/store-api/auth/login', {
    email: 'admin@preview.test',
    password: adminPassword,
  });
  check(
    login.status === 200 && login.body.role === 'ADMIN',
    'legacy admin password authenticates storefront',
  );
  check(
    (await admin('/api/admin/session')).body.authenticated === true,
    'same admin session works in old panel',
  );
  const sample = {
    name: `QA-${randomUUID()}`,
    price: 129.9,
    imageUrl: '/media/editorial-06.webp',
    description: 'Descrição de QA.',
    observation: '   ',
    active: true,
    version: 0,
  };
  check(
    (await publicClient('/store-api/admin/products', sample)).status === 403,
    'anonymous admin write denied',
  );
  check(
    (await admin('/store-api/admin/products', sample, { csrf: false }))
      .status === 403,
    'missing CSRF rejected',
  );
  check(
    (
      await admin('/store-api/admin/products', sample, {
        headers: { Origin: 'https://evil.invalid' },
      })
    ).status === 403,
    'foreign origin rejected',
  );
  const created = await admin('/store-api/admin/products', sample);
  check(
    created.status === 201 && created.body.observation === null,
    'admin CRUD and blank observation normalization',
  );
  const product = created.body;
  const buyer = client(),
    other = client(),
    email = `qa-${randomUUID()}@example.test`,
      name = 'Cliente de Teste',
    password = randomBytes(18).toString('hex');
  check(
    (
      await buyer('/store-api/auth/register', {
        email,
        password,
        role: 'ADMIN',
      })
    ).status === 400,
    'public role injection rejected',
  );
  check(
    (await buyer('/store-api/auth/register', { name, email, password })).status ===
      400,
    'customer registration requires legal consent',
  );
  check(
    (
      await buyer('/store-api/auth/register', {
        name,
        email,
        password,
        legalAccepted: true,
      })
    ).status === 201,
    'customer registration records legal consent',
  );
  check(
    db
      .prepare('SELECT password_hash,display_name FROM store_users WHERE email=?')
      .get(email)
      .password_hash.startsWith('$2b$12$') &&
      db
        .prepare('SELECT display_name FROM store_users WHERE email=?')
        .get(email).display_name === name,
    'customer name and BCrypt password stored',
  );
  const signedIn = await buyer('/store-api/auth/login', { email, password });
  check(
    signedIn.status === 200 &&
      signedIn.headers.getSetCookie().some((c) => c.includes('HttpOnly')),
    'persistent HttpOnly customer session',
  );
  check(
    (await buyer('/store-api/admin/products', sample)).status === 403,
    'customer cannot manage products',
  );
  const input = {
    productId: product.id,
    productVersion: product.version,
    quantity: 2,
    billing: {
      recipient: 'Pessoa de Teste',
      document: '52998224725',
      postalCode: '01310100',
      street: 'Rua de Teste',
      number: '42',
      complement: null,
      district: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    },
  };
  check(
    (
      await buyer(
        '/store-api/checkout',
        { ...input, price: 0 },
        { headers: { 'Idempotency-Key': randomUUID() } },
      )
    ).status === 400,
    'client price injection rejected',
  );
  check(
    (
      await buyer(
        '/store-api/checkout',
        { ...input, billing: { ...input.billing, document: '11111111111' } },
        { headers: { 'Idempotency-Key': randomUUID() } },
      )
    ).status === 400,
    'invalid CPF rejected',
  );
  const key = randomUUID();
  const results = await Promise.all([
    buyer('/store-api/checkout', input, {
      headers: { 'Idempotency-Key': key },
    }),
    buyer('/store-api/checkout', input, {
      headers: { 'Idempotency-Key': key },
    }),
  ]);
  check(
    results.every((r) => r.status === 200) &&
      results[0].body.order.id === results[1].body.order.id,
    'concurrent retries create exactly one order',
  );
  const order = results[0].body.order;
  check(
    order.total === 259.8 && order.status === 'AWAITING_INTEGRATION',
    'server cents arithmetic and no fake payment',
  );
  const stored = db
    .prepare('SELECT * FROM store_orders WHERE id=?')
    .get(order.id);
  check(
    stored.checkout_ciphertext.startsWith('v1.') &&
      !JSON.stringify(stored).includes('52998224725') &&
      !JSON.stringify(stored).includes('Rua de Teste'),
    'D1 contains AES envelope, no plaintext CPF/address',
  );
  check(
    (
      await buyer(
        '/store-api/checkout',
        { ...input, quantity: 3 },
        { headers: { 'Idempotency-Key': key } },
      )
    ).status === 409,
    'idempotency body conflict rejected',
  );
  check(
    (await other('/store-api/orders/' + order.id)).status === 401,
    'anonymous order access denied',
  );
  const otherEmail = `qa-${randomUUID()}@example.test`;
  await other('/store-api/auth/register', { email: otherEmail, password });
  await other('/store-api/auth/login', { email: otherEmail, password });
  check(
    (await other('/store-api/orders/' + order.id)).status === 404,
    'other customer cannot read order',
  );
  const cipher = stored.checkout_ciphertext.split('.');
  const payload = Buffer.from(cipher[2], 'base64');
  payload[0] ^= 1;
  cipher[2] = payload.toString('base64');
  db.prepare('UPDATE store_orders SET checkout_ciphertext=? WHERE id=?').run(
    cipher.join('.'),
    order.id,
  );
  check(
    (
      await buyer('/store-api/checkout', input, {
        headers: { 'Idempotency-Key': key },
      })
    ).status === 503,
    'tampered ciphertext fails closed',
  );
  db.prepare('UPDATE store_orders SET checkout_ciphertext=? WHERE id=?').run(
    stored.checkout_ciphertext,
    order.id,
  );
  const changed = await admin(
    '/store-api/admin/products/' + product.id,
    { ...sample, observation: 'Presente', price: 150 },
    { method: 'PUT' },
  );
  check(
    changed.status === 200 && changed.body.version === 1,
    'optimistic product update',
  );
  check(
    (
      await admin('/store-api/admin/products/' + product.id, sample, {
        method: 'PUT',
      })
    ).status === 409,
    'stale admin edit rejected',
  );
  check(
    (
      await buyer('/store-api/checkout', input, {
        headers: { 'Idempotency-Key': randomUUID() },
      })
    ).status === 409,
    'stale checkout price version rejected',
  );
  check(
    (
      await admin(
        `/store-api/admin/products/${product.id}?version=1`,
        undefined,
        { method: 'DELETE' },
      )
    ).status === 204,
    'archive preserves order',
  );
  check(
    (await publicClient('/store-api/products/' + product.id)).status === 404,
    'archived product hidden',
  );
  check(
    (await buyer('/store-api/orders/' + order.id)).body.total === 259.8,
    'order snapshot survives product changes',
  );
  check(
    (await publicClient('/store-api/auth/options')).body.google === false,
    'Google disabled without credentials',
  );
  check(
    (
      await publicClient(
        '/store-api/login/oauth2/code/google?state=bad&code=bad',
      )
    ).headers.get('location') === '/loja/conta?error=google',
    'invalid OAuth callback fails safely',
  );
  check(
    snapshot() === before,
    'old conversations, messages and admin hashes unchanged after full workflow',
  );
  for (const [name, price, image, observation] of [
    ['[DEMO] Vermelho. Sem rodeios.', 320, 'editorial-06.webp', null],
    [
      '[DEMO] Verde. Fora do padrão.',
      380,
      'editorial-05.webp',
      'Referência demonstrativa.',
    ],
    ['[DEMO] Camadas de expressão.', 450, 'processo-04.webp', null],
  ]) {
    if (
      !db
        .prepare('SELECT id FROM store_products WHERE name=? AND active=1')
        .get(name)
    )
      await admin('/store-api/admin/products', {
        ...sample,
        name,
        price,
        imageUrl: '/media/' + image,
        observation,
      });
  }
  console.log(
    `${checks} D1 integration checks passed. Fixtures stay ONLY in .wrangler/store-tests for browser QA.`,
  );
} finally {
  db.close();
}
