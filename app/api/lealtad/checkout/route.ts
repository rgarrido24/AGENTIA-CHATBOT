import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { estadoPromo } from '@/lib/lealtad-promo';
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
  return h.n > 8;
}
const clean = (v: unknown, max = 160) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

/** POST /api/lealtad/checkout — crea la solicitud y el link de pago de Mercado Pago. */
async function manejar(req: Request) {
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
  const promo = periodo === 'anual' && (await estadoPromo()).activa;
  const precioReal = calcularTotal(periodo, Number(b.sucursales), pago, promo);
  // SOLO PARA PRUEBAS: LEALTAD_PRECIO_TEST=20 cobra $20 en vez del total. Quitar la variable al terminar.
  const test = Number(process.env.LEALTAD_PRECIO_TEST);
  const precio = test > 0 ? { ...precioReal, total: test } : precioReal;

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
    promo,
    total: precio.total,
    ip,
    createdAt: new Date(),
  };
  const db = await getMongoDb();
  await db.collection(SOLICITUDES).insertOne(doc);

  // SPEI directo: sin Mercado Pago. Se muestra la CLABE y se confirma a mano en /admin/lealtad.
  if (pago === 'SPEI') {
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { estado: 'pendiente_spei', concepto: conceptoSpei(ref) } });
    await notifyOwner(`🏦 SPEI pendiente: ${negocio} (${giro}) — $${precio.total}. Concepto ${conceptoSpei(ref)}. Confírmalo en ${publicBase()}/admin/lealtad cuando veas el depósito.`);
    return NextResponse.json({ ok: true, url: `/lealtad/gracias?ref=${ref}`, ref });
  }

  try {
    const base = publicBase();
    const armar = (metodo: 'oxxo' | 'oxxo_suave' | 'tarjeta') => crearPreferencia({
      title: `Agentia Lealtad ${periodo} — ${negocio}`.slice(0, 120),
      amount: precio.total,
      reference: ref,
      notificationUrl: `${base}/api/lealtad/mp-webhook`,
      backUrl: `${base}/lealtad/gracias?ref=${ref}`,
      metodo,
      payerName: negocio,
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
    await notifyOwner(`🛒 Checkout iniciado: ${negocio} (${giro}) — $${precio.total} ${periodo}, ${pago}. WhatsApp: ${whatsapp}`);
    return NextResponse.json({ ok: true, url: pref.initPoint, ref });
  } catch (e) {
    console.error('[lealtad/checkout]', e);
    await db.collection(SOLICITUDES).updateOne({ ref }, { $set: { estado: 'error_checkout', error: String(e).slice(0, 200) } });
    return NextResponse.json({ error: 'No se pudo crear el pago', detalle: String(e instanceof Error ? e.message : e).slice(0, 220), fallback: true }, { status: 424 });
  }
}

export async function POST(req: Request) {
  try {
    return await manejar(req);
  } catch (e) {
    console.error('[checkout] error no controlado', e);
    return NextResponse.json({ error: 'Error del servidor. Intenta de nuevo o usa WhatsApp.', fallback: true }, { status: 500 });
  }
}
