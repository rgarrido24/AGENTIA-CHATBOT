/**
 * cloudinary-anuario.ts
 *
 * Generador de URLs de collage para anuario Kinder usando la API de
 * transformaciones de Cloudinary (Overlays con `l_fetch:`).
 *
 * Estrategia: la plantilla base (vacía, con banderines, decoraciones, etc.)
 * se sube una sola vez a Cloudinary. Cuando llega un nuevo grupo escolar,
 * sólo necesitamos construir una URL de transformación que ponga encima
 * las fotos del salón en coordenadas predefinidas — sin generar imágenes
 * en nuestro servidor.
 *
 * Estructura de URL Cloudinary:
 *
 *   https://res.cloudinary.com/{cloud}/image/upload/
 *     l_fetch:{base64_url_foto1},w_400,h_300,c_fill,g_north_west,x_60,y_240/
 *     l_fetch:{base64_url_foto2},w_300,h_400,c_fill,g_north_west,x_490,y_240/
 *     l_fetch:{base64_url_circ1},w_90,h_90,c_fill,g_face,r_max,g_north_west,x_60,y_700/
 *     ...
 *     {public_id_plantilla_base}.png
 *
 * Coordenadas calibradas para una plantilla base de 800×1132 px (≈ A4 a 96dpi).
 * Ajustar `TEMPLATE_WIDTH` / `TEMPLATE_HEIGHT` si la plantilla se sube a otra
 * resolución.
 *
 * Variables de entorno requeridas:
 *   CLOUDINARY_CLOUD_NAME — nombre del cloud (ej: "agentia")
 *   CLOUDINARY_TEMPLATE_PUBLIC_ID — public_id de la plantilla base subida
 *     (ej: "anuarios/kinder/plantilla-base-2026")
 */

/** Resolución de referencia de la plantilla base (en px). */
export const TEMPLATE_WIDTH = 800;
export const TEMPLATE_HEIGHT = 1132;

/** Coordenadas calibradas (X, Y de la esquina superior izquierda). */
export interface SlotCoords {
  /** ancho del overlay en px (sobre la base de 800×1132) */
  width: number;
  /** alto del overlay en px */
  height: number;
  /** offset X desde la esquina superior izquierda de la plantilla */
  x: number;
  /** offset Y desde la esquina superior izquierda */
  y: number;
  /** si es true se renderiza como círculo (radius max + face gravity) */
  circle?: boolean;
}

/** Mapa completo de coordenadas para una plantilla Kinder A4 vertical. */
export const ANUARIO_KINDER_LAYOUT = {
  // Foto Grupal (izquierda, ratio 4:3) — ocupa casi el ancho completo de la columna izquierda
  fotoGrupal: { width: 420, height: 315, x: 50, y: 240 } as SlotCoords,

  // Retrato Individual con Toga (derecha, ratio 3:4)
  fotoToga: { width: 270, height: 360, x: 490, y: 240 } as SlotCoords,

  // 14 círculos en grid 7×2 abajo
  circulos: buildCirclesGrid({
    rows: 2,
    cols: 7,
    diameter: 90,
    gap: 10,
    startY: 680,
    canvasWidth: TEMPLATE_WIDTH,
    padX: 50,
  }),
} as const;

function buildCirclesGrid(opts: {
  rows: number;
  cols: number;
  diameter: number;
  gap: number;
  startY: number;
  canvasWidth: number;
  padX: number;
}): SlotCoords[] {
  const { rows, cols, diameter, gap, startY, canvasWidth, padX } = opts;
  const totalWidth = cols * diameter + (cols - 1) * gap;
  const startX = Math.max(padX, Math.round((canvasWidth - totalWidth) / 2));
  const slots: SlotCoords[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        width: diameter,
        height: diameter,
        x: startX + c * (diameter + gap),
        y: startY + r * (diameter + gap),
        circle: true,
      });
    }
  }
  return slots;
}

/** Datos del salón que se pintan sobre la plantilla. */
export interface AlumnoFoto {
  /** Nombre del alumno (sólo para debug/logs). */
  nombre?: string;
  /** URL pública de la foto individual con toga (retrato vertical). */
  fotoToga?: string;
  /** URLs de fotos rápidas (1..N). Sobran si N > 14. */
  fotoRapida?: string;
}

export interface GenerarCollageInput {
  /** URL pública de la foto grupal (formal o divertida). */
  fotoGrupal: string;
  /** URL pública del retrato individual con toga (alumno destacado). */
  fotoTogaPrincipal: string;
  /**
   * Alumnos del salón — sus `fotoRapida` se usan para los 14 círculos.
   * Si hay menos de 14 alumnos, los círculos sobrantes quedan sin overlay
   * (mostrarán la plantilla base con su placeholder).
   */
  alumnos: AlumnoFoto[];
  /** Override de cloud_name (default: process.env.CLOUDINARY_CLOUD_NAME). */
  cloudName?: string;
  /** Override del public_id de la plantilla base. */
  templatePublicId?: string;
}

/**
 * Codifica una URL para usarla dentro de `l_fetch:` de Cloudinary.
 * Cloudinary acepta dos formatos:
 *   - URL en base64 url-safe (recomendado por estabilidad con caracteres
 *     especiales)
 *   - URL plain encoded (más cortos, pero algunos chars rompen el parser)
 *
 * Usamos base64 url-safe (RFC 4648 §5): `+` → `-`, `/` → `_`, sin padding.
 */
