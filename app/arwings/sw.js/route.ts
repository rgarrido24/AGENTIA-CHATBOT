import { swResponse } from '@/lib/restaurantes/pwa';
import { ARWINGS } from '@/lib/restaurantes/arwings';

export const dynamic = 'force-static';

export function GET() {
  return swResponse(ARWINGS);
}
