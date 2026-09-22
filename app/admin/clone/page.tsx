import type { Metadata } from 'next';
import { CloneAdmin } from '@/components/clone-admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Configuração do clone — Tesoob',
  description: 'Painel privado para configurar o contato do clone Tesoob.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function CloneAdminPage() {
  return <CloneAdmin />;
}
