import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteConfig.publicOrigin;
  return [
    { url: origin, changeFrequency: 'weekly', priority: 1 },
    { url: `${origin}/vitrine`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${origin}/privacidade`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${origin}/termos`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}