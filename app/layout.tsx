import type { Metadata } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import './globals.css';
import './chat.css';
const title = 'Tesoob — O comum ficou para trás.';
const description =
  'Peças exclusivas, recortes e atitude. Conheça os looks e o universo da Tesoob e converse sobre sua encomenda.';
const previewImage = absoluteUrl('/media/social-card.jpg');
export const metadata: Metadata = {
  title,
  description,
  metadataBase: siteConfig.publicOrigin
    ? new URL(siteConfig.publicOrigin)
    : undefined,
  alternates: siteConfig.publicOrigin
    ? { canonical: siteConfig.publicOrigin }
    : undefined,
  openGraph: {
    title,
    description,
    siteName: 'Tesoob',
    locale: 'pt_BR',
    type: 'website',
    url: siteConfig.publicOrigin || undefined,
    images: previewImage
      ? [
          {
            url: previewImage,
            width: 1200,
            height: 630,
            alt: 'Tesoob — O comum ficou para trás. Editorial de looks vermelho e verde.',
          },
        ]
      : [],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: previewImage ? [previewImage] : [],
  },
  icons: { icon: '/media/favicon.png' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <div id="conteudo">{children}</div>
      </body>
    </html>
  );
}
