import { createRemoteJWKSet, jwtVerify } from 'jose';
import { adminIdentity, loginAdmin, logoutAdmin } from './chat-server';
import { throttle } from './store-database';
import {
  cookie,
  credentials,
  digest,
  equal,
  fail,
  fields,
  hashPassword,
  randomToken,
  setCookie,
  textField,
  verifyPassword,
  type StoreEnvironment,
} from './store-security';

const SESSION = 'TESOOB_STORE_SESSION';
const GOOGLE_STATE = 'TESOOB_STORE_GOOGLE';
const AGE = 60 * 30;
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);
type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  legal_accepted_at: number | null;
  password_hash: string | null;
  google_id: string | null;
  enabled: number;
};
export type Identity = {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  displayName: string | null;
  onboardingRequired: boolean;
};
type SessionCustomer = Identity & { googleId: string | null };

const customerView = (user: {
  id: string;
  email: string;
  display_name: string | null;
  legal_accepted_at: number | null;
  google_id: string | null;
}): SessionCustomer => ({
  id: user.id,
  email: user.email,
  role: 'CUSTOMER',
  displayName: user.display_name,
  onboardingRequired:
    !!user.google_id &&
    (!user.legal_accepted_at || !user.display_name?.trim()),
  googleId: user.google_id,
});

