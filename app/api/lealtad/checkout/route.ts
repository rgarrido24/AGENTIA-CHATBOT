import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { calcularTotal, type MetodoPago, type Periodo } from '@/lib/lealtad-pricing';
import { crearPreferencia, mpToken } from '@/lib/mercadopago';
import { publicBase, SOLICITUDES } from '@/lib/lealtad-provision';
import { notifyOwner } from '@/lib/loyalty-security';

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
  return h.n > 8;
}
const clean = (v: unknown, max = 160) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

/** POST /api/lealtad/checkout — crea la solicitud y el link de pago de Mercado Pago. */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'x';
  if (limited(ip)) return NextResponse.json({ error: 'Demasiados intentos, espera unos minutos.' }, { status: 429 });
  if (!mpToken()) return NextResponse.json({ error: 'Pago en línea no disponible', fallback: true }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const negocio = clean(b.negocio, 80);
  const whatsapp = clean(b.whatsapp, 20).replace(/\D/g, '');
  const giro = clean(b.giro, 40);
  if (negocio.length < 2 || whatsapp.length < 10 || !giro) {
    return NextResponse.json({ error: 'Faltan datos: negocio, giro y WhatsApp de 10 dígitos.' }, { status: 400 });
  }

  const periodo: Periodo = b.periodo === 'anual' ? 'anual' : 'mensual';
  const pago: MetodoPago = b.pago === 'OXXO' ? 'OXXO' : b.pago === 'Mercado Pago' ? 'Mercado Pago' : 'SPEI';
  const precio = calcularTotal(periodo, Number(b.sucursales), pago);

  const modelo = b.modelo === 'Sellos' ? 'sellos' : b.modelo === 'Cashback' ? 'cashback' : 'puntos';
  const detalleNum = Number(b.parametro);
  const parametro =
    modelo === 'sellos'
      ? [8, 10, 12].includes(detalleNum) ? detalleNum : 10
      : modelo === 'cashback'
        ? Math.min(10, Math.max(3, Math.round(detalleNum) || 5))
        : 1;

  const logoUrl = /^https:\/\/res\.cloudinary\.com\//.test(String(b.logoUrl ?? '')) ? String(b.logoUrl) : '';
  const ref = randomBytes(12).toString('hex');

  const doc = {
    ref,
    estado: 'pendiente_pago',
    tipo: 'contratar',
    negocio,
    giro,
    whatsapp,
    direccion: clean(b.direccion, 160),
    horario: clean(b.horario, 100),
    modelo,
    parametro,
    recompensa: clean(b.recompensa, 90),
    color: /^#[0-9a-fA-F]{6}$/.test(String(b.color ?? '')) ? String(b.color) : '#123B2A',
    logoUrl,
    sucursales: precio.sucursales,
    periodo,
    pago,
    total: precio.total,
    ip,
    createdAt: new Date(),
  };
  const db = await getMongoDb();
  await db.collection(SOLICITUDES).insertOne(doc);

  try {
    const base = publicBase();
    const pref = await crearPreferencia({
      title: `Agentia Lealtad ${periodo} — ${negocio}`.slice(0, 120),
      amount: precio.total,
      reference: ref,
      notificationUrl: `${base}/api/lealtad/mp-webhook`,
      backUrl: `${base}/lealtad/gracias?ref=${ref}`,
      metodo: pago === 'Mercado Pago' ? 'tarjeta' : 'efectivo_transferencia',
      payerName: negocio,
    });
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { mpPreferenceId: pref.id } });
    await notifyOwner(`🛒 Checkout iniciado: ${negocio} (${giro}) — $${precio.total} ${periodo}, ${pago}. WhatsApp: ${whatsapp}`);
    return NextResponse.json({ ok: true, url: pref.initPoint, ref });
  } catch (e) {
    console.error('[lealtad/checkout]', e);
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { estado: 'error_checkout', error: String(e).slice(0, 200) } });
    return NextResponse.json({ error: 'No se pudo crear el pago', fallback: true }, { status: 502 });
  }
}
