import { ProductDetail } from '@/components/storefront';
export const metadata = {
  title: 'Peça autoral — Tesoob',
  alternates: { canonical: null },
};
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}
