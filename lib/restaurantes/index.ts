import type { RestauranteConfig } from './config';
import { TOSTICHELAS } from './tostichelas';
import { ARWINGS } from './arwings';

/** Registro de restaurantes (cliente). Para uno nuevo: crear su config y añadirla aquí. */
export const RESTAURANTES: Record<string, RestauranteConfig> = {
  tostichelas: TOSTICHELAS,
  arwings: ARWINGS,
};

export const restauranteDe = (slug: string): RestauranteConfig | null =>
  Object.prototype.hasOwnProperty.call(RESTAURANTES, slug) ? RESTAURANTES[slug] : null;
