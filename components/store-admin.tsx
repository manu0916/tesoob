'use client';

import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ArrowUpRight,
  CalendarPlus,
  Clock3,
  PackagePlus,
} from 'lucide-react';
import { StoreFrame, StoreNotice, ProductImage } from '@/components/storefront';
import { AdminNavigation } from '@/components/admin-navigation';
import { ProductImageInput } from '@/components/product-image-input';
import { DropCountdown } from '@/components/drop-countdown';
import { prepareProductImage } from '@/lib/prepare-product-image';
import {
  storeApi,
  storeMessage,
  StoreError,
  money,
  formText,
  type StoreUser,
  type Product,
  type ProductPage,
  type StoreDrop,
} from '@/lib/store-api';

type DropProductDraft = {
  key: string;
  name: string;
  price: number;
  description: string;
  observation: string | null;
  sizes: string[];
  file: File;
  previewUrl: string;
};

function initialLaunchTime() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function countdownTarget(value: string) {
  const time = Date.parse(value);
  return new Date(Number.isFinite(time) ? time : Date.now()).toISOString();
}

function SizeEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (sizes: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  function add() {
    const size = draft.trim();
    if (
      !size ||
      value.some((item) => item.toLowerCase() === size.toLowerCase())
    )
      return;
    onChange([...value, size]);
    setDraft('');
  }
  return (
    <fieldset className="store-size-fieldset">
      <legend>Tamanhos disponíveis</legend>
      <p className="store-fine-print">
        Use letras, números ou uma medida personalizada. Ex.: PP, M, 38, único.
      </p>
      <div className="store-size-editor">
        {value.map((size) => (
          <span key={size}>
            {size}
            <button
              type="button"
              aria-label={`Remover tamanho ${size}`}
              onClick={() => onChange(value.filter((item) => item !== size))}
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          aria-label="Adicionar tamanho"
          value={draft}
          maxLength={24}
          placeholder="Ex.: G ou 40"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} aria-label="Confirmar tamanho">
          <Plus size={16} />
        </button>
      </div>
    </fieldset>
  );
}

function ProductFields({
  product,
  sizes,
  onSizesChange,
  includeAvailability = true,
}: {
  product?: Product | null;
  sizes: string[];
  onSizesChange: (sizes: string[]) => void;
  includeAvailability?: boolean;
}) {
  return (
    <>
      <div className="store-form-grid">
        <label>
          Nome
          <input
            name="name"
            defaultValue={product?.name}
            required
            maxLength={140}
          />
        </label>
        <label>
          Preço (R$)
          <input
            name="price"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="9999999999.99"
            step="0.01"
            required
            defaultValue={product?.price}
          />
        </label>
      </div>
      <ProductImageInput currentUrl={product?.imageUrl} />
      <SizeEditor value={sizes} onChange={onSizesChange} />
      <label>
        Descrição
        <textarea
          name="description"
          rows={4}
          maxLength={10000}
          required
          defaultValue={product?.description}
        />
      </label>
      <label>
        Observação <span>(opcional)</span>
        <textarea
          name="observation"
          rows={3}
          maxLength={3000}
          defaultValue={product?.observation || ''}
        />
      </label>
      <p className="store-fine-print">
        Em branco? Nenhuma caixa ou título de observação será exibido na
        vitrine.
      </p>
      {includeAvailability && (
        <label className="store-checkbox">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />{' '}
          Exibir na vitrine
        </label>
      )}
    </>
  );
}

export function StoreAdmin() {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ProductPage | null>(null);
  const [drops, setDrops] = useState<StoreDrop[]>([]);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [dropName, setDropName] = useState('');
  const [launchesAt, setLaunchesAt] = useState(initialLaunchTime);
  const [dropPieces, setDropPieces] = useState<DropProductDraft[]>([]);
  const [dropSizes, setDropSizes] = useState<string[]>([]);
  const [dropPieceFormKey, setDropPieceFormKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [uploading, setUploading] = useState(false);
  const lastUpload = useRef<{ file: File; url: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const editor = useRef<HTMLElement>(null);
  const editorTrigger = useRef<HTMLButtonElement | null>(null);
  const [createRequested, setCreateRequested] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const openNew =
      new URLSearchParams(window.location.search).get('novo') === '1';
    storeApi<StoreUser>('/auth/me', { signal: controller.signal })
      .then((account) => {
        if (controller.signal.aborted) return;
        setUser(account);
        if (account.role === 'ADMIN' && openNew) {
          setEditing('new');
          setProductSizes([]);
          window.history.replaceState(null, '', '/admin/produtos');
        }
      })
      .catch((reason) => {
        if (
          !controller.signal.aborted &&
          !(reason instanceof StoreError && reason.status === 401)
        )
          setError(storeMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCreateRequested(openNew);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!editing) return;
    editor.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    editor.current
      ?.querySelector<HTMLInputElement>('input[name="name"]')
      ?.focus({ preventScroll: true });
  }, [editing]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const controller = new AbortController();
    Promise.all([
      storeApi<ProductPage>(`/admin/products?page=${page}`, {
        signal: controller.signal,
      }),
      storeApi<{ items: StoreDrop[] }>('/admin/drops', {
        signal: controller.signal,
      }),
    ])
      .then(([products, dropPage]) => {
        setError('');
        setCatalog(products);
        setDrops(dropPage.items);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(storeMessage(reason));
      });
    return () => controller.abort();
  }, [user, page, revision]);

  function closeEditor() {
    setEditing(null);
    setProductSizes([]);
    editorTrigger.current?.focus();
  }

  async function upload(file: File) {
    const blob = await prepareProductImage(file);
    return storeApi<{ imageUrl: string }>('/admin/images', {
      method: 'POST',
      body: blob,
      headers: { 'Content-Type': 'image/webp' },
    });
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving.current) return;
    const data = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>(
      'input[name="imageFile"]',
    )?.files?.[0];
    saving.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      let imageUrl = editing === 'new' ? '' : editing.imageUrl;
      if (file) {
        if (lastUpload.current?.file === file)
          imageUrl = lastUpload.current.url;
        else {
          setUploading(true);
          const uploaded = await upload(file);
          imageUrl = uploaded.imageUrl;
          lastUpload.current = { file, url: imageUrl };
        }
      }
      if (!imageUrl) throw new Error('Escolha uma foto para a peça.');
      await storeApi(
        editing === 'new' ? '/admin/products' : `/admin/products/${editing.id}`,
        {
          method: editing === 'new' ? 'POST' : 'PUT',
          body: JSON.stringify({
            name: formText(data, 'name').trim(),
            price: Number(formText(data, 'price')),
            imageUrl,
            description: formText(data, 'description').trim(),
            observation: formText(data, 'observation').trim() || null,
            sizes: productSizes,
            active: data.get('active') === 'on',
            version: editing === 'new' ? 0 : editing.version,
          }),
        },
      );
      setEditing(null);
      setProductSizes([]);
      lastUpload.current = null;
      setNotice('Produto salvo. A vitrine já usa os novos dados.');
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(storeMessage(reason));
    } finally {
      saving.current = false;
      setUploading(false);
      setBusy(false);
    }
  }

  function addDropPiece(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>(
      'input[name="imageFile"]',
    )?.files?.[0];
    if (!file) {
      setError('Escolha uma foto para a peça do drop.');
      return;
    }
    const draft: DropProductDraft = {
      key: crypto.randomUUID(),
      name: formText(data, 'name').trim(),
      price: Number(formText(data, 'price')),
      description: formText(data, 'description').trim(),
      observation: formText(data, 'observation').trim() || null,
      sizes: dropSizes,
      file,
      previewUrl: URL.createObjectURL(file),
    };
    setDropPieces((items) => [...items, draft]);
    setDropSizes([]);
    setDropPieceFormKey((value) => value + 1);
    setError('');
  }

  function removeDropPiece(key: string) {
    setDropPieces((items) => {
      const removed = items.find((item) => item.key === key);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return items.filter((item) => item.key !== key);
    });
  }

  function closeDrop() {
    dropPieces.forEach((piece) => URL.revokeObjectURL(piece.previewUrl));
    setDropPieces([]);
    setDropSizes([]);
    setDropName('');
    setLaunchesAt(initialLaunchTime());
    setDropOpen(false);
  }

  async function scheduleDrop() {
    if (!dropName.trim()) {
      setError('Dê um nome ao drop.');
      return;
    }
    if (!dropPieces.length) {
      setError('Adicione ao menos uma peça ao drop.');
      return;
    }
    const date = new Date(launchesAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      setError('Escolha uma data e hora futuras.');
      return;
    }
    setBusy(true);
    setUploading(true);
    setError('');
    try {
      const products = [];
      for (const piece of dropPieces) {
        const uploaded = await upload(piece.file);
        products.push({
          name: piece.name,
          price: piece.price,
          imageUrl: uploaded.imageUrl,
          description: piece.description,
          observation: piece.observation,
          sizes: piece.sizes,
        });
      }
      await storeApi('/admin/drops', {
        method: 'POST',
        body: JSON.stringify({
          name: dropName.trim(),
          launchesAt: date.toISOString(),
          products,
        }),
      });
      closeDrop();
      setNotice('Drop agendado. Todas as peças entrarão no ar juntas.');
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(storeMessage(reason));
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError('');
    try {
      await storeApi(
        `/admin/products/${deleting.id}?version=${deleting.version}`,
        {
          method: 'DELETE',
        },
      );
      setDeleting(null);
      setNotice(
        'Produto retirado da vitrine. Os pedidos anteriores foram preservados.',
      );
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(storeMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function cancelScheduledDrop(drop: StoreDrop) {
    setBusy(true);
    setError('');
    try {
      await storeApi(`/admin/drops/${drop.id}?version=${drop.version}`, {
        method: 'DELETE',
      });
      setNotice('Drop cancelado. As peças agendadas não serão publicadas.');
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(storeMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const product = editing && editing !== 'new' ? editing : null;
  const scheduledDrops = drops.filter((drop) => drop.status === 'SCHEDULED');

  return (
    <StoreFrame>
      <Link href="/admin" className="store-back">
        <ArrowLeft size={16} /> Atendimento do ateliê
      </Link>
      {user?.role === 'ADMIN' && <AdminNavigation current="products" />}
      <header className="store-admin-heading">
        <div>
          <p className="store-kicker">ATELIÊ / GESTÃO DA VITRINE</p>
          <h1>
            SUAS PEÇAS.
            <br />
            EM CENA.
          </h1>
        </div>
        {user?.role === 'ADMIN' && (
          <div className="store-admin-heading-actions">
            <button
              disabled={busy}
              onClick={(event) => {
                editorTrigger.current = event.currentTarget;
                setDropOpen(false);
                setEditing('new');
                setProductSizes([]);
                setError('');
                setNotice('');
              }}
              className="store-button"
            >
              <Plus size={18} /> Novo produto
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setEditing(null);
                setDropOpen(true);
                setError('');
                setNotice('');
              }}
              className="store-button store-drop-launch-button"
            >
              <CalendarPlus size={18} /> Lançar drop
            </button>
          </div>
        )}
      </header>

      {loading ? (
        <StoreNotice>Verificando acesso…</StoreNotice>
      ) : !user ? (
        <StoreNotice>
          <Link
            className="store-button"
            href={
              createRequested
                ? '/loja/conta?next=%2Fadmin%2Fprodutos%3Fnovo%3D1'
                : '/loja/conta?next=%2Fadmin%2Fprodutos'
            }
          >
            Entrar como administrador <ArrowUpRight size={18} />
          </Link>
        </StoreNotice>
      ) : user.role !== 'ADMIN' ? (
        <StoreNotice>
          Esta área é exclusiva para administradores da vitrine.
        </StoreNotice>
      ) : (
        <>
          {notice && (
            <p className="store-success" aria-live="polite">
              <Check size={18} />
              {notice}
            </p>
          )}
          {error && !editing && !dropOpen && (
            <div role="alert" className="store-error">
              <p>{error}</p>
              <button
                type="button"
                className="store-text-link"
                onClick={() => setRevision((value) => value + 1)}
              >
                Recarregar produtos
              </button>
            </div>
          )}

          {dropOpen && (
            <section
              className="store-drop-editor"
              aria-labelledby="drop-editor-title"
            >
              <div className="store-editor-header">
                <div>
                  <p className="store-kicker">LANÇAMENTO PROGRAMADO</p>
                  <h2 id="drop-editor-title">LANÇAR DROP</h2>
                </div>
                <button
                  type="button"
                  className="store-icon-button"
                  aria-label="Fechar criação do drop"
                  disabled={busy}
                  onClick={closeDrop}
                >
                  <X />
                </button>
              </div>
              <div className="store-drop-layout">
                <div>
                  <div className="store-form-grid">
                    <label>
                      Nome do drop
                      <input
                        value={dropName}
                        onChange={(event) => setDropName(event.target.value)}
                        maxLength={140}
                        placeholder="Ex.: Noite em movimento"
                      />
                    </label>
                    <label>
                      Data e hora do lançamento
                      <input
                        type="datetime-local"
                        value={launchesAt}
                        min={initialLaunchTime().slice(0, 16)}
                        onChange={(event) => setLaunchesAt(event.target.value)}
                      />
                    </label>
                  </div>
                  <p className="store-drop-explanation">
                    As peças ficam invisíveis até este horário e entram no site
                    juntas, automaticamente.
                  </p>

                  <div className="store-drop-piece-list">
                    <div className="store-drop-section-heading">
                      <h3>PEÇAS DO DROP</h3>
                      <span>{String(dropPieces.length).padStart(2, '0')}</span>
                    </div>
                    {dropPieces.map((piece) => (
                      <article key={piece.key}>
                        {/* Blob preview exists only in this local editor. */}
                        {/* oxlint-disable-next-line next/no-img-element */}
                        <img src={piece.previewUrl} alt="" />
                        <div>
                          <h4>{piece.name}</h4>
                          <p>
                            {money(piece.price)}
                            {piece.sizes.length
                              ? ` · ${piece.sizes.join(', ')}`
                              : ' · tamanho único/não informado'}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover ${piece.name} do drop`}
                          onClick={() => removeDropPiece(piece.key)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </article>
                    ))}
                  </div>

                  <details
                    className="store-drop-piece-form"
                    open={!dropPieces.length}
                  >
                    <summary>
                      <PackagePlus size={18} /> Adicionar peça ao drop
                    </summary>
                    <form key={dropPieceFormKey} onSubmit={addDropPiece}>
                      <ProductFields
                        sizes={dropSizes}
                        onSizesChange={setDropSizes}
                        includeAvailability={false}
                      />
                      <button
                        className="store-button"
                        type="submit"
                        disabled={busy}
                      >
                        <Plus size={18} /> Incluir peça no drop
                      </button>
                    </form>
                  </details>
                </div>

                <aside className="store-drop-preview">
                  <p className="store-kicker">PRÉVIA DO LANÇAMENTO</p>
                  <h3>{dropName.trim() || 'NOME DO DROP'}</h3>
                  <DropCountdown target={countdownTarget(launchesAt)} />
                  <p>
                    <Clock3 size={15} /> {dropPieces.length} peça
                    {dropPieces.length === 1 ? '' : 's'} será
                    {dropPieces.length === 1 ? '' : 'ão'} publicada
                    {dropPieces.length === 1 ? '' : 's'}.
                  </p>
                  <button
                    type="button"
                    className="store-button"
                    disabled={busy}
                    onClick={scheduleDrop}
                  >
                    <CalendarPlus size={18} />
                    {uploading ? 'Preparando peças…' : 'Agendar lançamento'}
                  </button>
                </aside>
              </div>
              {error && (
                <p role="alert" className="store-error">
                  {error}
                </p>
              )}
            </section>
          )}

          {editing && (
            <section
              ref={editor}
              className="store-glass store-editor"
              aria-label={product ? 'Editar produto' : 'Nova peça'}
            >
              <div className="store-editor-header">
                <h2>{product ? 'Editar produto' : 'Nova peça'}</h2>
                <button
                  type="button"
                  className="store-icon-button"
                  aria-label="Fechar edição"
                  disabled={busy}
                  onClick={closeEditor}
                >
                  <X />
                </button>
              </div>
              <form key={product?.id || 'new'} onSubmit={save}>
                <fieldset disabled={busy}>
                  <ProductFields
                    product={product}
                    sizes={productSizes}
                    onSizesChange={setProductSizes}
                  />
                  <button
                    className="store-button"
                    type="submit"
                    disabled={busy}
                  >
                    {uploading
                      ? 'Enviando foto…'
                      : busy
                        ? 'Salvando…'
                        : 'Salvar produto'}
                    <Check size={18} />
                  </button>
                  {error && (
                    <p role="alert" className="store-error">
                      {error}
                    </p>
                  )}
                </fieldset>
              </form>
            </section>
          )}

          {!!scheduledDrops.length && (
            <section
              className="store-scheduled-drops"
              aria-labelledby="scheduled-drops-title"
            >
              <div className="store-drop-section-heading">
                <h2 id="scheduled-drops-title">DROPS AGENDADOS</h2>
                <span>{String(scheduledDrops.length).padStart(2, '0')}</span>
              </div>
              {scheduledDrops.map((drop) => (
                <article key={drop.id}>
                  <div>
                    <span className="store-drop-status">AGENDADO</span>
                    <time dateTime={drop.launchesAt}>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(drop.launchesAt))}
                    </time>
                    <h3>{drop.name}</h3>
                    <p>
                      {drop.productCount} peça
                      {drop.productCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <DropCountdown
                    target={drop.launchesAt}
                    compact
                    onComplete={() => setRevision((value) => value + 1)}
                  />
                  <button
                    type="button"
                    className="store-button store-button-secondary"
                    disabled={busy}
                    onClick={() => cancelScheduledDrop(drop)}
                  >
                    Cancelar drop
                  </button>
                </article>
              ))}
            </section>
          )}

          {deleting && (
            <section
              role="alertdialog"
              aria-labelledby="remove-product-title"
              className="store-glass store-confirm"
            >
              <h2 id="remove-product-title">
                Retirar {deleting.name} da vitrine?
              </h2>
              <p>
                A peça ficará inativa e poderá ser publicada novamente pela
                edição.
              </p>
              <div>
                <button
                  className="store-button"
                  disabled={busy}
                  onClick={remove}
                >
                  {busy ? 'Retirando…' : 'Retirar produto'}
                </button>
                <button
                  className="store-button store-button-secondary"
                  disabled={busy}
                  onClick={() => setDeleting(null)}
                >
                  Cancelar
                </button>
              </div>
            </section>
          )}

          {!catalog ? (
            <StoreNotice>Carregando produtos…</StoreNotice>
          ) : !catalog.items.length ? (
            <StoreNotice>
              Nenhum produto cadastrado. Adicione a primeira peça para abrir a
              vitrine.
            </StoreNotice>
          ) : (
            <div className="store-admin-list">
              {catalog.items.map((item) => (
                <article key={item.id} className="store-admin-row">
                  <div className="store-admin-thumb">
                    <ProductImage product={item} />
                  </div>
                  <div>
                    <h2>{item.name}</h2>
                    <p>
                      {money(item.price)} ·{' '}
                      {item.dropId &&
                      scheduledDrops.some((drop) => drop.id === item.dropId)
                        ? 'Agendado para o drop'
                        : item.active
                          ? 'Na vitrine'
                          : 'Inativo'}
                      {item.sizes.length ? ` · ${item.sizes.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="store-admin-actions">
                    <button
                      className="store-admin-edit"
                      disabled={busy}
                      aria-label={`Editar ${item.name}`}
                      onClick={(event) => {
                        editorTrigger.current = event.currentTarget;
                        setDropOpen(false);
                        setEditing(item);
                        setProductSizes(item.sizes);
                        setError('');
                      }}
                    >
                      <Pencil size={16} aria-hidden="true" /> Editar
                    </button>
                    <button
                      className="store-icon-button"
                      aria-label={`Retirar ${item.name}`}
                      disabled={busy || !item.active}
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {catalog && catalog.totalPages > 1 && (
            <nav className="store-pagination" aria-label="Páginas de produtos">
              <button
                disabled={!page}
                onClick={() => setPage((value) => value - 1)}
              >
                Anterior
              </button>
              <span>
                {page + 1}/{catalog.totalPages}
              </span>
              <button
                disabled={page + 1 >= catalog.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      )}
      {!user && error && (
        <p role="alert" className="store-error">
          {error}
        </p>
      )}
    </StoreFrame>
  );
}
