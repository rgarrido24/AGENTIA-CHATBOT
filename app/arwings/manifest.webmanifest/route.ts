import { manifestCliente } from '@/lib/restaurantes/pwa';
import { ARWINGS } from '@/lib/restaurantes/arwings';

export const dynamic = 'force-static';

export function GET() {
  return manifestCliente(ARWINGS);
}
