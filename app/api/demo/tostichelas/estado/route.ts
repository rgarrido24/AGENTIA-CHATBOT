/** Estado compartido de Tostichelas. La lógica vive en `lib/restaurantes/api-estado.ts` (una por restaurante). */
import { crearEstadoApi } from '@/lib/restaurantes/api-estado';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export const dynamic = 'force-dynamic';

const api = crearEstadoApi(SERVIDOR.tostichelas);
export const GET = api.GET;
export const POST = api.POST;
