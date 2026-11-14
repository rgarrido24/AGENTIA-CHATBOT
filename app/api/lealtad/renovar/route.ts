import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { calcularTotal, type MetodoPago, type Periodo } from '@/lib/lealtad-pricing';
import { crearPreferencia, mpToken } from '@/lib/mercadopago';
import { publicBase, SOLICITUDES } from '@/lib/lealtad-provision';

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
export async function POST(req: Request) {
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
  const precio = calcularTotal(periodo, Number(b.sucursales) || Number(t.sucursales) || 1, pago);
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

  try {
    const base = publicBase();
    const pref = await crearPreferencia({
      title: `Agentia Lealtad ${periodo} — ${t.nombre}`.slice(0, 120),
      amount: precio.total,
      reference: ref,
      notificationUrl: `${base}/api/lealtad/mp-webhook`,
      backUrl: `${base}/lealtad/gracias?ref=${ref}`,
      metodo: pago === 'Mercado Pago' ? 'tarjeta' : 'efectivo_transferencia',
      payerName: String(t.nombre),
    });
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { mpPreferenceId: pref.id } });
    return NextResponse.json({ ok: true, url: pref.initPoint });
  } catch (e) {
    console.error('[lealtad/renovar]', e);
    return NextResponse.json({ error: 'No se pudo crear el pago', fallback: true }, { status: 502 });
  }
}
