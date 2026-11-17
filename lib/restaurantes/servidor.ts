/**
 * Configuración de SERVIDOR por restaurante (nada de esto viaja al navegador).
 * Un restaurante nuevo = una entrada aquí + una config de cliente en `lib/restaurantes/<slug>.ts`.
 *
 * Reglas que NO cambian para Tostichelas (para que siga funcionando igual):
 *  - colecciones `demo_tostichelas_*`, sal de PIN `tostichelas:` y secreto `tostichelas-v2:`.
 *  - variables de entorno `TOSTICHELAS_*`.
 */
import type { Rol } from './tipos';

export type TenantSeed = {
  key: string;
  nombre: string;
  /** Ruta pública del logo (se completa con NEXT_PUBLIC_SITE_URL). */
  logo: string;
  colorPrimario: string;
  colorAcento: string;
  plan: string;
  isDemo: boolean;
  origen: string;
  recompensa: { modelo: 'cashback' | 'sellos' | 'puntos'; parametro: number };
  rewardMeta: number;
  giro: string;
  whatsapp?: string;
};

export type ServidorConfig = {
  slug: string;
  nombre: string;
  /** Prefijo de colecciones de Mongo: `${prefijo}_estado`, `_imagenes`, `_intentos`. */
  prefijo: string;
  /** Prefijo de variables de entorno: `${ENV}_PIN_DUENO`, `${ENV}_SECRET`, `${ENV}_PRODUCCION`. */
  env: string;
  /** Sal del secreto HMAC (sesiones y tokens de mesa). */
  salSecreto: string;
  /** Sal del hash de PIN guardado. */
  salPin: string;
  /** PIN que se usa mientras el dueño no los cambie (y no haya variable de entorno). */
  pinesIniciales: Record<Rol, string>;
  /** Variables legacy aceptadas para el PIN del dueño. */
  envLegacyDueno?: string[];
  /** true = nunca arranca en modo demo (sin datos de ejemplo). */
  produccionPorDefecto: boolean;
  tenant: TenantSeed;
  /** Ajustes públicos extra que cualquier cliente puede leer (además de los base). */
  ajustesPublicos?: string[];
};

export const SERVIDOR: Record<string, ServidorConfig> = {
  tostichelas: {
    slug: 'tostichelas',
    nombre: 'Tostichelas',
    prefijo: 'demo_tostichelas',
    env: 'TOSTICHELAS',
    salSecreto: 'tostichelas-v2:',
    salPin: 'tostichelas:',
    pinesIniciales: { dueno: '2222', caja: '1111', mesero: '3333', cocina: '4444' },
    envLegacyDueno: ['TOSTICHELAS_DUENO_PIN'],
    produccionPorDefecto: false,
    tenant: {
      key: 'tostichelas',
      nombre: 'Tostichelas',
      logo: '/tostichelas/logo.jpg',
      colorPrimario: '#E2573A',
      colorAcento: '#F2C14E',
      plan: 'restaurante',
      isDemo: false,
      origen: 'demo-restaurante',
      recompensa: { modelo: 'cashback', parametro: 5 },
      rewardMeta: 10,
      giro: 'restaurante',
    },
    ajustesPublicos: ['xAguacate', 'xDoble', 'xQueso', 'xSalsa'],
  },
  arwings: {
    slug: 'arwings',
    nombre: 'ARWINGS',
    prefijo: 'rest_arwings',
    env: 'ARWINGS',
    salSecreto: 'arwings-v1:',
    salPin: 'arwings:',
    // Públicos en el repo: el sistema obliga a cambiarlos en el primer ingreso (aviso en Ajustes).
    pinesIniciales: { dueno: '7070', caja: '7171', mesero: '7272', cocina: '7373' },
    produccionPorDefecto: true,
    tenant: {
      key: 'arwings',
      nombre: 'ARWINGS',
      logo: '/arwings/logo.jpg',
      colorPrimario: '#FF7000',
      colorAcento: '#E32216',
      plan: 'produccion',
      isDemo: false,
      origen: 'restaurante-agentia',
      // Sellos/cashback: el dueño lo define en Lealtad y QR. Se arranca en cashback 5% (editable).
      recompensa: { modelo: 'cashback', parametro: 5 },
      rewardMeta: 10,
      giro: 'restaurante',
      whatsapp: '525561159340',
    },
    ajustesPublicos: ['dosSabores'],
  },
};

export function servidorDe(slug: string): ServidorConfig | null {
  return Object.prototype.hasOwnProperty.call(SERVIDOR, slug) ? SERVIDOR[slug] : null;
}

export const colEstado = (c: ServidorConfig) => `${c.prefijo}_estado`;
export const colImagenes = (c: ServidorConfig) => `${c.prefijo}_imagenes`;
export const colIntentos = (c: ServidorConfig) => `${c.prefijo}_intentos`;
