import { productColumns, productView, type ProductRow } from './store-database';
import { fail, fields, integer, textField } from './store-security';
import { uploadedImagePattern } from './store-image-format';

export type ValidatedProductInput = {
  name: string;
  priceCents: number;
  imageUrl: string;
  description: string;
  observation: string | null;
  sizes: string[];
  active: number;
  version: number;
};

export function pageNumber(url: URL) {
  return integer(Number(url.searchParams.get('page') || 0), 0, 100000);
}

function productSizes(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 30)
    return fail(400, 'Informe até 30 tamanhos por peça.');
  const sizes: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string')
      return fail(400, 'Use texto ou números nos tamanhos.');
    const size = item.trim();
    if (!size || size.length > 24)
      return fail(400, 'Cada tamanho deve ter entre 1 e 24 caracteres.');
    const key = size.toLocaleLowerCase('pt-BR');
    if (!seen.has(key)) {
      seen.add(key);
      sizes.push(size);
    }
  }
  return sizes;
}

async function validImage(image: string, images?: R2Bucket) {
  const uploaded = image.match(uploadedImagePattern)?.[1];
  if (uploaded) {
    if (!images)
      return fail(503, 'O armazenamento de imagens ainda não foi configurado.');
    if (!(await images.head(`products/${uploaded}`)))
      return fail(400, 'Envie a foto novamente antes de salvar.');
  } else if (!/^\/media\/[A-Za-z0-9._-]+\.(webp|png|jpe?g)$/.test(image)) {
    return fail(
      400,
      'Use uma imagem enviada pelo ateliê ou um arquivo local em /media/.',
    );
  }
}

export async function validateProductInput(
  data: Record<string, unknown>,
  images?: R2Bucket,
): Promise<ValidatedProductInput> {
  fields(data, [
    'name',
    'price',
    'imageUrl',
    'description',
    'observation',
    'sizes',
    'active',
    'version',
  ]);
  const name = textField(data, 'name', 140);
  const description = textField(data, 'description', 10000);
  const observation = textField(data, 'observation', 5000, true) || null;
  const imageUrl = textField(data, 'imageUrl', 2048);
  await validImage(imageUrl, images);
  if (
    typeof data.price !== 'number' ||
    !Number.isFinite(data.price) ||
    Math.abs(data.price * 100 - Math.round(data.price * 100)) > 0.001
  )
    return fail(400, 'Informe preço com até duas casas decimais.');
  if (typeof data.active !== 'boolean')
    return fail(400, 'Informe a disponibilidade.');
  return {
    name,
    priceCents: integer(Math.round(data.price * 100), 1, 999999999999),
    imageUrl,
    description,
    observation,
    sizes: productSizes(data.sizes),
    active: data.active ? 1 : 0,
    version: integer(data.version, 0, Number.MAX_SAFE_INTEGER),
  };
}

export async function listProducts(
  db: D1Database,
  page: number,
  admin = false,
) {
  const now = Date.now();
  const where = admin
    ? ''
    : `WHERE active=1 AND (drop_id IS NULL OR EXISTS (
        SELECT 1 FROM store_drops d
        WHERE d.id=store_products.drop_id AND d.cancelled_at IS NULL AND d.launches_at<=?
      ))`;
  const countQuery = db.prepare(
    `SELECT count(*) AS n FROM store_products ${where}`,
  );
  const rowsQuery = db.prepare(
    `SELECT ${productColumns} FROM store_products ${where}
     ORDER BY COALESCE((SELECT launches_at FROM store_drops d WHERE d.id=store_products.drop_id),created_at) DESC,id
     LIMIT 12 OFFSET ?`,
  );
  const [count, rows] = await db.batch([
    admin ? countQuery : countQuery.bind(now),
    admin ? rowsQuery.bind(page * 12) : rowsQuery.bind(now, page * 12),
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
      `SELECT ${productColumns} FROM store_products WHERE id=? AND active=1
       AND (drop_id IS NULL OR EXISTS (
         SELECT 1 FROM store_drops d
         WHERE d.id=store_products.drop_id AND d.cancelled_at IS NULL AND d.launches_at<=?
       ))`,
    )
    .bind(id, Date.now())
    .first<ProductRow>();
  return row ? productView(row) : fail(404, 'Produto não encontrado.');
}

export async function saveProduct(
  db: D1Database,
  id: string | null,
  data: Record<string, unknown>,
  images?: R2Bucket,
) {
  const input = await validateProductInput(data, images);
  const now = Date.now();
  let row: ProductRow | null;
  if (id) {
    row = await db
      .prepare(
        `UPDATE store_products SET name=?,price_cents=?,image_url=?,description=?,observation=?,sizes_json=?,active=?,version=version+1,updated_at=? WHERE id=? AND version=? RETURNING ${productColumns}`,
      )
      .bind(
        input.name,
        input.priceCents,
        input.imageUrl,
        input.description,
        input.observation,
        JSON.stringify(input.sizes),
        input.active,
        now,
        id,
        input.version,
      )
      .first<ProductRow>();
  } else {
    if (input.version !== 0) return fail(400, 'Versão inicial inválida.');
    row = await db
      .prepare(
        `INSERT INTO store_products(id,name,price_cents,image_url,description,observation,sizes_json,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) RETURNING ${productColumns}`,
      )
      .bind(
        crypto.randomUUID(),
        input.name,
        input.priceCents,
        input.imageUrl,
        input.description,
        input.observation,
        JSON.stringify(input.sizes),
        input.active,
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
