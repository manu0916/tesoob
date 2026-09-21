/* oxlint-disable next/no-img-element -- Product image URLs are administrator-managed. */
'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/tesoob';
import {
  storeApi,
  storeMessage,
  money,
  type Product,
  type ProductPage,
} from '@/lib/store-api';

export function StoreFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="store-shell">{children}</main>
      <SiteFooter />
    </>
  );
}
export function StoreNotice({
  children,
  retry,
}: {
  children: ReactNode;
  retry?: () => void;
}) {
  return (
    <div className="store-notice" aria-live="polite">
      <div>{children}</div>
      {retry && (
        <button className="store-button store-button-secondary" onClick={retry}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function ProductObservation({ value }: { value?: string | null }) {
  const observation = value?.trim();
  return observation ? (
    <aside className="store-observation">
      <span>Observações</span>
      <p>{observation}</p>
    </aside>
  ) : null;
}
export function ProductImage({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return failedUrl === product.imageUrl ? (
    <div className="store-image-error">Imagem indisponível</div>
  ) : (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(product.imageUrl)}
    />
  );
}
export function Storefront() {
  const [catalog, setCatalog] = useState<ProductPage | null>(null);
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    storeApi<ProductPage>(`/products?page=${page}`, {
      signal: controller.signal,
    })
      .then((data) => {
        setError('');
        setCatalog(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(storeMessage(e));
      });
    return () => controller.abort();
  }, [page, retry]);
  return (
    <StoreFrame>
      <div className="store-toolbar">
        <Link href="/">
          <ArrowLeft size={15} /> O universo Tesoob
        </Link>
        <Link href="/loja/conta">
          <UserRound size={16} /> Minha conta
        </Link>
      </div>
      <header className="store-intro">
        <div>
          <p className="store-kicker">TESOOB / SELEÇÃO AUTORAL</p>
          <h1>
            VISTA O<br />
            <em>INESPERADO.</em>
          </h1>
        </div>
        <div className="store-intro-note">
          <span>01 — A VITRINE</span>
          <p>
            Recortes que surpreendem.
            <br />
            Detalhes que ficam.
            <br />A próxima história é sua.
          </p>
          <a href="#vitrine">
            Explore a seleção <ArrowRight size={17} />
          </a>
        </div>
      </header>
      <section
        id="vitrine"
        className="store-catalog"
        aria-label="Produtos à venda"
      >
        <div className="store-section-label">
          <span>PEÇAS EM DESTAQUE</span>
          <span>
            {catalog
              ? `${catalog.totalElements.toString().padStart(2, '0')} / DISPONÍVEIS`
              : 'TESOOB / STORE'}
          </span>
        </div>
        {error ? (
          <StoreNotice retry={() => setRetry((n) => n + 1)}>
            {error}
          </StoreNotice>
        ) : !catalog ? (
          <StoreNotice>Carregando a seleção…</StoreNotice>
        ) : !catalog.items.length ? (
          <StoreNotice>
            A próxima seleção está sendo preparada. Volte em breve.
          </StoreNotice>
        ) : (
          <div className="store-grid">
            {catalog.items.map((product, index) => (
              <article
                key={product.id}
                className={`store-card store-card-${index % 3}`}
                style={
                  { '--card-delay': `${(index % 6) * 65}ms` } as CSSProperties
                }
              >
                <Link
                  href={`/loja/produtos/${product.id}`}
                  className="store-card-image"
                  aria-label={`Conhecer ${product.name}`}
                >
                  <ProductImage product={product} eager={index < 2} />
                  <span className="store-piece-number">
                    {String(page * 12 + index + 1).padStart(2, '0')} / TESOOB
                  </span>
                  <span className="store-card-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </Link>
                <div className="store-card-body">
                  <div className="store-card-title">
                    <h2>
                      <Link href={`/loja/produtos/${product.id}`}>
                        {product.name}
                      </Link>
                    </h2>
                    <p>{money(product.price)}</p>
                  </div>
                  <p className="store-description">{product.description}</p>
                  <ProductObservation value={product.observation} />
                  <Link
                    className="store-text-link"
                    href={`/loja/produtos/${product.id}`}
                  >
                    Conhecer a peça <ArrowUpRight size={17} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        {catalog && catalog.totalPages > 1 && (
          <nav className="store-pagination" aria-label="Páginas da vitrine">
            <button
              disabled={page === 0}
              onClick={() => setPage((n) => n - 1)}
              className="store-button store-button-secondary"
            >
              Anterior
            </button>
            <span>
              {page + 1} / {catalog.totalPages}
            </span>
            <button
              disabled={page + 1 === catalog.totalPages}
              onClick={() => setPage((n) => n + 1)}
              className="store-button store-button-secondary"
            >
              Próxima
            </button>
          </nav>
        )}
      </section>
      <div className="store-footnote">
        <ShieldCheck size={20} />
        <p>
          Uma peça de cada vez. Seus dados de entrega são solicitados somente no
          checkout.
        </p>
        <span>FEITO PARA MARCAR.</span>
      </div>
    </StoreFrame>
  );
}
export function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    storeApi<Product>(`/products/${id}`, { signal: controller.signal })
      .then((data) => {
        setError('');
        setProduct(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(storeMessage(e));
      });
    return () => controller.abort();
  }, [id, retry]);
  return (
    <StoreFrame>
      <Link href="/loja" className="store-back">
        <ArrowLeft size={16} /> Voltar à vitrine
      </Link>
      {error ? (
        <StoreNotice retry={() => setRetry((n) => n + 1)}>{error}</StoreNotice>
      ) : !product ? (
        <StoreNotice>Carregando a peça…</StoreNotice>
      ) : (
        <div className="store-detail">
          <div className="store-detail-image">
            <ProductImage product={product} eager />
          </div>
          <div className="store-detail-copy">
            <p className="store-kicker">TESOOB / PEÇA AUTORAL</p>
            <h1>{product.name}</h1>
            <p className="store-price">{money(product.price)}</p>
            <p className="store-description">{product.description}</p>
            <ProductObservation value={product.observation} />
            <Link
              href={`/loja/checkout/${product.id}`}
              className="store-button"
            >
              Comprar <ArrowUpRight size={20} />
            </Link>
            <p className="store-fine-print">
              Você entrará na sua conta antes de informar os dados de entrega.
              Pagamento online em preparação; nenhuma cobrança automática.
            </p>
          </div>
        </div>
      )}
    </StoreFrame>
  );
}
