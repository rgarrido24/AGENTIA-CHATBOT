/** Tipos y utilidades de cotizaciones CWF — seguro para Client Components (sin MongoDB). */

export type CotizacionEstado = 'borrador' | 'enviada' | 'confirmada' | 'cancelada';

export type CotizacionPresentacion = 'Galón 3.79L' | 'Cubeta 19L';
export type CotizacionColor = 'Claro Natural' | 'Cedro' | 'Redwood';

export type CotizacionProducto = {
  producto: string;
  presentacion: CotizacionPresentacion;
  color: CotizacionColor;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

export type CotizacionCliente = {
  nombre: string;
  negocio: string;
  direccion: string;
  ciudad: string;
  cp: string;
  whatsapp: string;
  rfc: string;
};

export type CwfCotizacion = {
  _id?: string;
  folio: string;
  fecha: Date;
  cliente: CotizacionCliente;
  productos: CotizacionProducto[];
  subtotal: number;
  iva: number;
  envio: number;
  total: number;
  precioEspecialDistribuidor: boolean;
  estado: CotizacionEstado;
  notas: string;
  /** Link público temporal para WhatsApp (sin auth). */
  publicToken?: string;
  publicUrl?: string;
  publicExpiresAt?: Date | string;
};

/** Precios de lista con IVA incluido (lo que el usuario captura en el formulario). */
export const PRECIO_DEFAULT_GALON = 1218;
export const PRECIO_DEFAULT_CUBETA = 5336;

export const IVA_RATE = 0.16;
export const IVA_DIVISOR = 1 + IVA_RATE; // 1.16

export function precioDefaultPorPresentacion(p: CotizacionPresentacion): number {
  return p === 'Cubeta 19L' ? PRECIO_DEFAULT_CUBETA : PRECIO_DEFAULT_GALON;
}

/** Desglosa un monto con IVA incluido → base + IVA. */
export function desgloseIvaIncluido(montoConIva: number): { sinIva: number; iva: number } {
  const conIva = Math.max(0, Number(montoConIva) || 0);
  const sinIva = conIva / IVA_DIVISOR;
  const iva = conIva - sinIva;
  return { sinIva, iva };
}

/**
 * Totales de cotización cuando precioUnitario / subtotales de línea
 * ya vienen con IVA incluido.
 */
export function totalesDesdePreciosConIva(
  productos: Array<{ cantidad: number; precioUnitario: number }>,
  envio = 0,
): { productosConIva: number; subtotal: number; iva: number; total: number } {
  const productosConIva = productos.reduce(
    (s, p) => s + Math.max(0, p.cantidad) * Math.max(0, p.precioUnitario),
    0,
  );
  const { sinIva: subtotal, iva } = desgloseIvaIncluido(productosConIva);
  const envioN = Math.max(0, Number(envio) || 0);
  return {
    productosConIva,
    subtotal,
    iva,
    total: productosConIva + envioN,
  };
}

export function normalizeWhatsapp52(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('52') && d.length >= 12) return d;
  if (d.length === 10) return `52${d}`;
  return d;
}
