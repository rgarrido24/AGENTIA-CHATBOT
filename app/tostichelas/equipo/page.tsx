'use client';

import RestauranteShell from '@/components/restaurante/RestauranteShell';
import { TOSTICHELAS } from '@/lib/restaurantes/tostichelas';

export default function TostichelasEquipoPage() {
  return <RestauranteShell cfg={TOSTICHELAS} staff />;
}
