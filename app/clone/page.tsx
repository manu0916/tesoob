import type { Metadata } from 'next';
import { HomePage } from '@/components/tesoob';
import { getCloneSettings } from '@/lib/clone-settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Tesoob — O comum ficou para trás.',
  description:
    'Peças exclusivas, recortes e atitude. Conheça o universo da Tesoob e fale diretamente pelo WhatsApp.',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function ClonePage() {
  const settings = await getCloneSettings();
  return <HomePage cloneWhatsAppNumber={settings?.whatsappNumber ?? null} />;
}
