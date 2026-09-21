import { StoreAccount } from '@/components/store-account';
export const metadata = {
  title: 'Minha conta — Tesoob',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default function AccountPage() {
  return <StoreAccount />;
}
