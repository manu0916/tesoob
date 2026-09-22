import type { Metadata } from 'next';
import { AdminOrders } from '@/components/admin-orders';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Ateliê de encomendas — Tesoob',
  description: 'Área privada de gestão de encomendas da Tesoob.',
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <AdminOrders />;
}
