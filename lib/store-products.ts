import { productColumns, productView, type ProductRow } from './store-database';
import { fail, fields, integer, textField } from './store-security';
import { uploadedImagePattern } from './store-image-format';
export function pageNumber(url: URL) {
  return integer(Number(url.searchParams.get('page') || 0), 0, 100000);
}
export async function listProducts(
  db: D1Database,
  page: number,
  admin = false,
) {
  const where = admin ? '' : 'WHERE active=1';
  const [count, rows] = await db.batch([
    db.prepare(`SELECT count(*) AS n FROM store_products ${where}`),
    db
      .prepare(
        `SELECT ${productColumns} FROM store_products ${where} ORDER BY created_at DESC,id LIMIT 12 OFFSET ?`,
      )
      .bind(page * 12),
  ]);
  const total = Number((count.results[0] as { n: number }).n);
  return {
    items: (rows.results as ProductRow[]).map(productView),
    page,
    totalElements: total,
    totalPages: Math.ceil(total / 12),
  };
}
export async function getProduct(db: D1Database, id: string) {
  const row = await db
    .prepare(
      `SELECT ${productColumns} FROM store_products WHERE id=? AND active=1`,
    )
    .bind(id)
    .first<ProductRow>();
  return row ? productView(row) : fail(404, 'Produto não encontrado.');
}
export async function saveProduct(
  db: D1Database,
  id: string | null,
  data: Record<string, unknown>,
  images?: R2Bucket,
) {
  fields(data, [
    'name',
    'price',
    'imageUrl',
    'description',
    'observation',
    'active',
    'version',
  ]);
  const name = textField(data, 'name', 140),
    description = textField(data, 'description', 10000),
    observation = textField(data, 'observation', 5000, true) || null;
  const image = textField(data, 'imageUrl', 2048);
  const uploaded = image.match(uploadedImagePattern)?.[1];
  if (uploaded) {
    if (!images) return fail(503, 'O armazenamento de imagens ainda não foi configurado.');
    if (!(await images.head(`products/${uploaded}`))) return fail(400, 'Envie a foto novamente antes de salvar.');
  } else if (!/^\/media\/[A-Za-z0-9._-]+\.(webp|png|jpe?g)$/.test(image)) {
    try {
      const url = new URL(image);
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new Error();
    } catch {
      return fail(400, 'Use URL HTTPS ou arquivo em /media/.');
    }
  }
  if (
    typeof data.price !== 'number' ||
    !Number.isFinite(data.price) ||
    Math.abs(data.price * 100 - Math.round(data.price * 100)) > 0.001
  )
    return fail(400, 'Informe preço com até duas casas decimais.');
  const cents = integer(Math.round(data.price * 100), 1, 999999999999),
    version = integer(data.version, 0, Number.MAX_SAFE_INTEGER);
  if (typeof data.active !== 'boolean')
    return fail(400, 'Informe a disponibilidade.');
  const active = data.active ? 1 : 0,
    now = Date.now();
  let row: ProductRow | null;
  if (id)
    row = await db
      .prepare(
        `UPDATE store_products SET name=?,price_cents=?,image_url=?,description=?,observation=?,active=?,version=version+1,updated_at=? WHERE id=? AND version=? RETURNING ${productColumns}`,
      )
      .bind(
        name,
        cents,
        image,
        description,
        observation,
        active,
        now,
        id,
        version,
      )
      .first<ProductRow>();
  else {
    if (version !== 0) return fail(400, 'Versão inicial inválida.');
    row = await db
      .prepare(
        `INSERT INTO store_products(id,name,price_cents,image_url,description,observation,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) RETURNING ${productColumns}`,
      )
      .bind(
        crypto.randomUUID(),
        name,
        cents,
        image,
        description,
        observation,
        active,
        now,
        now,
      )
      .first<ProductRow>();
  }
  return row
    ? productView(row)
    : fail(409, 'O produto foi alterado. Recarregue antes de salvar.');
}
export async function archiveProduct(
  db: D1Database,
  id: string,
  version: number,
) {
  const result = await db
    .prepare(
      'UPDATE store_products SET active=0,version=version+1,updated_at=? WHERE id=? AND version=?',
    )
    .bind(Date.now(), id, version)
    .run();
  if (!result.meta.changes)
    fail(409, 'O produto foi alterado. Atualize a lista.');
}
