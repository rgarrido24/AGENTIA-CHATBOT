import { manifestEquipo } from '@/lib/restaurantes/pwa';
import { TOSTICHELAS } from '@/lib/restaurantes/tostichelas';

export const dynamic = 'force-static';

/** App del equipo: mesero, cocina, barra, caja y dueño (cada perfil con su contraseña). */
export function GET() {
  return manifestEquipo(TOSTICHELAS);
}
