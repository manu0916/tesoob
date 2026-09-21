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
} from 'lucide-react';
import { StoreFrame, StoreNotice, ProductImage } from '@/components/storefront';
import { AdminNavigation } from '@/components/admin-navigation';
import { ProductImageInput } from '@/components/product-image-input';
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
} from '@/lib/store-api';

export function StoreAdmin() {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ProductPage | null>(null);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
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
    const openNew = new URLSearchParams(window.location.search).get('novo') === '1';
    storeApi<StoreUser>('/auth/me', { signal: controller.signal })
      .then((account) => {
        if (controller.signal.aborted) return;
        setUser(account);
        if (account.role === 'ADMIN' && openNew) {
          setEditing('new');
          window.history.replaceState(null, '', '/admin/produtos');
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
    editor.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
  }, [editing, loading]);
  function closeEditor() {
    setEditing(null);
    editorTrigger.current?.focus();
  }
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const controller = new AbortController();
    storeApi<ProductPage>(`/admin/products?page=${page}`, {
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
  }, [user, page, revision]);
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving.current) return;
    const data = new FormData(event.currentTarget);
    const file = event.currentTarget.querySelector<HTMLInputElement>('input[name="imageFile"]')?.files?.[0];
    saving.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      let imageUrl = editing === 'new' ? '' : editing.imageUrl;
      if (file) {
        if (lastUpload.current?.file === file) imageUrl = lastUpload.current.url;
        else {
          setUploading(true);
          const blob = await prepareProductImage(file);
          const uploaded = await storeApi<{ imageUrl: string }>('/admin/images', {
            method: 'POST', body: blob, headers: { 'Content-Type': 'image/webp' },
          });
          imageUrl = uploaded.imageUrl;
          lastUpload.current = { file, url: imageUrl };
          setUploading(false);
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
            active: data.get('active') === 'on',
            version: editing === 'new' ? 0 : editing.version,
          }),
        },
      );
      setEditing(null);
      lastUpload.current = null;
      setNotice('Produto salvo. A vitrine já usa os novos dados.');
      setRevision((n) => n + 1);
    } catch (e) {
      setError(storeMessage(e));
    } finally {
      saving.current = false;
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
        { method: 'DELETE' },
      );
      setDeleting(null);
      setNotice(
        'Produto retirado da vitrine. Os pedidos anteriores foram preservados.',
      );
      setRevision((n) => n + 1);
    } catch (e) {
      setError(storeMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const product = editing && editing !== 'new' ? editing : null;
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
          <button
            disabled={busy}
            onClick={(event) => {
              editorTrigger.current = event.currentTarget;
              setEditing('new');
              setError('');
              setNotice('');
            }}
            className="store-button"
          >
            <Plus size={18} /> Novo produto
          </button>
        )}
      </header>
      {loading ? (
        <StoreNotice>Verificando acesso…</StoreNotice>
      ) : !user ? (
        <StoreNotice>
          <Link
            className="store-button"
            href={createRequested ? '/loja/conta?next=%2Fadmin%2Fprodutos%3Fnovo%3D1' : '/loja/conta?next=%2Fadmin%2Fprodutos'}
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
          {error && !editing && (
            <div role="alert" className="store-error">
              <p>{error}</p>
              <button
                type="button"
                className="store-text-link"
                onClick={() => {
                  setEditing(null);
                  setRevision((n) => n + 1);
                }}
              >
                Recarregar produtos
              </button>
            </div>
          )}
          {editing && (
            <section ref={editor} className="store-glass store-editor" aria-label={product ? 'Editar produto' : 'Nova peça'}>
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
                    Em branco? Nenhuma caixa ou título de observação será
                    exibido na vitrine.
                  </p>
                  <label className="store-checkbox">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={product?.active ?? true}
                    />{' '}
                    Exibir na vitrine
                  </label>
                  <button
                    className="store-button"
                    type="submit"
                    disabled={busy}
                  >
                    {uploading ? 'Enviando foto…' : busy ? 'Salvando…' : 'Salvar produto'}
                    <Check size={18} />
                  </button>
                  {error && <p role="alert" className="store-error">{error}</p>}
                </fieldset>
              </form>
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
                      {item.active ? 'Na vitrine' : 'Inativo'}
                    </p>
                  </div>
                  <div className="store-admin-actions">
                    <button
                      className="store-admin-edit"
                      disabled={busy}
                      aria-label={`Editar ${item.name}`}
                      onClick={(event) => {
                        editorTrigger.current = event.currentTarget;
                        setEditing(item);
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
              <button disabled={!page} onClick={() => setPage((n) => n - 1)}>
                Anterior
              </button>
              <span>
                {page + 1}/{catalog.totalPages}
              </span>
              <button
                disabled={page + 1 >= catalog.totalPages}
                onClick={() => setPage((n) => n + 1)}
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
