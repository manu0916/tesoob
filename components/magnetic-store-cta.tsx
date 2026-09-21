'use client';
import { SiteLink as Link } from '@/components/site-link';
import { ArrowUpRight } from 'lucide-react';
export function MagneticStoreCTA() {
  return (
    <Link href="/loja" className="store-magnetic">
      <span>Ver vitrine</span>
      <ArrowUpRight size={28} strokeWidth={1.8} aria-hidden="true" />
    </Link>
  );
}
