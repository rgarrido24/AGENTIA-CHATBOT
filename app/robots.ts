import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo/'],
        disallow: ['/dashboard/', '/api/', '/admin/', '/n/', '/lealtad/gracias'],
      },
    ],
    sitemap: 'https://agentia.software/sitemap.xml',
  };
}
