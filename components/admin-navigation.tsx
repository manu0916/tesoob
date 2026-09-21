import { ArrowUpRight, Layers2, MessageSquare, Plus } from 'lucide-react';
import { SiteLink as Link } from '@/components/site-link';

export function AdminNavigation({ current }: { current: 'orders' | 'products' }) {
  return (
    <nav className="admin-workspace-nav" aria-label="Áreas do administrador">
      <div>
        <Link href="/admin" aria-current={current === 'orders' ? 'page' : undefined}>
          <MessageSquare size={16} aria-hidden="true" /> Encomendas
        </Link>
        <Link href="/admin/produtos" aria-current={current === 'products' ? 'page' : undefined}>
          <Layers2 size={16} aria-hidden="true" /> Vitrine
        </Link>
      </div>
      <Link href="/loja" className="admin-preview-link">
        Ver vitrine <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </nav>
  );
}

export function AdminStoreAccess() {
  return (
    <section className="admin-store-access" aria-labelledby="admin-store-title">
      <div className="admin-store-copy">
        <p className="eyebrow">CATÁLOGO / PEÇAS À VENDA</p>
        <h2 id="admin-store-title">SUA VITRINE.</h2>
        <p>Cuide das fotos, dos preços e das peças que estão no ar.</p>
      </div>
      <div className="admin-store-controls">
        <Link href="/admin/produtos" className="admin-store-manage">
          Gerenciar peças <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
        <Link href="/admin/produtos?novo=1" className="admin-store-add">
          <Plus size={18} aria-hidden="true" /> Adicionar peça
        </Link>
      </div>
    </section>
  );
}
