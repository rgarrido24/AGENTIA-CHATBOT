/** Compatibilidad: sesiones de Tostichelas. La lógica genérica vive en `lib/restaurantes/auth.ts`. */
import { crearAuth, puede, ipDe, type Perfil } from '@/lib/restaurantes/auth';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export type { Perfil };
export { puede, ipDe };

const a = crearAuth(SERVIDOR.tostichelas);
export const firmarToken = a.firmarToken;
export const perfilDeToken = a.perfilDeToken;
export const perfilDeRequest = a.perfilDeRequest;
export const tokenMesa = a.tokenMesa;
export const bloqueado = a.bloqueado;
export const registrarFallo = a.registrarFallo;
export const limpiarFallos = a.limpiarFallos;
