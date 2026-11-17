'use client';

import RestauranteShell from '@/components/restaurante/RestauranteShell';
import { TOSTICHELAS } from '@/lib/restaurantes/tostichelas';

export default function TostichelasPage() {
  return <RestauranteShell cfg={TOSTICHELAS} />;
}
