import { swResponse } from '@/lib/restaurantes/pwa';
import { TOSTICHELAS } from '@/lib/restaurantes/tostichelas';

export const dynamic = 'force-static';

/** Service worker de Tostichelas (alcance /tostichelas/). La lógica vive en `lib/restaurantes/pwa.ts`. */
export function GET() {
  return swResponse(TOSTICHELAS);
}
