import { manifestCliente } from '@/lib/restaurantes/pwa';
import { TOSTICHELAS } from '@/lib/restaurantes/tostichelas';

export const dynamic = 'force-static';

/** App para clientes: menú, pedir desde la mesa y tarjeta de lealtad. */
export function GET() {
  return manifestCliente(TOSTICHELAS);
}
