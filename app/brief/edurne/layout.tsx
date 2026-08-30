import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Brief de landing · Edurne × Agentia',
  description: 'Formulario de brief para diseñar tu landing page',
  robots: { index: false, follow: false },
};

export default function EdurneBriefLayout({ children }: { children: ReactNode }) {
  return children;
}