function encodeUrlForFetch(url: string): string {
  // Compatible tanto con Node como con browsers modernos
  const b64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(url, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(url)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Construye un segmento de transformación Cloudinary para un overlay.
 * Cada slice se concatena con `/` en la URL final.
 */
function buildOverlaySegment(slot: SlotCoords, fotoUrl: string): string {
  const encoded = encodeUrlForFetch(fotoUrl);
  const parts: string[] = [];
  parts.push(`l_fetch:${encoded}`);
  parts.push(`w_${slot.width}`);
  parts.push(`h_${slot.height}`);
  parts.push(`c_fill`);
  // Para círculos: face gravity (centra la cara) + radius max
  if (slot.circle) {
    parts.push(`g_face`);
    parts.push(`r_max`);
  }
  // Posicionamiento: g_north_west fija el origen en la esquina superior izquierda
  // (luego x/y son offsets en px positivos hacia adentro)
  parts.push(`fl_layer_apply`);
  parts.push(`g_north_west`);
  parts.push(`x_${slot.x}`);
  parts.push(`y_${slot.y}`);
  return parts.join(',');
}

/**
 * Genera la URL final de Cloudinary con todos los overlays aplicados sobre
 * la plantilla base.
 *
 * Ejemplo de output:
 *   https://res.cloudinary.com/agentia/image/upload/
 *     w_800,h_1132,c_fill/
 *     l_fetch:aHR0cHM6L...,w_420,h_315,c_fill,fl_layer_apply,g_north_west,x_50,y_240/
 *     ...resto de overlays.../
 *     anuarios/kinder/plantilla-base-2026.png
 */
export function generarCollageAnuario(input: GenerarCollageInput): string {
  const cloudName = input.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
  const templateId =
    input.templatePublicId || process.env.CLOUDINARY_TEMPLATE_PUBLIC_ID || 'anuarios/kinder/plantilla-base';

  if (!cloudName) {
    throw new Error(
      'Cloudinary cloud_name no configurado. Definí CLOUDINARY_CLOUD_NAME en .env o pasalo como cloudName.',
    );
  }

  const segments: string[] = [];

  // 1) Fija la resolución de la plantilla base (por si el origen es distinto)
  segments.push(`w_${TEMPLATE_WIDTH},h_${TEMPLATE_HEIGHT},c_fill`);

  // 2) Foto grupal
  if (input.fotoGrupal) {
    segments.push(buildOverlaySegment(ANUARIO_KINDER_LAYOUT.fotoGrupal, input.fotoGrupal));
  }

  // 3) Foto Individual Toga
  if (input.fotoTogaPrincipal) {
    segments.push(buildOverlaySegment(ANUARIO_KINDER_LAYOUT.fotoToga, input.fotoTogaPrincipal));
  }

  // 4) Hasta 14 círculos individuales rápidos
  const circulos = ANUARIO_KINDER_LAYOUT.circulos;
  for (let i = 0; i < Math.min(circulos.length, input.alumnos.length); i++) {
    const slot = circulos[i];
    const url = input.alumnos[i]?.fotoRapida;
    if (slot && url) segments.push(buildOverlaySegment(slot, url));
  }

  // 5) Quality + format optimizado al final, antes del public_id base
  segments.push('q_auto,f_auto');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${segments.join('/')}/${templateId}.png`;
}

/* ─────────────────────────────────────────────────────────────────
 *  EJEMPLO DE USO
 *  Descomentar y correr con: npx tsx lib/cloudinary-anuario.ts
 * ─────────────────────────────────────────────────────────────── */

if (require.main === module) {
  // Datos de muestra usando los placeholders IA del proyecto
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agentia.software';

  const url = generarCollageAnuario({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'agentia-demo',
    templatePublicId: 'anuarios/kinder/plantilla-base-2026',

    fotoGrupal: `${APP_URL}/assets/fotos-demo/anuario-muestra-3.png`,
    fotoTogaPrincipal: `${APP_URL}/assets/fotos-demo/hija-editada.jpg`,

    alumnos: [
      { nombre: 'Mateo García', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-clasico.png` },
      { nombre: 'Sofía Pérez', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-graduacion.png` },
      { nombre: 'Diego López', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-avion.png` },
      { nombre: 'Camila Ruiz', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-playa.png` },
      { nombre: 'Lucas Torres', fotoRapida: `${APP_URL}/assets/fotos-demo/hija-original.jpg` },
      { nombre: 'Valentina Cruz', fotoRapida: `${APP_URL}/assets/fotos-demo/hija-editada.jpg` },
      { nombre: 'Santiago Vega', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-clasico.png` },
      { nombre: 'Isabella Mora', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-graduacion.png` },
      { nombre: 'Sebastián Ríos', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-avion.png` },
      { nombre: 'Emma Castro', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-playa.png` },
      { nombre: 'Joaquín Herrera', fotoRapida: `${APP_URL}/assets/fotos-demo/hija-original.jpg` },
      { nombre: 'Renata Ortiz', fotoRapida: `${APP_URL}/assets/fotos-demo/hija-editada.jpg` },
      { nombre: 'Tomás Aguilar', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-clasico.png` },
      { nombre: 'Lucía Mendoza', fotoRapida: `${APP_URL}/assets/fotos-demo/alumno1-graduacion.png` },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('\n📸 URL de collage generada:\n');
  // eslint-disable-next-line no-console
  console.log(url);
  // eslint-disable-next-line no-console
  console.log('\nTotal alumnos en grid: 14 / 14');
}
