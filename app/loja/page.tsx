import { Storefront } from '@/components/storefront';
export const metadata = {
  title: 'Vitrine — Tesoob',
  description:
    'Conheça a vitrine Tesoob: peças autorais exclusivas, com detalhes, preços e disponibilidade.',
  alternates: { canonical: '/loja' },
};
export default function StorePage() {
  return <Storefront />;
}
