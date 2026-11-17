'use client';

import RestauranteShell from '@/components/restaurante/RestauranteShell';
import { ARWINGS } from '@/lib/restaurantes/arwings';

export default function ArwingsPage() {
  return <RestauranteShell cfg={ARWINGS} />;
}
