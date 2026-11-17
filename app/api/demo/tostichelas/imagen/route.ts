/** Fotos del menú de Tostichelas. La lógica vive en `lib/restaurantes/api-imagen.ts` (una por restaurante). */
import { crearImagenApi } from '@/lib/restaurantes/api-imagen';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export const dynamic = 'force-dynamic';

const api = crearImagenApi(SERVIDOR.tostichelas, '/api/demo/tostichelas');
export const GET = api.GET;
export const POST = api.POST;
