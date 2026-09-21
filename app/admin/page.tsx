import type { Metadata } from 'next';
import { AdminOrders } from '@/components/admin-orders';
import { SiteLink as Link } from '@/components/site-link';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Ateliê de encomendas — Tesoob',
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <><div className="store-admin-entry"><Link href="/admin/produtos">Gerenciar vitrine de vendas →</Link></div><AdminOrders /></>;
}
