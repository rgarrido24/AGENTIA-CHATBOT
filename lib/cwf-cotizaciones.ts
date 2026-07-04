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
};

export const PRECIO_DEFAULT_GALON = 1050;
export const PRECIO_DEFAULT_CUBETA = 4600;

export function precioDefaultPorPresentacion(p: CotizacionPresentacion): number {
  return p === 'Cubeta 19L' ? PRECIO_DEFAULT_CUBETA : PRECIO_DEFAULT_GALON;
}

export function normalizeWhatsapp52(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('52') && d.length >= 12) return d;
  if (d.length === 10) return `52${d}`;
  return d;
}
