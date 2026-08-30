import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masa Madre | Tarjeta de lealtad digital',
  description:
    'Demo de programa de lealtad para restaurantes: puntos por consumo, canjes y panel de gestión integrado con WhatsApp.',
  openGraph: {
    title: 'Tarjeta de lealtad digital — Masa Madre',
    description: 'Acumula puntos, canjea premios y gestiona clientes desde WhatsApp.',
    url: 'https://agentia.software/demos/lealtad',
  },
};

export { default } from './LealtadDemo';
