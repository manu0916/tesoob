'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Factory,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { money, storeApi, storeMessage } from '@/lib/store-api';

type DashboardStatus =
  | 'ALL'
  | 'AWAITING_INTEGRATION'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'CANCELLED';

type DashboardOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  productSize: string | null;
  quantity: number;
  total: number;
  currency: string;
  status: Exclude<DashboardStatus, 'ALL'>;
  createdAt: string;
};

type DashboardData = {
  metrics: {
    soldPieces: number;
    revenue: number;
    pendingOrders: number;
    acceptedOrders: number;
    productionOrders: number;
    totalOrders: number;
    averageTicket: number;
  };
  orders: DashboardOrder[];
  page: number;
  totalPages: number;
  totalElements: number;
};

const statusLabel: Record<DashboardOrder['status'], string> = {
  AWAITING_INTEGRATION: 'Pendente',
  PENDING_PAYMENT: 'Aceito',
  PAID: 'Em produção',
  CANCELLED: 'Cancelado',
};

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<DashboardStatus>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          status,
          ...(query.trim() ? { query: query.trim() } : {}),
        });
        storeApi<DashboardData>(`/admin/dashboard?${params}`, {
          signal: controller.signal,
        })
          .then((result) => {
            setData(result);
            setError('');
          })
          .catch((failure) => {
            if (!controller.signal.aborted) setError(storeMessage(failure));
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, query, revision, status]);

  async function advance(order: DashboardOrder) {
    const next =
      order.status === 'AWAITING_INTEGRATION'
        ? 'ACCEPTED'
        : order.status === 'PENDING_PAYMENT'
          ? 'IN_PRODUCTION'
          : null;
    if (!next || busyOrder) return;
    setBusyOrder(order.id);
    setError('');
    setNotice('');
    try {
      await storeApi(`/admin/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: next }),
      });
      setNotice(
        next === 'ACCEPTED'
          ? `Pedido de ${order.customerName} aceito.`
          : `${order.productName} foi enviado para produção.`,
      );
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(storeMessage(failure));
    } finally {
      setBusyOrder(null);
    }
  }

  const metrics = data?.metrics;
  return (
    <div className="admin-dashboard" aria-busy={loading}>
      <div className="admin-dashboard-heading">
        <div>
          <p className="eyebrow">VISÃO GERAL / OPERAÇÃO</p>
          <h2>PAINEL DE VENDAS</h2>
          <p>Acompanhe os números e mova cada pedido até a produção.</p>
        </div>
        <button
          type="button"
          className="admin-dashboard-refresh"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw className={loading ? 'chat-spin' : ''} size={16} />
          Atualizar
        </button>
      </div>

      <div className="admin-metrics" aria-label="Resumo das vendas">
        <article className="admin-metric admin-metric-featured">
          <span>
            <ShoppingBag size={20} />
          </span>
          <p>Peças vendidas</p>
          <strong>{metrics?.soldPieces ?? '—'}</strong>
          <small>Pedidos aceitos e em produção</small>
        </article>
        <article className="admin-metric">
          <span>
            <Banknote size={20} />
          </span>
          <p>Valor total arrecadado</p>
          <strong>{metrics ? money(metrics.revenue) : '—'}</strong>
          <small>
            Ticket médio {metrics ? money(metrics.averageTicket) : '—'}
          </small>
        </article>
        <article className="admin-metric">
          <span>
            <Clock3 size={20} />
          </span>
          <p>Pedidos pendentes</p>
          <strong>{metrics?.pendingOrders ?? '—'}</strong>
          <small>Aguardando sua aprovação</small>
        </article>
        <article className="admin-metric">
          <span>
            <Factory size={20} />
          </span>
          <p>Em produção</p>
          <strong>{metrics?.productionOrders ?? '—'}</strong>
          <small>{metrics?.acceptedOrders ?? 0} aceito(s) para iniciar</small>
        </article>
      </div>

      <section
        className="admin-purchase-log"
        aria-labelledby="purchase-log-title"
      >
        <div className="admin-purchase-log-heading">
          <div>
            <p className="eyebrow">ATIVIDADE DA LOJA</p>
            <h3 id="purchase-log-title">LOG DE COMPRAS</h3>
            <p>{data?.totalElements ?? 0} pedido(s) neste filtro</p>
          </div>
          <div className="admin-log-total">
            <span>Total de pedidos</span>
            <strong>{metrics?.totalOrders ?? '—'}</strong>
          </div>
        </div>

        <div className="admin-log-tools">
          <label className="admin-log-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Buscar no log de compras</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              placeholder="Buscar cliente, e-mail, peça ou pedido"
            />
          </label>
          <label className="admin-log-filter">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as DashboardStatus);
                setPage(0);
              }}
            >
              <option value="ALL">Todos os pedidos</option>
              <option value="AWAITING_INTEGRATION">Pendentes</option>
              <option value="PENDING_PAYMENT">Aceitos</option>
              <option value="PAID">Em produção</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </label>
        </div>

        {notice && (
          <output className="admin-dashboard-notice">
            <PackageCheck size={17} />
            {notice}
          </output>
        )}
        {error && (
          <div className="admin-dashboard-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRevision((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Peça</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Ação</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.orders.map((order) => {
                const actionable =
                  order.status === 'AWAITING_INTEGRATION' ||
                  order.status === 'PENDING_PAYMENT';
                return (
                  <tr key={order.id}>
                    <td data-label="Pedido">
                      <strong>#{order.id.slice(0, 8).toUpperCase()}</strong>
                    </td>
                    <td data-label="Cliente">
                      <strong>{order.customerName}</strong>
                      <small>{order.customerEmail}</small>
                    </td>
                    <td data-label="Peça">
                      <strong>{order.productName}</strong>
                      {order.productSize && (
                        <span>Tam. {order.productSize}</span>
                      )}
                      <small>
                        {order.quantity}{' '}
                        {order.quantity === 1 ? 'peça' : 'peças'}
                      </small>
                    </td>
                    <td data-label="Data">
                      <time dateTime={order.createdAt}>
                        {dateTime.format(new Date(order.createdAt))}
                      </time>
                    </td>
                    <td data-label="Valor">
                      <strong>{money(order.total)}</strong>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`admin-order-status admin-order-status-${order.status.toLowerCase()}`}
                      >
                        {statusLabel[order.status]}
                      </span>
                    </td>
                    <td className="admin-order-action">
                      {actionable ? (
                        <button
                          type="button"
                          disabled={busyOrder !== null}
                          onClick={() => void advance(order)}
                        >
                          {busyOrder === order.id ? (
                            <LoaderCircle className="chat-spin" size={16} />
                          ) : order.status === 'AWAITING_INTEGRATION' ? (
                            <PackageCheck size={16} />
                          ) : (
                            <Factory size={16} />
                          )}
                          {order.status === 'AWAITING_INTEGRATION'
                            ? 'Aceitar pedido'
                            : 'Iniciar produção'}
                          {busyOrder !== order.id && <ArrowRight size={15} />}
                        </button>
                      ) : (
                        <span className="admin-order-no-action">
                          {order.status === 'PAID'
                            ? 'Em andamento'
                            : 'Sem ação'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && data && !data.orders.length && (
            <div className="admin-log-empty">
              <ShoppingBag size={34} strokeWidth={1.2} />
              <strong>Nenhum pedido encontrado</strong>
              <p>Ajuste a busca ou o filtro para ver outros pedidos.</p>
            </div>
          )}
          {loading && !data && (
            <div className="admin-log-empty">
              <LoaderCircle className="chat-spin" size={28} />
              <p>Carregando a dashboard…</p>
            </div>
          )}
        </div>

        {data && data.totalPages > 1 && (
          <nav
            className="admin-dashboard-pagination"
            aria-label="Páginas do log de compras"
          >
            <button
              type="button"
              disabled={!page || loading}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span>
              Página {page + 1} de {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= data.totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Próxima <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
