import {
  decryptCheckout,
  encryptCheckout,
  fail,
  fields,
  integer,
  textField,
  uuid,
  type StoreEnvironment,
} from './store-security';
type OrderRow = {
  id: string;
  user_id: string;
  product_name: string;
  quantity: number;
  total_cents: number;
  currency: string;
  status: string;
  created_at: number;
  checkout_ciphertext: string;
};
const view = (row: OrderRow) => ({
  id: row.id,
  productName: row.product_name,
  quantity: row.quantity,
  total: row.total_cents / 100,
  currency: row.currency,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
});
const result = (row: OrderRow) => ({
  order: view(row),
  payment: {
    provider: 'MERCADO_PAGO',
    status: 'AWAITING_INTEGRATION',
    redirectUrl: null,
    message:
      'Pedido registrado. O pagamento ainda não está disponível e nenhuma cobrança foi feita.',
  },
});
function validCpf(value: string) {
  if (!/^\d{11}$/.test(value) || new Set(value).size === 1) return false;
  for (let n = 9; n <= 10; n++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(value[i]) * (n + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(value[n])) return false;
  }
  return true;
}
function checkoutInput(data: Record<string, unknown>) {
  fields(data, ['productId', 'productVersion', 'quantity', 'billing']);
  if (!uuid(data.productId)) return fail(400, 'Produto inválido.');
  const quantity = integer(data.quantity, 1, 10),
    productVersion = integer(data.productVersion, 0, Number.MAX_SAFE_INTEGER);
  if (
    !data.billing ||
    typeof data.billing !== 'object' ||
    Array.isArray(data.billing)
  )
    return fail(400, 'Informe o endereço.');
  const b = data.billing as Record<string, unknown>;
  fields(b, [
    'recipient',
    'document',
    'postalCode',
    'street',
    'number',
    'complement',
    'district',
    'city',
    'state',
  ]);
  const billing = {
    recipient: textField(b, 'recipient', 140),
    document: textField(b, 'document', 11),
    postalCode: textField(b, 'postalCode', 8),
    street: textField(b, 'street', 160),
    number: textField(b, 'number', 20),
    complement: textField(b, 'complement', 100, true) || null,
    district: textField(b, 'district', 100),
    city: textField(b, 'city', 100),
    state: textField(b, 'state', 2),
  };
  if (
    !validCpf(billing.document) ||
    !/^\d{8}$/.test(billing.postalCode) ||
    !'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'
      .split(' ')
      .includes(billing.state)
  )
    return fail(400, 'Confira CPF, CEP e estado.');
  return {
    productId: data.productId as string,
    productVersion,
    quantity,
    billing,
  };
}
export async function createOrder(
  db: D1Database,
  settings: StoreEnvironment,
  userId: string,
  key: string,
  data: Record<string, unknown>,
) {
  if (!uuid(key)) return fail(400, 'Idempotency-Key deve ser UUID.');
  const input = checkoutInput(data),
    serialized = JSON.stringify(input),
    id = crypto.randomUUID();
  const previous = await db
    .prepare('SELECT * FROM store_orders WHERE user_id=? AND idempotency_key=?')
    .bind(userId, key)
    .first<OrderRow>();
  if (previous) return repeat(settings, previous, serialized);
  const encrypted = await encryptCheckout(
    settings,
    serialized,
    `${userId}/${id}`,
  );
  // One atomic SQL statement snapshots server price, checks version and deduplicates.
  // No read-then-write race and no unsupported BEGIN transaction across D1 requests.
  const row = await db
    .prepare(`INSERT INTO store_orders(id,user_id,product_id,product_name,quantity,unit_price_cents,total_cents,checkout_ciphertext,idempotency_key,created_at)
    SELECT ?,?,id,name,?,price_cents,price_cents*?,?,?,? FROM store_products
    WHERE id=? AND active=1 AND version=? AND EXISTS (SELECT 1 FROM store_users WHERE id=? AND enabled=1)
    ON CONFLICT(user_id,idempotency_key) DO NOTHING RETURNING *`)
    .bind(
      id,
      userId,
      input.quantity,
      input.quantity,
      encrypted,
      key,
      Date.now(),
      input.productId,
      input.productVersion,
      userId,
    )
    .first<OrderRow>();
  if (row) return result(row);
  const raced = await db
    .prepare('SELECT * FROM store_orders WHERE user_id=? AND idempotency_key=?')
    .bind(userId, key)
    .first<OrderRow>();
  if (raced) return repeat(settings, raced, serialized);
  return fail(
    409,
    'O produto, preço ou disponibilidade mudou. Atualize e revise o checkout.',
  );
}
async function repeat(
  settings: StoreEnvironment,
  row: OrderRow,
  serialized: string,
) {
  const plain = await decryptCheckout(
    settings,
    row.checkout_ciphertext,
    `${row.user_id}/${row.id}`,
  );
  if (plain !== serialized)
    return fail(
      409,
      'Esta tentativa já foi usada com outros dados. Reabra o checkout.',
    );
  return result(row);
}
export async function getOrder(db: D1Database, userId: string, id: string) {
  const row = await db
    .prepare('SELECT * FROM store_orders WHERE id=? AND user_id=?')
    .bind(id, userId)
    .first<OrderRow>();
  return row ? view(row) : fail(404, 'Pedido não encontrado.');
}
export async function listOrders(db: D1Database, userId: string, page: number) {
  const [count, rows] = await db.batch([
    db
      .prepare('SELECT count(*) AS n FROM store_orders WHERE user_id=?')
      .bind(userId),
    db
      .prepare(
        'SELECT * FROM store_orders WHERE user_id=? ORDER BY created_at DESC,id LIMIT 12 OFFSET ?',
      )
      .bind(userId, page * 12),
  ]);
  return {
    items: (rows.results as OrderRow[]).map(view),
    page,
    totalPages: Math.ceil(Number((count.results[0] as { n: number }).n) / 12),
  };
}
