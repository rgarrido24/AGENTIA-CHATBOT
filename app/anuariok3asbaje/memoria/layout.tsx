import './memoria.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Memoria · Anuario Kinder',
  description: 'Experiencia cinematográfica del último año de kinder',
};

export default function MemoriaLayout({ children }: { children: ReactNode }) {
  return children;
}
