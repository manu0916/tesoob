import { siteConfig } from '@/lib/site-config';
import { HomePage } from '@/components/tesoob';

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export default function Home() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: siteConfig.name,
    url: siteConfig.publicOrigin,
    email: siteConfig.email,
    sameAs: [siteConfig.instagram],
    description:
      'Marca autoral brasileira de peças exclusivas, sediada em Campos Gerais, Minas Gerais, com envio para todo o Brasil.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Campos Gerais',
      addressRegion: 'MG',
      addressCountry: 'BR',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Brasil',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: siteConfig.email,
      availableLanguage: 'Portuguese',
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organization) }}
      />
      <HomePage />
    </>
  );
}
