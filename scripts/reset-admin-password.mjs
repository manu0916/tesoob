import { spawn } from 'node:child_process';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { emitKeypressEvents } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const database = 'tesoob';
const databaseId = '424b78fc-08bc-4380-b4fa-e8155b31a3cc';
const quote = (value) => `'${value.replaceAll("'", "''")}'`;

export function normalizeEmail(value) {
  // Accept the Markdown escape sometimes included when copying from chat.
  const email = typeof value === 'string' ? value.trim().replaceAll('\\@', '@').toLowerCase() : '';
  if (!/^[^\s@\\]+@[^\s@\\]+\.[^\s@\\]+$/.test(email))
    throw new Error('Informe um e-mail válido, sem barras.');
  return email;
}

export function wranglerEnvironment(environment = process.env) {
  return { ...environment, CI: 'true', WRANGLER_WRITE_LOGS: 'false',
    WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG: 'log', WRANGLER_LOG_SANITIZE: 'true' };
}

export function parseQueryResponse(output) {
  try {
    const result = JSON.parse(output.trim());
    if (Array.isArray(result) && result.length > 0 && result.every((item) =>
      item?.success === true && Array.isArray(item.results))) return result;
  } catch { /* Never include SQL or subprocess output in the error. */ }
  throw new Error('O Cloudflare não retornou um resultado JSON válido. Nada foi confirmado.');
}

export function encodePassword(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128)
    throw new Error('Use uma senha de 12 a 128 caracteres.');
  // Exact format consumed by loginAdmin in lib/chat-server.ts.
  const salt = randomBytes(16).toString('hex');
  const digest = pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');
  return `pbkdf2_sha256$100000$${salt}$${digest.toString('hex')}`;
}

export function resetSql(id, email, encoded) {
  if (!/^pbkdf2_sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(encoded))
    throw new Error('Formato de hash inválido.');
  const account = `id=${quote(id)} AND email=${quote(email)}`;
  const changedAccount = `${account} AND password_hash=${quote(encoded)}`;
  return `UPDATE chat_admin_accounts SET password_hash=${quote(encoded)}
    WHERE ${account} RETURNING id;
    DELETE FROM chat_admin_sessions WHERE admin_id IN
      (SELECT id FROM chat_admin_accounts WHERE ${changedAccount});
    SELECT id, (SELECT count(*) FROM chat_admin_sessions WHERE admin_id=${quote(id)})
      AS remaining_sessions FROM chat_admin_accounts WHERE ${changedAccount};`;
}

export function verifyReset(results, id) {
  return Array.isArray(results) && results.length === 3 &&
    results.every((item) => item.success === true) &&
    results[0].results?.length === 1 && results[0].results[0].id === id &&
    results[2].results?.length === 1 && results[2].results[0].id === id &&
    results[2].results[0].remaining_sessions === 0;
}

export function prompt(label, hidden = false, input = process.stdin, output = process.stdout) {
  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== 'function')
    return Promise.reject(new Error('Execute em um terminal interativo (PowerShell/terminal do VS Code), sem redirecionar a entrada.'));
  return new Promise((done, fail) => {
    let value = '';
    const wasRaw = input.isRaw;
    const finish = (error) => {
      input.off('keypress', onKey);
      input.setRawMode(Boolean(wasRaw));
      input.pause();
      output.write('\n');
      if (error) fail(error);
      else done(value);
      value = '';
    };
    const onKey = (text, key = {}) => {
      if (key.ctrl && ['c', 'd'].includes(key.name))
        return finish(new Error('Cancelado. Nenhuma alteração foi enviada.'));
      if (key.name === 'return' || key.name === 'enter') return finish();
      if (key.name === 'backspace') {
        if (value && !hidden) output.write('\b \b');
        value = Array.from(value).slice(0, -1).join('');
        return;
      }
      if (key.ctrl || key.meta || !text || Array.from(text).some((char) =>
        char.codePointAt(0) < 32 || char.codePointAt(0) === 127)) return;
      value += text;
      if (value.length > 4096) return finish(new Error('Entrada muito longa.'));
      if (!hidden) output.write(text);
    };
    emitKeypressEvents(input);
    input.setRawMode(true);
    input.on('keypress', onKey);
    output.write(label);
    input.resume();
  });
}

