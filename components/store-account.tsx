/* oxlint-disable next/no-html-link-for-pages -- Google OAuth must navigate to the Worker endpoint, not the client router. */
'use client';
import { useEffect, useState, type SubmitEvent } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import { ArrowLeft, ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react';
import { StoreFrame, StoreNotice } from '@/components/storefront';
import {
  storeApi,
  storeMessage,
  StoreError,
  safeReturn,
  money,
  formText,
  type StoreUser,
  type Order,
} from '@/lib/store-api';

export function StoreAccount() {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(false);
  const [google, setGoogle] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [next, setNext] = useState('/loja');
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [ordersError, setOrdersError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
    const destination = safeReturn(
      params.get('next') ||
        (params.get('google') === 'success'
          ? sessionStorage.getItem('store:return')
          : null),
    );
    storeApi<{ google: boolean }>('/auth/options', {
      signal: controller.signal,
    })
      .then((o) => {
        setGoogle(o.google);
        setNext(destination);
        if (params.get('error') === 'google')
          setError(
            'Não foi possível entrar com Google. Se já tem uma conta por e-mail, use sua senha.',
          );
      })
      .catch(() => {});
    storeApi<StoreUser>('/auth/me', { signal: controller.signal })
      .then((value) => {
        setUser(value);
        if (params.get('google') === 'success' && destination !== '/loja') {
          sessionStorage.removeItem('store:return');
          window.location.assign(destination);
        }
      })
      .catch((e) => {
        if (
          !controller.signal.aborted &&
          !(e instanceof StoreError && e.status === 401)
        )
          setError(storeMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    storeApi<{ items: Order[]; totalPages: number }>(`/orders?page=${page}`, {
      signal: controller.signal,
    })
      .then((data) => {
        setOrdersError('');
        setOrders(data.items);
        setTotalPages(data.totalPages);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setOrdersError(storeMessage(e));
      });
    return () => controller.abort();
  }, [user, page]);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...(register ? { name: formText(data, 'name') } : {}),
        email: formText(data, 'email'),
        password: formText(data, 'password'),
      };
      if (register) {
        await storeApi('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setRegister(false);
        setNotice('Conta criada. Entre para continuar.');
        form.reset();
      } else {
        const value = await storeApi<StoreUser>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setUser(value);
        if (next !== '/loja') window.location.assign(next);
      }
    } catch (e) {
      setError(storeMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await storeApi('/auth/logout', { method: 'POST' });
      setUser(null);
      setOrders([]);
    } catch (e) {
      setError(storeMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <StoreFrame>
      <Link href="/loja" className="store-back">
        <ArrowLeft size={16} /> Voltar à vitrine
      </Link>
      {loading ? (
        <StoreNotice>Verificando sua conta…</StoreNotice>
      ) : user ? (
        <section className="store-account-panel">
          <p className="store-kicker">SEU ESPAÇO / TESOOB</p>
          <h1>SUAS ESCOLHAS.</h1>
          <div className="store-account-bar">
            <p>{user.email}</p>
            <button
              className="store-button store-button-secondary"
              onClick={logout}
              disabled={busy}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
          {user.role === 'ADMIN' && (
            <Link className="store-text-link" href="/admin/produtos">
              Gerenciar produtos <ArrowUpRight size={18} />
            </Link>
          )}
          {next !== '/loja' && (
            <Link href={next} className="store-button">
              Continuar <ArrowUpRight size={18} />
            </Link>
          )}
          <h2>Meus pedidos</h2>
          {ordersError && (
            <p role="alert" className="store-error">
              {ordersError}
            </p>
          )}
          {!orders.length && !ordersError ? (
            <StoreNotice>
              Suas próximas histórias vão aparecer aqui.
            </StoreNotice>
          ) : (
            orders.map((order) => (
              <article className="store-order-row" key={order.id}>
                <div>
                  <h3>{order.productName}</h3>
                  <p>
                    {order.quantity} peça(s) ·{' '}
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <small>Pedido {order.id}</small>
                </div>
                <div>
                  <strong>{money(order.total)}</strong>
                  <span>
                    {order.status === 'AWAITING_INTEGRATION'
                      ? 'Aguardando integração de pagamento'
                      : order.status === 'PAID'
                        ? 'Pago'
                        : order.status === 'CANCELLED'
                          ? 'Cancelado'
                          : 'Aguardando pagamento'}
                  </span>
                </div>
              </article>
            ))
          )}
          {totalPages > 1 && (
            <nav className="store-pagination" aria-label="Páginas de pedidos">
              <button disabled={!page} onClick={() => setPage((n) => n - 1)}>
                Anterior
              </button>
              <span>
                {page + 1}/{totalPages}
              </span>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((n) => n + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </section>
      ) : (
        <div className="store-auth-layout">
          <div className="store-auth-story">
            <p className="store-kicker">TESOOB / SUA CONTA</p>
            <h1>
              A SUA
              <br />
              <em>
                PRÓXIMA
                <br />
                HISTÓRIA.
              </em>
            </h1>
            <p>
              Entre para guardar suas escolhas
              <br />e acompanhar seus pedidos.
            </p>
            <span>
              <ShieldCheck size={18} /> Endereço e CPF? Só no checkout.
            </span>
          </div>
          <section className="store-glass store-auth-form">
            <div className="store-tabs">
              <button
                type="button"
                aria-pressed={!register}
                onClick={() => {
                  setRegister(false);
                  setError('');
                }}
              >
                Entrar
              </button>
              <button
                type="button"
                aria-pressed={register}
                onClick={() => {
                  setRegister(true);
                  setError('');
                }}
              >
                Criar conta
              </button>
            </div>
            <h2>{register ? 'Um novo começo.' : 'Bom ter você aqui.'}</h2>
            <form onSubmit={submit}>
              {register && (
                <label>
                  Nome
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={140}
                  />
                </label>
              )}
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
              <label>
                Senha
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={72}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  required
                  aria-describedby="password-hint"
                />
              </label>
              <p id="password-hint" className="store-fine-print">
                Use pelo menos 12 caracteres. A senha é protegida por hash.
              </p>
              <button disabled={busy} className="store-button" type="submit">
                {busy ? 'Aguarde…' : register ? 'Criar minha conta' : 'Entrar'}
                <ArrowUpRight size={18} />
              </button>
            </form>
            <div className="store-divider">ou</div>
            {google ? (
              <a
                href="/store-api/oauth2/authorization/google"
                onClick={() => sessionStorage.setItem('store:return', next)}
                className="store-button store-button-secondary"
              >
                Continuar com Google <ArrowUpRight size={18} />
              </a>
            ) : (
              <p className="store-fine-print">
                Login com Google ainda não disponível.
              </p>
            )}
            {notice && (
              <p aria-live="polite" className="store-success">
                {notice}
              </p>
            )}
          </section>
        </div>
      )}
      {error && (
        <p className="store-error" role="alert">
          {error}
        </p>
      )}
    </StoreFrame>
  );
}
