import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { calcularTotal, type MetodoPago, type Periodo } from '@/lib/lealtad-pricing';
import { crearPreferencia, mpToken } from '@/lib/mercadopago';
import { publicBase, SOLICITUDES } from '@/lib/lealtad-provision';
import { notifyOwner } from '@/lib/loyalty-security';
import { conceptoSpei } from '@/lib/lealtad-pago';

export const dynamic = 'force-dynamic';

const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
    return false;
  }
  h.n += 1;
  return h.n > 10;
}

/** POST { negocio, periodo, pago, sucursales? } — link de pago para renovar o convertir la prueba. */
async function manejar(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'x';
  if (limited(ip)) return NextResponse.json({ error: 'Demasiados intentos, espera unos minutos.' }, { status: 429 });
  if (!mpToken()) return NextResponse.json({ error: 'Pago en línea no disponible', fallback: true }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const key = String(b.negocio ?? '').trim().toLowerCase();
  const db = await getMongoDb();
  const t = (await db.collection('loyalty_tenants').findOne({ key, origen: 'self-serve' })) as Record<string, any> | null;
  if (!t) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

  const periodo: Periodo = b.periodo === 'anual' ? 'anual' : 'mensual';
  const pago: MetodoPago = b.pago === 'OXXO' ? 'OXXO' : b.pago === 'Mercado Pago' ? 'Mercado Pago' : 'SPEI';
  const precioReal = calcularTotal(periodo, Number(b.sucursales) || Number(t.sucursales) || 1, pago);
  // SOLO PARA PRUEBAS: LEALTAD_PRECIO_TEST=20 cobra $20 en vez del total. Quitar la variable al terminar.
  const test = Number(process.env.LEALTAD_PRECIO_TEST);
  const precio = test > 0 ? { ...precioReal, total: test } : precioReal;
  const ref = randomBytes(12).toString('hex');

  await db.collection(SOLICITUDES).insertOne({
    ref,
    tipo: 'renovacion',
    estado: 'pendiente_pago',
    tenantKey: key,
    negocio: t.nombre,
    whatsapp: t.whatsapp,
    periodo,
    pago,
    sucursales: precio.sucursales,
    total: precio.total,
    ip,
    createdAt: new Date(),
  });

  if (pago === 'SPEI') {
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { estado: 'pendiente_spei', concepto: conceptoSpei(ref) } });
    await notifyOwner(`🏦 SPEI pendiente (renovación): ${t.nombre} — $${precio.total}. Concepto ${conceptoSpei(ref)}. Confírmalo en ${publicBase()}/admin/lealtad`);
    return NextResponse.json({ ok: true, url: `/lealtad/gracias?ref=${ref}` });
  }

  try {
    const base = publicBase();
    const armar = (metodo: 'oxxo' | 'oxxo_suave' | 'tarjeta') => crearPreferencia({
      title: `Agentia Lealtad ${periodo} — ${t.nombre}`.slice(0, 120),
      amount: precio.total,
      reference: ref,
      notificationUrl: `${base}/api/lealtad/mp-webhook`,
      backUrl: `${base}/lealtad/gracias?ref=${ref}`,
      metodo,
      payerName: String(t.nombre),
    });
    let pref;
    if (pago === 'Mercado Pago') pref = await armar('tarjeta');
    else {
      try {
        pref = await armar('oxxo');
      } catch (e1) {
        console.error('[lealtad] OXXO estricto falló, reintento suave:', e1);
        pref = await armar('oxxo_suave');
      }
    }
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { mpPreferenceId: pref.id } });
    return NextResponse.json({ ok: true, url: pref.initPoint });
  } catch (e) {
    console.error('[lealtad/renovar]', e);
    return NextResponse.json({ error: 'No se pudo crear el pago', detalle: String(e instanceof Error ? e.message : e).slice(0, 220), fallback: true }, { status: 424 });
  }
}

export async function POST(req: Request) {
  try {
    return await manejar(req);
  } catch (e) {
    console.error('[renovar] error no controlado', e);
    return NextResponse.json({ error: 'Error del servidor. Intenta de nuevo o usa WhatsApp.', fallback: true }, { status: 500 });
  }
}
