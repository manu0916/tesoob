import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LookPage } from '@/components/tesoob';
import { findLook, looks, photo } from '@/lib/catalog';
import { absoluteUrl } from '@/lib/site-config';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return looks.map((look) => ({ slug: look.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const look = findLook(slug);
  if (!look) return { title: 'Referência não encontrada — Tesoob' };
  const title = `${look.name} — Tesoob`;
  const image = absoluteUrl(`/media/${photo(look.cover).src}`);
  const url = absoluteUrl(`/pecas/${look.slug}`);
  return {
    title,
    description: look.description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description: look.description,
      url,
      type: 'website',
      images: image ? [{ url: image, alt: look.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: look.description,
      images: image ? [image] : [],
    },
  };
}
export default async function ReferencePage({ params }: Props) {
  const { slug } = await params;
  const look = findLook(slug);
  if (!look) notFound();
  return <LookPage key={look.slug} look={look} />;
}
