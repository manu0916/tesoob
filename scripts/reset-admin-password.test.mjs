import assert from 'node:assert/strict';
import { randomBytes, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PassThrough } from 'node:stream';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { encodePassword, prompt, resetSql, verifyReset, normalizeEmail,
  parseQueryResponse, wranglerEnvironment } from './reset-admin-password.mjs';

test('copied email is normalized, including a Markdown escape before @', () => {
  assert.equal(normalizeEmail(' Admin\\@example.invalid '), 'admin@example.invalid');
  assert.equal(normalizeEmail('admin@example.invalid'), 'admin@example.invalid');
  assert.throws(() => normalizeEmail('admin\\other@example.invalid'));
  assert.throws(() => normalizeEmail('not-an-email'));
});

test('Wrangler JSON output is enabled without enabling disk logs or telemetry', () => {
  const env = wranglerEnvironment({ WRANGLER_LOG: 'error', WRANGLER_WRITE_LOGS: 'true' });
  assert.equal(env.WRANGLER_LOG, 'log');
  assert.equal(env.WRANGLER_WRITE_LOGS, 'false');
  assert.equal(env.WRANGLER_SEND_METRICS, 'false');
  assert.equal(env.WRANGLER_LOG_SANITIZE, 'true');
  assert.deepEqual(parseQueryResponse('  [{"success":true,"results":[]}]\r\n'), [{ success: true, results: [] }]);
  for (const value of ['', 'not-json', '{}', '[]', '[{"success":false,"results":[]}]', '[null]'])
    assert.throws(() => parseQueryResponse(value), /JSON válido/);
});

test('hash matches the existing Web Crypto admin login and uses a fresh salt', async () => {
  const password = randomBytes(24).toString('base64url') + 'ç🔐';
  const encoded = encodePassword(password);
  const [, iterations, salt, expected] = encoded.split('$');
  const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const digest = await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256',
    iterations: Number(iterations), salt: Buffer.from(salt, 'hex') }, key, 256);
  assert.equal(Buffer.from(digest).toString('hex'), expected);
  assert.notEqual(encodePassword(password), encoded);
  assert.throws(() => encodePassword('short'));
  assert.throws(() => encodePassword('a'.repeat(129)));
});

test('reset targets only the selected admin, revokes sessions, and preserves other data', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(await readFile(new URL('../drizzle/0001_admin_login.sql', import.meta.url), 'utf8'));
    const email = "owner'o@example.invalid";
    const insert = db.prepare('INSERT INTO chat_admin_accounts VALUES (?,?,?,?)');
    insert.run('target', email, 'old-fixture', 1);
    insert.run('other', 'other@example.invalid', 'other-fixture', 2);
    db.exec(`INSERT INTO chat_admin_sessions VALUES ('one','target',123),('two','target',456),('three','other',789);
      CREATE TABLE preserved_content (body TEXT);
      INSERT INTO preserved_content VALUES ('keep');`);
    const encoded = encodePassword(randomBytes(24).toString('base64url'));
    db.exec(resetSql('missing', email, encoded));
    assert.equal(db.prepare('SELECT count(*) AS n FROM chat_admin_sessions').get().n, 3);
    db.exec(resetSql('target', 'wrong@example.invalid', encoded));
    assert.equal(db.prepare('SELECT count(*) AS n FROM chat_admin_sessions').get().n, 3);
    db.exec(resetSql('target', email, encoded));
    assert.equal(db.prepare('SELECT password_hash FROM chat_admin_accounts WHERE id=?').get('target').password_hash, encoded);
    assert.equal(db.prepare('SELECT password_hash FROM chat_admin_accounts WHERE id=?').get('other').password_hash, 'other-fixture');
    assert.equal(db.prepare('SELECT count(*) AS n FROM chat_admin_sessions WHERE admin_id=?').get('target').n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM chat_admin_sessions WHERE admin_id=?').get('other').n, 1);
    assert.equal(db.prepare('SELECT body FROM preserved_content').get().body, 'keep');
    db.exec(resetSql("target'; DELETE FROM chat_admin_accounts; --", email, encoded));
    assert.equal(db.prepare('SELECT count(*) AS n FROM chat_admin_accounts').get().n, 2);
    assert.throws(() => resetSql('target', email, 'invalid'));
  } finally { db.close(); }
});

test('success requires confirmed password update and zero remaining sessions', () => {
  const good = [{ success: true, results: [{ id: 'target' }] },
    { success: true, results: [] },
    { success: true, results: [{ id: 'target', remaining_sessions: 0 }] }];
  assert.equal(verifyReset(good, 'target'), true);
  assert.equal(verifyReset(good, 'other'), false);
  assert.equal(verifyReset([], 'target'), false);
  good[2].results[0].remaining_sessions = 1;
  assert.equal(verifyReset(good, 'target'), false);
  good[2].success = false;
  assert.equal(verifyReset(good, 'target'), false);
});

function terminal() {
  const input = new PassThrough();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = (raw) => { input.isRaw = raw; };
  let written = '';
  return { input, output: { isTTY: true, write: (text) => { written += text; } },
    text: () => written };
}

test('hidden input never echoes the password and restores terminal mode', async () => {
  const t = terminal();
  const result = prompt('Senha: ', true, t.input, t.output);
  t.input.emit('keypress', 'abc', {});
  t.input.emit('keypress', undefined, { name: 'backspace' });
  t.input.emit('keypress', 'd', {});
  t.input.emit('keypress', '\r', { name: 'return' });
  assert.equal(await result, 'abd');
  assert.equal(t.text(), 'Senha: \n');
  assert.equal(t.input.isRaw, false);
  assert.equal(t.input.listenerCount('keypress'), 0);
});

test('cancellation restores terminal mode; noninteractive input is rejected', async () => {
  const t = terminal();
  const result = prompt('Senha: ', true, t.input, t.output);
  t.input.emit('keypress', '\x03', { name: 'c', ctrl: true });
  await assert.rejects(result, /Cancelado/);
  assert.equal(t.input.isRaw, false);
  t.input.isTTY = false;
  await assert.rejects(prompt('Senha: ', true, t.input, t.output), /terminal interativo/);
});
