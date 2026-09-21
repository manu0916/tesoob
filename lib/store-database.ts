import migration from '@/drizzle/0002_storefront.sql?raw';
import { database as chatDatabase } from './chat-server';
import { digest, fail } from './store-security';

let initialized: Promise<void> | undefined;
export async function storeDatabase() {
  const db = await chatDatabase();
  initialized ??= db
    .batch(
      migration
        .split('--> statement-breakpoint')
        .map((sql) => db.prepare(sql.trim())),
    )
    .then(() => {})
    .catch((error) => {
      initialized = undefined;
      throw error;
    });
  await initialized;
  return db;
}
export async function throttle(
  db: D1Database,
  request: Request,
  scope: string,
  limit: number,
  email = '',
) {
  // CF-Connecting-IP is supplied by Cloudflare, not arbitrary X-Forwarded-For.
  const peer = request.headers.get('CF-Connecting-IP') || 'local';
  const now = Date.now();
  const window = Math.floor(now / 60000);
  const key = `${scope}:${window}:${await digest(email || peer)}`;
  const result = await db
    .prepare(`INSERT INTO store_rate_limits(key,hits,expires_at) VALUES (?,1,?)
    ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits`)
    .bind(key, now + 120000)
    .first<{ hits: number }>();
  await db
    .prepare('DELETE FROM store_rate_limits WHERE expires_at < ?')
    .bind(now)
    .run();
  if (!result || result.hits > limit)
    fail(429, 'Muitas tentativas. Aguarde um minuto.');
}
export const productColumns =
  'id, name, price_cents, image_url, description, observation, active, version';
export type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  image_url: string;
  description: string;
  observation: string | null;
  active: number;
  version: number;
};
export const productView = (p: ProductRow) => ({
  id: p.id,
  name: p.name,
  price: p.price_cents / 100,
  imageUrl: p.image_url,
  description: p.description,
  observation: p.observation,
  active: !!p.active,
  version: p.version,
});
