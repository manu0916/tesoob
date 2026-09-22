import { fail, fields, integer, textField, uuid } from './store-security';
import { validateProductInput } from './store-products';

type DropRow = {
  id: string;
  name: string;
  launches_at: number;
  cancelled_at: number | null;
  version: number;
  product_count: number;
};

const dropView = (row: DropRow, now = Date.now()) => ({
  id: row.id,
  name: row.name,
  launchesAt: new Date(row.launches_at).toISOString(),
  status: row.cancelled_at
    ? ('CANCELLED' as const)
    : row.launches_at > now
      ? ('SCHEDULED' as const)
      : ('LAUNCHED' as const),
  productCount: Number(row.product_count),
  version: row.version,
});

export async function nextDrop(db: D1Database) {
  const now = Date.now();
  const row = await db
    .prepare(
      `SELECT d.id,d.name,d.launches_at,d.cancelled_at,d.version,count(p.id) AS product_count
       FROM store_drops d JOIN store_products p ON p.drop_id=d.id AND p.active=1
       WHERE d.cancelled_at IS NULL AND d.launches_at>?
       GROUP BY d.id
       ORDER BY d.launches_at ASC,d.id ASC LIMIT 1`,
    )
    .bind(now)
    .first<DropRow>();
  return { drop: row ? dropView(row, now) : null };
}

export async function listDrops(db: D1Database) {
  const now = Date.now();
  const rows = await db
    .prepare(
      `SELECT d.id,d.name,d.launches_at,d.cancelled_at,d.version,count(p.id) AS product_count
       FROM store_drops d LEFT JOIN store_products p ON p.drop_id=d.id AND p.active=1
       GROUP BY d.id
       ORDER BY d.launches_at DESC,d.id DESC LIMIT 50`,
    )
    .all<DropRow>();
  return { items: rows.results.map((row) => dropView(row, now)) };
}

export async function createDrop(
  db: D1Database,
  data: Record<string, unknown>,
  images?: R2Bucket,
) {
  fields(data, ['name', 'launchesAt', 'products']);
  const name = textField(data, 'name', 140);
  if (
    typeof data.launchesAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      data.launchesAt,
    )
  )
    return fail(400, 'Informe a data e a hora do lançamento.');
  const launchesAt = Date.parse(data.launchesAt);
  const now = Date.now();
  if (
    !Number.isFinite(launchesAt) ||
    launchesAt <= now ||
    launchesAt > now + 2 * 365 * 24 * 60 * 60 * 1000
  )
    return fail(400, 'Escolha uma data futura dentro dos próximos dois anos.');
  if (!Array.isArray(data.products) || !data.products.length)
    return fail(400, 'Adicione ao menos uma peça ao drop.');
  if (data.products.length > 30)
    return fail(400, 'Cada drop pode ter no máximo 30 peças.');

  const products = [];
  for (const item of data.products) {
    if (!item || typeof item !== 'object' || Array.isArray(item))
      return fail(400, 'Confira os dados das peças do drop.');
    products.push(
      await validateProductInput(
        {
          ...(item as Record<string, unknown>),
          active: true,
          version: 0,
        },
        images,
      ),
    );
  }

  const id = crypto.randomUUID();
  await db.batch([
    db
      .prepare(
        'INSERT INTO store_drops(id,name,launches_at,created_at,updated_at) VALUES (?,?,?,?,?)',
      )
      .bind(id, name, launchesAt, now, now),
    ...products.map((product) =>
      db
        .prepare(
          `INSERT INTO store_products(id,name,price_cents,image_url,description,observation,sizes_json,drop_id,active,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,1,?,?)`,
        )
        .bind(
          crypto.randomUUID(),
          product.name,
          product.priceCents,
          product.imageUrl,
          product.description,
          product.observation,
          JSON.stringify(product.sizes),
          id,
          now,
          now,
        ),
    ),
  ]);
  return {
    id,
    name,
    launchesAt: new Date(launchesAt).toISOString(),
    status: 'SCHEDULED' as const,
    productCount: products.length,
    version: 0,
  };
}

export async function cancelDrop(
  db: D1Database,
  id: string,
  requestedVersion: unknown,
) {
  if (!uuid(id)) return fail(400, 'Drop inválido.');
  const version = integer(requestedVersion, 0, Number.MAX_SAFE_INTEGER);
  const now = Date.now();
  const updated = await db
    .prepare(
      `UPDATE store_drops SET cancelled_at=?,updated_at=?,version=version+1
       WHERE id=? AND version=? AND cancelled_at IS NULL AND launches_at>?
       RETURNING id`,
    )
    .bind(now, now, id, version, now)
    .first<{ id: string }>();
  if (!updated) {
    const current = await db
      .prepare('SELECT id FROM store_drops WHERE id=?')
      .bind(id)
      .first();
    return current
      ? fail(409, 'O drop já foi lançado, cancelado ou alterado.')
      : fail(404, 'Drop não encontrado.');
  }
  await db
    .prepare(
      'UPDATE store_products SET active=0,version=version+1,updated_at=? WHERE drop_id=?',
    )
    .bind(now, id)
    .run();
}
