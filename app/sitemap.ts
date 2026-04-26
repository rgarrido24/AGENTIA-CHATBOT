import type { MetadataRoute } from 'next';

const BASE = 'https://agentia.software';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: BASE,                       lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/demo/barber`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/restaurante`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/spa`,         lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/nutricion`,   lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/dentista`,    lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/medico`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/taller`,      lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/demo/grooming`,    lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
