'use client';
import { useRef } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
export function MagneticStoreCTA() {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <Link
      href="/loja"
      ref={ref}
      className="store-magnetic"
      onPointerMove={(event) => {
        if (
          event.pointerType !== 'mouse' ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
          return;
        const bounds = event.currentTarget.getBoundingClientRect();
        ref.current?.style.setProperty(
          '--magnet-x',
          `${(event.clientX - bounds.left - bounds.width / 2) * 0.09}px`,
        );
        ref.current?.style.setProperty(
          '--magnet-y',
          `${(event.clientY - bounds.top - bounds.height / 2) * 0.13}px`,
        );
      }}
      onPointerLeave={() => {
        ref.current?.style.setProperty('--magnet-x', '0px');
        ref.current?.style.setProperty('--magnet-y', '0px');
      }}
    >
      <ShoppingBag size={19} />
      <span>
        Entrar na vitrine <small>Encontre sua próxima peça</small>
      </span>
      <ArrowUpRight size={25} />
    </Link>
  );
}
