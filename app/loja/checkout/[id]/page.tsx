import { StoreCheckout } from '@/components/store-checkout';
export const metadata = {
  title: 'Checkout — Tesoob',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StoreCheckout id={id} />;
}
