/** Compatibilidad: PIN de Tostichelas. La lógica genérica vive en `lib/restaurantes/pins.ts`. */
import { crearPins, ROLES_PIN, type Rol } from '@/lib/restaurantes/pins';
import { SERVIDOR } from '@/lib/restaurantes/servidor';

export { ROLES_PIN };
export type { Rol };

const p = crearPins(SERVIDOR.tostichelas);
export const pinOk = p.pinOk;
export const pinPorDefecto = p.pinPorDefecto;
export const cambiarPin = p.cambiarPin;
