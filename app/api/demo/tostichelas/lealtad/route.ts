/** Lealtad de Tostichelas. La lógica vive en `lib/restaurantes/api-lealtad.ts` (una por restaurante). */
import { crearLealtadApi } from '@/lib/restaurantes/api-lealtad';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export const dynamic = 'force-dynamic';

const api = crearLealtadApi(SERVIDOR.tostichelas);
export const GET = api.GET;
export const POST = api.POST;
