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
  product_size: string | null;
  quantity: number;
  total_cents: number;
  currency: string;
  status: string;
  created_at: number;
  checkout_ciphertext: string;
};
export type StoreOrderStatus =
  | 'AWAITING_INTEGRATION'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED';

type AdminOrderRow = OrderRow & {
  customer_name: string | null;
  customer_email: string;
};

const adminView = (row: AdminOrderRow) => ({
  ...view(row),
  customerName: row.customer_name?.trim() || row.customer_email.split('@')[0],
  customerEmail: row.customer_email,
});

const dashboardStatuses = new Set([
  'ALL',
  'AWAITING_INTEGRATION',
  'PENDING_PAYMENT',
  'PAID',
  'CANCELLED',
]);

function likeTerm(value: string) {
  return `%${value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}
const view = (row: OrderRow) => ({
  id: row.id,
  productName: row.product_name,
  productSize: row.product_size,
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
  fields(data, ['productId', 'productVersion', 'quantity', 'size', 'billing']);
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
    size: textField(data, 'size', 24, true) || null,
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
    .prepare(`INSERT INTO store_orders(id,user_id,product_id,product_name,product_size,quantity,unit_price_cents,total_cents,checkout_ciphertext,idempotency_key,created_at)
    SELECT ?,?,id,name,?,?,price_cents,price_cents*?,?,?,? FROM store_products
    WHERE id=? AND active=1 AND version=?
      AND (drop_id IS NULL OR EXISTS (
        SELECT 1 FROM store_drops d WHERE d.id=store_products.drop_id AND d.cancelled_at IS NULL AND d.launches_at<=?
      ))
      AND ((sizes_json='[]' AND ? IS NULL) OR (? IS NOT NULL AND EXISTS (
        SELECT 1 FROM json_each(store_products.sizes_json) WHERE value=?
      )))
      AND EXISTS (SELECT 1 FROM store_users WHERE id=? AND enabled=1)
    ON CONFLICT(user_id,idempotency_key) DO NOTHING RETURNING *`)
    .bind(
      id,
      userId,
      input.size,
      input.quantity,
      input.quantity,
      encrypted,
      key,
      Date.now(),
      input.productId,
      input.productVersion,
      Date.now(),
      input.size,
      input.size,
      input.size,
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

export async function adminDashboard(
  db: D1Database,
  page: number,
  requestedStatus: string,
  requestedQuery: string,
) {
  const status = dashboardStatuses.has(requestedStatus)
    ? requestedStatus
    : 'ALL';
  const query = requestedQuery.trim().toLocaleLowerCase('pt-BR').slice(0, 100);
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (status !== 'ALL') {
    conditions.push('o.status=?');
    values.push(status);
  }
  if (query) {
    const term = likeTerm(query);
    conditions.push(`(
      lower(COALESCE(u.display_name,'')) LIKE ? ESCAPE '\\'
      OR lower(u.email) LIKE ? ESCAPE '\\'
      OR lower(o.product_name) LIKE ? ESCAPE '\\'
      OR lower(o.id) LIKE ? ESCAPE '\\'
    )`);
    values.push(term, term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const pageSize = 12;
  const [metricsResult, countResult, ordersResult] = await db.batch([
    db.prepare(`SELECT
      count(*) AS total_orders,
      COALESCE(sum(CASE WHEN status IN ('PENDING_PAYMENT','PAID') THEN quantity ELSE 0 END),0) AS sold_pieces,
      COALESCE(sum(CASE WHEN status IN ('PENDING_PAYMENT','PAID') THEN total_cents ELSE 0 END),0) AS revenue_cents,
      COALESCE(sum(CASE WHEN status IN ('PENDING_PAYMENT','PAID') THEN 1 ELSE 0 END),0) AS confirmed_orders,
      COALESCE(sum(CASE WHEN status='AWAITING_INTEGRATION' THEN 1 ELSE 0 END),0) AS pending_orders,
      COALESCE(sum(CASE WHEN status='PENDING_PAYMENT' THEN 1 ELSE 0 END),0) AS accepted_orders,
      COALESCE(sum(CASE WHEN status='PAID' THEN 1 ELSE 0 END),0) AS production_orders
      FROM store_orders`),
    db
      .prepare(`SELECT count(*) AS n FROM store_orders o
        JOIN store_users u ON u.id=o.user_id ${where}`)
      .bind(...values),
    db
      .prepare(`SELECT o.*,u.display_name AS customer_name,u.email AS customer_email
        FROM store_orders o JOIN store_users u ON u.id=o.user_id ${where}
        ORDER BY o.created_at DESC,o.id DESC LIMIT ? OFFSET ?`)
      .bind(...values, pageSize, page * pageSize),
  ]);
  const metrics = metricsResult.results[0] as {
    total_orders: number;
    sold_pieces: number;
    revenue_cents: number;
    confirmed_orders: number;
    pending_orders: number;
    accepted_orders: number;
    production_orders: number;
  };
  const total = Number((countResult.results[0] as { n: number }).n);
  const confirmedOrders = Number(metrics.confirmed_orders);
  return {
    metrics: {
      soldPieces: Number(metrics.sold_pieces),
      revenue: Number(metrics.revenue_cents) / 100,
      pendingOrders: Number(metrics.pending_orders),
      acceptedOrders: Number(metrics.accepted_orders),
      productionOrders: Number(metrics.production_orders),
      totalOrders: Number(metrics.total_orders),
      averageTicket: confirmedOrders
        ? Number(metrics.revenue_cents) / 100 / confirmedOrders
        : 0,
    },
    orders: (ordersResult.results as AdminOrderRow[]).map(adminView),
    page,
    totalPages: Math.ceil(total / pageSize),
    totalElements: total,
  };
}

export async function advanceAdminOrder(
  db: D1Database,
  id: string,
  requestedStatus: unknown,
) {
  const transitions: Record<
    string,
    { from: StoreOrderStatus; to: StoreOrderStatus }
  > = {
    ACCEPTED: { from: 'AWAITING_INTEGRATION', to: 'PENDING_PAYMENT' },
    IN_PRODUCTION: { from: 'PENDING_PAYMENT', to: 'PAID' },
  };
  const transition =
    typeof requestedStatus === 'string'
      ? transitions[requestedStatus]
      : undefined;
  if (!transition) return fail(400, 'Status de pedido invÃ¡lido.');
  const updated = await db
    .prepare(
      'UPDATE store_orders SET status=? WHERE id=? AND status=? RETURNING id',
    )
    .bind(transition.to, id, transition.from)
    .first<{ id: string }>();
  if (updated) return { id, status: transition.to };
  const current = await db
    .prepare('SELECT status FROM store_orders WHERE id=?')
    .bind(id)
    .first<{ status: StoreOrderStatus }>();
  if (!current) return fail(404, 'Pedido nÃ£o encontrado.');
  return fail(409, 'Este pedido jÃ¡ foi atualizado. Recarregue a dashboard.');
}