async function sessionCustomer(
  db: D1Database,
  request: Request,
): Promise<SessionCustomer | null> {
  const value = cookie(request, SESSION);
  if (!/^[a-f0-9]{64}$/.test(value)) return null;
  const user = await db
    .prepare(`SELECT u.id,u.email,u.display_name,u.legal_accepted_at,u.google_id
    FROM store_sessions s JOIN store_users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.enabled=1`)
    .bind(await digest(value), Date.now())
    .first<{
      id: string;
      email: string;
      display_name: string | null;
      legal_accepted_at: number | null;
      google_id: string | null;
    }>();
  return user ? customerView(user) : null;
}
export async function customer(
  db: D1Database,
  request: Request,
): Promise<Identity | null> {
  const user = await sessionCustomer(db, request);
  if (!user || user.onboardingRequired) return null;
  const { googleId: _, ...identity } = user;
  return identity;
}
export async function identity(
  db: D1Database,
  request: Request,
): Promise<Identity> {
  const admin = await adminIdentity(request);
  if (admin)
    return {
      ...admin,
      role: 'ADMIN',
      displayName: null,
      onboardingRequired: false,
    };
  const user = await sessionCustomer(db, request);
  if (!user) return fail(401, 'Entre na sua conta.');
  const { googleId: _, ...publicUser } = user;
  return publicUser;
}
export async function requireStoreAdmin(request: Request) {
  if (!(await adminIdentity(request)))
    fail(403, 'Esta área é exclusiva para administradores da vitrine.');
}
async function session(db: D1Database, request: Request, userId: string) {
  const value = randomToken();
  const old = cookie(request, SESSION);
  await db.batch([
    db
      .prepare('DELETE FROM store_sessions WHERE token_hash=? OR expires_at<?')
      .bind(await digest(old), Date.now()),
    db
      .prepare(
        'INSERT INTO store_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)',
      )
      .bind(await digest(value), userId, Date.now() + AGE * 1000),
  ]);
  return setCookie(request, SESSION, value, AGE);
}
export async function localAuth(
  db: D1Database,
  request: Request,
  data: Record<string, unknown>,
  registering: boolean,
) {
  const { email, name, password } = credentials(data, registering);
  await throttle(db, request, 'auth-ip', 15);
  await throttle(db, request, 'auth-email', 15, email);
  const admin = await db
    .prepare('SELECT id,email FROM chat_admin_accounts WHERE email=?')
    .bind(email)
    .first<{ id: string; email: string }>();
  const user = await db
    .prepare('SELECT * FROM store_users WHERE email=?')
    .bind(email)
    .first<UserRow>();
  if (registering) {
    if (user || admin)
      return fail(
        409,
        'Não foi possível cadastrar este e-mail. Se já possui conta, entre.',
      );
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const result = await db
      .prepare(
        `INSERT INTO store_users(id,email,display_name,password_hash,legal_accepted_at,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING`,
      )
      .bind(id, email, name, passwordHash, Date.now(), Date.now())
      .run();
    if (!result.meta.changes)
      return fail(409, 'Não foi possível cadastrar este e-mail.');
    return {
      body: {
        id,
        email,
        role: 'CUSTOMER' as const,
        displayName: name,
        onboardingRequired: false,
      },
      status: 201,
    };
  }
  if (admin) {
    // Verify through the existing administrator login; no copied password or new role assignment.
    const adminCookie = await loginAdmin(request, { email, password });
    return {
      body: {
        ...admin,
        role: 'ADMIN' as const,
        displayName: null,
        onboardingRequired: false,
      },
      status: 200,
      cookie: adminCookie,
    };
  }
  // A valid BCrypt dummy avoids a fast path revealing whether a customer email exists.
  const fallback =
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttx9.RSqSmOIPmo1hvkpCLRW.xaa';
  const valid = await verifyPassword(password, user?.password_hash || fallback);
  if (!valid || !user?.enabled || !user.password_hash)
    return fail(401, 'E-mail ou senha inválidos.');
  return {
    body: customerView(user),
    status: 200,
    cookie: await session(db, request, user.id),
  };
}
export async function completeGoogleOnboarding(
  db: D1Database,
  request: Request,
  data: Record<string, unknown>,
) {
  fields(data, ['nickname', 'legalAccepted']);
  const nickname = textField(data, 'nickname', 40).replace(/\s+/g, ' ');
  if (nickname.length < 2)
    return fail(400, 'Escolha um apelido com pelo menos 2 caracteres.');
  if (data.legalAccepted !== true)
    return fail(400, 'Aceite os Termos de Uso e a Política de Privacidade.');
  const user = await sessionCustomer(db, request);
  if (!user?.googleId)
    return fail(401, 'Entre com Google para concluir sua conta.');
  await throttle(db, request, 'google-complete', 10, user.email);
  const result = await db
    .prepare(
      `UPDATE store_users
       SET display_name=?,legal_accepted_at=COALESCE(legal_accepted_at,?)
       WHERE id=? AND google_id IS NOT NULL AND enabled=1`,
    )
    .bind(nickname, Date.now(), user.id)
    .run();
  if (!result.meta.changes)
    return fail(409, 'Não foi possível concluir sua conta. Tente novamente.');
  return {
    id: user.id,
    email: user.email,
    role: 'CUSTOMER' as const,
    displayName: nickname,
    onboardingRequired: false,
  };
}
export async function logout(db: D1Database, request: Request) {
  await db
    .prepare('DELETE FROM store_sessions WHERE token_hash=?')
    .bind(await digest(cookie(request, SESSION)))
    .run();
  const headers = new Headers();
  headers.append('Set-Cookie', setCookie(request, SESSION, '', 0));
  headers.append('Set-Cookie', setCookie(request, 'TESOOB_STORE_CSRF', '', 0));
  headers.append('Set-Cookie', await logoutAdmin(request));
  return headers;
}
export function googleConfigured(settings: StoreEnvironment) {
  if (
    !settings.GOOGLE_CLIENT_ID ||
    !settings.GOOGLE_CLIENT_SECRET ||
    !settings.GOOGLE_REDIRECT_URI
  )
    return false;
  try {
    const url = new URL(settings.GOOGLE_REDIRECT_URI);
    return (
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(url.hostname))) &&
      url.pathname === '/store-api/login/oauth2/code/google' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export async function googleStart(
  db: D1Database,
  request: Request,
  settings: StoreEnvironment,
) {
  if (!googleConfigured(settings))
    return fail(503, 'O login Google ainda não foi configurado.');
  if (
    new URL(settings.GOOGLE_REDIRECT_URI!).origin !==
    new URL(request.url).origin
  )
    return fail(503, 'Callback Google não corresponde a este site.');
  await throttle(db, request, 'google-start', 15);
  const state = randomToken(),
    verifier = randomToken(),
    nonce = randomToken();
  await db.batch([
    db
      .prepare('DELETE FROM store_oauth_states WHERE expires_at < ?')
      .bind(Date.now()),
    db
      .prepare(
        'INSERT INTO store_oauth_states(state_hash,verifier,nonce,legal_accepted,expires_at) VALUES (?,?,?,?,?)',
      )
      .bind(
        await digest(state),
        verifier,
        nonce,
        0,
        Date.now() + 300000,
      ),
  ]);
  const challenge = btoa(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(verifier),
        ),
      ),
    ),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: settings.GOOGLE_CLIENT_ID!,
    redirect_uri: settings.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': setCookie(request, GOOGLE_STATE, state, 300),
      'Cache-Control': 'no-store',
    },
  });
}
export async function googleCallback(
  db: D1Database,
  request: Request,
  settings: StoreEnvironment,
) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    Location: '/loja/conta?error=google',
  });
  headers.append('Set-Cookie', setCookie(request, GOOGLE_STATE, '', 0));
  try {
    if (
      !googleConfigured(settings) ||
      new URL(settings.GOOGLE_REDIRECT_URI!).origin !==
        new URL(request.url).origin
    )
      throw new Error();
    const url = new URL(request.url),
      state = url.searchParams.get('state') || '',
      code = url.searchParams.get('code') || '';
    if (
      !/^[a-f0-9]{64}$/.test(state) ||
      !equal(state, cookie(request, GOOGLE_STATE)) ||
      !code ||
      code.length > 4096
    )
      throw new Error();
    // DELETE RETURNING consumes the state atomically; callbacks cannot be replayed.
    const flow = await db
      .prepare(
        'DELETE FROM store_oauth_states WHERE state_hash=? AND expires_at>? RETURNING verifier,nonce',
      )
      .bind(await digest(state), Date.now())
      .first<{ verifier: string; nonce: string }>();
    if (!flow) throw new Error();
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: settings.GOOGLE_CLIENT_ID!,
        client_secret: settings.GOOGLE_CLIENT_SECRET!,
        redirect_uri: settings.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
        code_verifier: flow.verifier,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const tokens = (await response.json()) as { id_token?: string };
    if (!response.ok || !tokens.id_token) throw new Error();
    const { payload } = await jwtVerify(tokens.id_token, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: settings.GOOGLE_CLIENT_ID!,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub', 'nonce'],
    });
    if (
      payload.nonce !== flow.nonce ||
      payload.email_verified !== true ||
      typeof payload.email !== 'string' ||
      !payload.sub ||
      payload.sub.length > 255 ||
      (payload.azp && payload.azp !== settings.GOOGLE_CLIENT_ID)
    )
      throw new Error();
    const email = payload.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error();
    const googleName =
      typeof payload.name === 'string'
        ? payload.name.trim().replace(/\s+/g, ' ').slice(0, 40)
        : '';
    const displayName =
      googleName.length >= 2
        ? googleName
        : email.split('@')[0].replace(/[._-]+/g, ' ').slice(0, 40);
    let user = await db
      .prepare('SELECT * FROM store_users WHERE google_id=?')
      .bind(payload.sub)
      .first<UserRow>();
    if (!user) {
      const conflict = await db
        .prepare(
          'SELECT id FROM store_users WHERE email=? UNION ALL SELECT id FROM chat_admin_accounts WHERE email=? LIMIT 1',
        )
        .bind(email, email)
        .first();
      if (conflict) throw new Error(); // No automatic linking of local/admin accounts by email.
      const id = crypto.randomUUID();
      await db
        .prepare(
          'INSERT INTO store_users(id,email,display_name,google_id,created_at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING',
        )
        .bind(id, email, displayName || 'Cliente Tesoob', payload.sub, Date.now())
        .run();
      user = await db
        .prepare('SELECT * FROM store_users WHERE google_id=?')
        .bind(payload.sub)
        .first<UserRow>();
    } else if (!user.display_name?.trim()) {
      await db
        .prepare('UPDATE store_users SET display_name=? WHERE id=?')
        .bind(displayName || 'Cliente Tesoob', user.id)
        .run();
      user = await db
        .prepare('SELECT * FROM store_users WHERE google_id=?')
        .bind(payload.sub)
        .first<UserRow>();
    }
    if (!user?.enabled) throw new Error();
    headers.append('Set-Cookie', await session(db, request, user.id));
    headers.set(
      'Location',
      !user.legal_accepted_at || !user.display_name?.trim()
        ? '/loja/conta/google'
        : '/loja/conta?google=success',
    );
  } catch {
    /* Never return/log OAuth tokens, codes, payloads or client secrets. */
  }
  return new Response(null, { status: 302, headers });
}