async function query(sql) {
  const require = createRequire(import.meta.url);
  const cli = resolve(dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
  return new Promise((done, fail) => {
    // No shell expansion. Only the derived hash, never the password, enters SQL.
    // Disable Wrangler disk logs and telemetry; never echo subprocess errors/SQL.
    const child = spawn(process.execPath, [cli, 'd1', 'execute', database,
      '--config', resolve(root, 'wrangler.jsonc'), '--remote', '--json', '--command', sql], {
      cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      // Wrangler emits even --json results through logger.log. Using "error"
      // here suppresses the result entirely. stdout remains private to us.
      env: wranglerEnvironment(),
    });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.resume();
    child.on('error', () => fail(new Error('Não foi possível iniciar o Wrangler local.')));
    child.on('close', (code) => {
      if (code !== 0) return fail(new Error('A consulta ao Cloudflare falhou. Confira conexão e acesso com npx wrangler whoami; se necessário, npx wrangler login.'));
      try { done(parseQueryResponse(output)); }
      catch (error) { fail(error); }
    });
  });
}

export async function main(args = process.argv.slice(2)) {
  if (args[0] !== '--email' || ![2, 3].includes(args.length) || (args.length === 3 && args[2] !== '--check'))
    throw new Error('Uso: npm run admin:reset -- --email EMAIL_DO_ADMIN [--check]');
  const checkOnly = args[2] === '--check';
  const email = normalizeEmail(args[1]);
  if (!checkOnly && (!process.stdin.isTTY || !process.stdout.isTTY))
    throw new Error('Abra um terminal interativo para digitar a senha de forma oculta.');
  const config = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
  const binding = config.d1_databases?.find((item) => item.binding === 'DB');
  if (binding?.database_name !== database || binding?.database_id !== databaseId)
    throw new Error('O banco configurado mudou. Revise o destino antes de redefinir a senha.');
  console.log(`Banco de PRODUÇÃO: ${database} (${databaseId})\nAdministrador: ${email}`);
  const found = await query(`SELECT id,email FROM chat_admin_accounts WHERE email=${quote(email)};`);
  if (found.length !== 1 || found[0].success !== true || found[0].results?.length !== 1)
    throw new Error('Não foi encontrado exatamente um administrador com esse e-mail. Nada foi alterado.');
  const id = found[0].results[0].id;
  if (checkOnly) {
    console.log('Administrador encontrado. Consulta de leitura concluída; nada foi alterado.');
    return;
  }
  console.log('Isso altera somente a senha dessa conta e encerra suas sessões administrativas.');
  if (await prompt('Digite REDEFINIR para continuar: ') !== 'REDEFINIR') {
    console.log('Cancelado. Nada foi alterado.');
    return;
  }
  let password = await prompt('Nova senha (12 a 128 caracteres; nada aparecerá): ', true);
  let confirmation = await prompt('Repita a nova senha: ', true);
  if (password !== confirmation) throw new Error('As senhas são diferentes. Nada foi alterado; execute novamente.');
  const encoded = encodePassword(password);
  password = '';
  confirmation = '';
  console.log('Redefinindo e encerrando sessões. Aguarde a confirmação...');
  try {
    const result = await query(resetSql(id, email, encoded));
    if (!verifyReset(result, id)) throw new Error('Verificação incompleta.');
  } catch {
    // A network failure can occur after commit: do not falsely promise rollback.
    throw new Error('Não foi possível confirmar a conclusão. A senha pode ter sido alterada. Execute novamente para concluir a troca e o encerramento das sessões.');
  }
  console.log(`Senha redefinida e sessões anteriores encerradas para ${email}.\nEntre em https://tesoob.pages.dev/admin com a nova senha.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
