import type { Metadata } from 'next';
import { IZZI_LOGO_URL } from '@/lib/izzi-brand';

const SITE = 'https://agentia.software';

export function buildIzziMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      locale: 'es_MX',
      type: 'website',
      images: [
        {
          url: IZZI_LOGO_URL,
          width: 1200,
          height: 630,
          alt: 'izzi — Internet en Mérida',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
      images: [IZZI_LOGO_URL],
    },
    robots: { index: true, follow: true },
  };
}
