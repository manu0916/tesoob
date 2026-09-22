import type { Metadata } from 'next';
import { Check, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { SiteLink as Link } from '@/components/site-link';
import { StoreFrame } from '@/components/storefront';

export const metadata: Metadata = {
  title: 'Pedido registrado — Tesoob',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ pedido?: string }>;
}) {
  const { pedido } = await searchParams;
  const reference =
    pedido && /^[a-f0-9-]{36}$/i.test(pedido) ? pedido : null;

  return (
    <StoreFrame>
      <main className="store-thank-you">
        <div className="store-thank-you-mark">
          <Check size={28} />
          <span>PEDIDO REGISTRADO</span>
        </div>
        <p className="store-kicker">TESOOB / SUA ESCOLHA CHEGOU ATÉ AQUI</p>
        <h1>
          OBRIGADO
          <br />
          <em>POR ESCOLHER.</em>
        </h1>
        <p className="store-thank-you-copy">
          Seu pedido foi registrado sem cobrança. Em breve, os próximos passos
          serão combinados com você.
        </p>
        {reference && (
          <p className="store-thank-you-reference">
            Referência do pedido <strong>{reference}</strong>
          </p>
        )}
        <div className="store-thank-you-actions">
          <Link href="/loja/conta" className="store-button">
            Acompanhar pedidos <ArrowUpRight size={18} />
          </Link>
          <Link href="/loja" className="store-thank-you-link">
            <ShoppingBag size={17} /> Voltar à vitrine
          </Link>
        </div>
      </main>
    </StoreFrame>
  );
}