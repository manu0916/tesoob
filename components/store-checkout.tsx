'use client';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, LockKeyhole, Check } from 'lucide-react';
import {
  StoreFrame,
  StoreNotice,
  ProductImage,
  ProductObservation,
} from '@/components/storefront';
import {
  storeApi,
  storeMessage,
  StoreError,
  money,
  formText,
  type Product,
  type StoreUser,
  type CheckoutResult,
} from '@/lib/store-api';

export function StoreCheckout({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [retry, setRetry] = useState(0);
  const idempotency = useRef<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      storeApi<Product>(`/products/${id}`, { signal: controller.signal }),
      storeApi<StoreUser>('/auth/me', { signal: controller.signal }),
    ])
      .then(([item, account]) => {
        setError('');
        setProduct(item);
        setUser(account);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof StoreError && e.status === 401) {
          window.location.assign(
            `/loja/conta?next=${encodeURIComponent(`/loja/checkout/${id}`)}`,
          );
        } else setError(storeMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry]);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || !user || busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError('');
    idempotency.current ??= crypto.randomUUID();
    const text = (key: string) => formText(data, key).trim();
    const billing = {
      recipient: text('recipient'),
      document: text('document').replace(/\D/g, ''),
      postalCode: text('postalCode').replace(/\D/g, ''),
      street: text('street'),
      number: text('number'),
      complement: text('complement') || null,
      district: text('district'),
      city: text('city'),
      state: text('state'),
    };
    try {
      const response = await storeApi<CheckoutResult>('/checkout', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotency.current },
        body: JSON.stringify({
          productId: id,
          productVersion: product.version,
          quantity,
          billing,
        }),
      });
      form.reset();
      setResult(response);
    } catch (e) {
      setError(storeMessage(e));
      if (e instanceof StoreError && e.status === 401)
        window.location.assign(
          `/loja/conta?next=${encodeURIComponent(`/loja/checkout/${id}`)}`,
        );
    } finally {
      setBusy(false);
    }
  }
  return (
    <StoreFrame>
      <Link href={`/loja/produtos/${id}`} className="store-back">
        <ArrowLeft size={16} /> Voltar à peça
      </Link>
      {result ? (
        <section className="store-glass store-checkout-success">
          <Check size={40} />
          <p className="store-kicker">PEDIDO REGISTRADO</p>
          <h1>
            O PRÓXIMO
            <br />
            PASSO ESTÁ POR VIR.
          </h1>
          <p>{result.payment.message}</p>
          <p className="store-fine-print">Referência: {result.order.id}</p>
          <Link href="/loja/conta" className="store-button">
            Acompanhar meus pedidos <ArrowUpRight size={18} />
          </Link>
        </section>
      ) : loading ? (
        <StoreNotice>Preparando seu checkout…</StoreNotice>
      ) : !product || !user ? (
        <StoreNotice retry={() => setRetry((n) => n + 1)}>
          {error || 'Entre na sua conta para continuar.'}
        </StoreNotice>
      ) : (
        <>
          <header className="store-checkout-heading">
            <p className="store-kicker">01 / ESCOLHA FEITA · 02 / SEUS DADOS</p>
            <h1>QUASE SUA.</h1>
            <p>Confirme a peça e informe os dados de faturamento e entrega.</p>
          </header>
          <div className="store-checkout-layout">
            <form onSubmit={submit} className="store-glass store-checkout-form">
              <fieldset disabled={busy}>
                <legend>Quem recebe</legend>
                <label>
                  Nome completo
                  <input
                    name="recipient"
                    autoComplete="name"
                    required
                    maxLength={140}
                  />
                </label>
                <div className="store-form-grid">
                  <label>
                    CPF
                    <input
                      name="document"
                      inputMode="numeric"
                      pattern="[0-9.\-]{11,14}"
                      maxLength={14}
                      required
                      aria-describedby="cpf-hint"
                    />
                  </label>
                  <label>
                    CEP
                    <input
                      name="postalCode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9\-]{8,9}"
                      maxLength={9}
                      required
                    />
                  </label>
                </div>
                <p id="cpf-hint" className="store-fine-print">
                  CPF e endereço são criptografados ao salvar o pedido.
                </p>
              </fieldset>
              <fieldset disabled={busy}>
                <legend>Endereço de entrega e faturamento</legend>
                <label>
                  Rua / avenida
                  <input
                    name="street"
                    autoComplete="address-line1"
                    required
                    maxLength={160}
                  />
                </label>
                <div className="store-form-grid">
                  <label>
                    Número
                    <input name="number" required maxLength={20} />
                  </label>
                  <label>
                    Complemento <span>(opcional)</span>
                    <input
                      name="complement"
                      autoComplete="address-line2"
                      maxLength={100}
                    />
                  </label>
                </div>
                <label>
                  Bairro
                  <input name="district" required maxLength={100} />
                </label>
                <div className="store-form-grid">
                  <label>
                    Cidade
                    <input
                      name="city"
                      autoComplete="address-level2"
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    <span id="checkout-state-label">Estado</span>
                    <select
                      name="state"
                      aria-labelledby="checkout-state-label"
                      autoComplete="address-level1"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'
                        .split(' ')
                        .map((state) => (
                          <option key={state}>{state}</option>
                        ))}
                    </select>
                  </label>
                </div>
              </fieldset>
              <div className="store-payment-note">
                <LockKeyhole size={19} />
                <div>
                  <strong>Pagamento online em preparação</strong>
                  <p>
                    O Mercado Pago será disponibilizado em uma próxima etapa. Ao
                    continuar, você registra o pedido sem cobrança. Não
                    solicitamos dados de cartão.
                  </p>
                </div>
              </div>
              {error && (
                <div className="store-error" role="alert">
                  <p>{error}</p>
                  <button
                    type="button"
                    className="store-text-link"
                    onClick={() => {
                      idempotency.current = null;
                      setRetry((n) => n + 1);
                    }}
                  >
                    Revisar produto e iniciar nova tentativa
                  </button>
                </div>
              )}
              <button type="submit" className="store-button" disabled={busy}>
                {busy ? 'Registrando…' : 'Registrar pedido sem cobrança'}
                <ArrowUpRight size={19} />
              </button>
            </form>
            <aside className="store-glass store-checkout-summary">
              <div className="store-summary-image">
                <ProductImage product={product} />
              </div>
              <p className="store-kicker">SUA ESCOLHA</p>
              <h2>{product.name}</h2>
              <ProductObservation value={product.observation} />
              <label>
                <span id="checkout-quantity-label">Quantidade</span>
                <select
                  aria-labelledby="checkout-quantity-label"
                  value={quantity}
                  disabled={busy}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <dl>
                <div>
                  <dt>Valor unitário</dt>
                  <dd>{money(product.price)}</dd>
                </div>
                <div>
                  <dt>Frete</dt>
                  <dd>A combinar antes do pagamento</dd>
                </div>
                <div className="store-total">
                  <dt>Total dos produtos</dt>
                  <dd>{money(product.price * quantity)}</dd>
                </div>
              </dl>
              <p className="store-fine-print">
                Pedido vinculado a {user.email}. O valor é conferido no servidor
                antes do registro.
              </p>
            </aside>
          </div>
        </>
      )}
    </StoreFrame>
  );
}
