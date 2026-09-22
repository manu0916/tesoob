import { StoreAdmin } from '@/components/store-admin';
export const metadata = {
  title: 'Gestão da vitrine — Tesoob',
  description: 'Área privada de gestão dos produtos da vitrine Tesoob.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default function ProductsAdminPage() {
  return <StoreAdmin />;
}
