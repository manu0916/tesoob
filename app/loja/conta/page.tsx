import { StoreAccount } from '@/components/store-account';
export const metadata = {
  title: 'Minha conta — Tesoob',
  description:
    'Acesse sua conta Tesoob para acompanhar pedidos e guardar suas escolhas.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default function AccountPage() {
  return <StoreAccount />;
}
