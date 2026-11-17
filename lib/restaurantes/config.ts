/**
 * Configuración de CLIENTE de un restaurante: todo lo que cambia entre un restaurante y otro
 * (marca, colores, menú, mesas, textos, reglas de pago). El motor (`components/restaurante/engine.ts`)
 * no tiene ningún dato de un restaurante: lo lee todo de aquí.
 *
 * Lo secreto (PIN, secretos, colecciones) vive en `servidor.ts`.
 */
import type { Insumo, Mesa, Producto, Salsa } from './tipos';

export type DemoSeed = {
  /** PIN que se muestra en la demo (solo cuando no es producción). */
  pins: Record<string, string>;
  likes: Record<string, number>;
  rates: Record<string, [number, number]>;
  /** ts en minutos relativos a ahora (negativo = hace). */
  reviews: { pid: string; user: string; stars: number; text: string; v: boolean; ts: number }[];
  mermas: { hace: number; name: string; unit: string; diff: number; val: number }[];
  clientes: { tel: string; name: string; pts: number; visits: number; last: number }[];
  gastos: { id: string; cat: string; concepto: string; monto: number; freq: string }[];
  /** Productos que se reparten en las ventas de ejemplo del día. */
  pool: string[];
  /** Mesas ocupadas de ejemplo: [mesa, [[pid, variante, cantidad]...], minutos, estado]. */
  mesasOcupadas: [string, [string, number, number][], number, string][];
  /** Cuenta que ya pidió la cuenta de ejemplo. */
  mesaConCuenta?: string;
};

export type Armador = {
  /** Productos que se arman con salsa (ids). */
  productos: string[];
  kicker: string;
  titulo: string;
  paso1: string;
  paso2: string;
  paso3: string;
};

export type RestauranteConfig = {
  slug: string;
  /** `/tostichelas` */
  ruta: string;
  /** Base de las APIs del restaurante, sin slash final. */
  api: string;
  /** Prefijo de claves de localStorage. */
  lsPrefix: string;
  marca: {
    nombre: string;
    nombreMayus: string;
    tagline: string;
    descripcion: string;
    logo: string;
    logoAlt: string;
    logoW: number;
    logoH: number;
    mark: string;
    markAlt: string;
    markW: number;
    markH: number;
    icono192: string;
    icono512: string;
    iconoMaskable: string;
    iconoApple: string;
    /** Color de la barra del navegador y del manifest del cliente / del equipo. */
    themeColor: string;
    themeColorEquipo: string;
    fondoManifest: string;
    /** Clase CSS extra en la raíz (tema visual). Vacía = tema por defecto. */
    tema: string;
    /** Colores de los banners y QR impresos. Si falta, los de Tostichelas. */
    impresion?: { fondo: string; top: string; topTxt: string; tinta: string; pagina: string };
    /** Color del trazo de las ilustraciones de platillos. */
    trazo: string;
    splash: {
      lineas: string[];
      sub: string;
      boton: string;
      efecto: 'burbujas' | 'brasas';
      /** Frase comercial grande (opcional). */
      frase?: string;
      /** Imagen de portada distinta a `mark` (por ejemplo el logo completo). */
      img?: { src: string; w: number; h: number; alt: string };
    };
    /** Logo grande que reemplaza la franja de marca del menú del cliente (sin botón de instalar). */
    logoHero?: { src: string; w: number; h: number; alt: string };
  };
  textos: {
    buscar: string;
    /** Texto del botón de "pedir ahora" en el menú de consulta. */
    consulta: string;
    /** Ejemplo de premio en Ajustes ("tu chela gratis"). */
    premioEjemplo: string;
    /** Ejemplo en la ayuda de recetas del inventario. */
    ejemploReceta: string;
    /** Ejemplo de captura de una unidad en Recetas. */
    ejemploUnidad?: string;
    /** Dónde se pegan los QR de mesa ("en cada mesa"). */
    mesasTxt?: string;
  };
  /** WhatsApp del restaurante (pedidos a domicilio) y redes. */
  contacto?: {
    whatsapp: string;
    whatsappVista: string;
    facebook?: string;
    facebookUrl?: string;
    /** Encabezado del botón de domicilio. */
    domicilio: string;
  };
  /**
   * 'previo'  = el cliente paga antes (link de pago). Es lo de Tostichelas.
   * 'contraentrega' = el pedido a domicilio / para llevar entra "por aprobar" y se cobra al
   *                   entregar. No hay pago en línea simulado.
   */
  pago: 'previo' | 'contraentrega';
  /** true = nunca muestra datos de ejemplo. */
  produccion: boolean;
  demo?: DemoSeed;
  categorias: string[];
  colores: Record<string, string>;
  menu: Producto[];
  insumos: Insumo[];
  mesas: Mesa[];
  /** Mesa que se muestra por defecto en la simulación de la demo. */
  mesaInicial?: string;
  /** Maridaje: categoría -> categorías sugeridas. */
  maridaje: Record<string, string[]>;
  maridajeTxt: Record<string, string>;
  /** Botones rápidos de personalización por categoría ("Sin cebolla"…), separados por coma. */
  rapidas: Record<string, string>;
  /** Ajustes iniciales (sobre los base del motor). */
  ajustes?: Record<string, number | boolean | string | null>;
  /** Extras que el dueño enciende o apaga (ajuste `k`: -1 = no se ofrece, >=0 = precio por pieza). */
  extras?: { k: string; g: string; def: number; cats: string[]; mult?: number; salsa?: boolean; opciones?: string[] }[];
  /** Ilustraciones SVG por categoría (viewBox 64x64). Si falta, el motor usa las de Tostichelas. */
  arte?: Record<string, string>;
  /** Portada del menú: producto destacado, mosaico de categorías y combos. Si falta, no se muestra. */
  inicio?: { destacado: string; combos: [string, string, string][]; tituloCombos: string };
  /** Constructor de alitas/boneless con salsas y medidor de picor. */
  armador?: Armador;
  salsas?: Salsa[];
  /** Etiquetas que el dueño puede poner a un producto (Más vendido, Nuevo…). Si falta, no hay selector. */
  etiquetas?: string[];
  /** Acompañamientos sugeridos por producto (id -> ids). */
  pares?: Record<string, string[]>;
  /** Etiquetas de picor, de 1 a 5. */
  niveles?: string[];
};
