import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { renderCotizacionPdf } from '@/lib/cotizacion-pdf';
import {
  getNextCwfFolio,
  saveCwfCotizacion,
} from '@/lib/cwf-cotizaciones-db';
import type {
  CotizacionCliente,
  CotizacionColor,
  CotizacionEstado,
  CotizacionPresentacion,
  CotizacionProducto,
  CwfCotizacion,
} from '@/lib/cwf-cotizaciones';

export const dynamic = 'force-dynamic';

const PRESENTACIONES = new Set<CotizacionPresentacion>(['Galón 3.79L', 'Cubeta 19L']);
const COLORES = new Set<CotizacionColor>(['Claro Natural', 'Cedro', 'Redwood']);
const ESTADOS = new Set<CotizacionEstado>(['borrador', 'enviada', 'confirmada', 'cancelada']);

function parseCliente(raw: unknown): CotizacionCliente {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    nombre: String(o.nombre ?? '').trim(),
    negocio: String(o.negocio ?? '').trim(),
    direccion: String(o.direccion ?? '').trim(),
    ciudad: String(o.ciudad ?? '').trim(),
    cp: String(o.cp ?? '').trim(),
    whatsapp: String(o.whatsapp ?? '').trim(),
    rfc: String(o.rfc ?? '').trim(),
  };
}

function parseProductos(raw: unknown): CotizacionProducto[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      const o = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
      const presentacion = String(o.presentacion ?? '') as CotizacionPresentacion;
      const color = String(o.color ?? '') as CotizacionColor;
      const cantidad = Number(o.cantidad) || 0;
      const precioUnitario = Number(o.precioUnitario) || 0;
      if (!PRESENTACIONES.has(presentacion) || !COLORES.has(color) || cantidad <= 0) return null;
      return {
        producto: 'Flood CWF-UV',
        presentacion,
        color,
        cantidad,
        precioUnitario,
        subtotal: cantidad * precioUnitario,
      };
    })
    .filter((p): p is CotizacionProducto => p !== null);
}

function parseBody(body: Record<string, unknown>): { ok: true; data: CwfCotizacion } | { ok: false; error: string } {
  const cliente = parseCliente(body.cliente);
  const productos = parseProductos(body.productos);
  if (!cliente.nombre) return { ok: false, error: 'Nombre del cliente requerido' };
  if (!productos.length) return { ok: false, error: 'Agrega al menos un producto' };

  const subtotal = Number(body.subtotal) || productos.reduce((s, p) => s + p.subtotal, 0);
  const iva = Number(body.iva) || subtotal * 0.16;
  const envio = Number(body.envio) || 0;
  const total = Number(body.total) || subtotal + iva + envio;
  const estado = ESTADOS.has(body.estado as CotizacionEstado)
    ? (body.estado as CotizacionEstado)
    : 'borrador';

  return {
    ok: true,
    data: {
      folio: String(body.folio ?? '').trim(),
      fecha: body.fecha ? new Date(String(body.fecha)) : new Date(),
      cliente,
      productos,
      subtotal,
      iva,
      envio,
      total,
      precioEspecialDistribuidor: Boolean(body.precioEspecialDistribuidor),
      estado,
      notas: String(body.notas ?? '').trim(),
    },
  };
}

export async function POST(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(body as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  let doc = parsed.data;
  doc = { ...doc, folio: await getNextCwfFolio(), fecha: new Date() };

  await saveCwfCotizacion(doc);
  const pdf = await renderCotizacionPdf(doc);

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cotizacion-${doc.folio}.pdf"`,
      'X-Cotizacion-Folio': doc.folio,
    },
  });
}
