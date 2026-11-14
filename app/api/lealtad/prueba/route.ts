import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { activarSolicitud, SOLICITUDES } from '@/lib/lealtad-provision';
import { notifyOwner } from '@/lib/loyalty-security';
import { calcularTotal, type MetodoPago, type Periodo } from '@/lib/lealtad-pricing';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const clean = (v: unknown, max = 160) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

/** POST /api/lealtad/prueba — arranca la prueba gratis de 7 días (una por WhatsApp, máx. 2 por IP al día). */
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'x';
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const negocio = clean(b.negocio, 80);
  const whatsapp = clean(b.whatsapp, 20).replace(/\D/g, '');
  const giro = clean(b.giro, 40);
  if (negocio.length < 2 || whatsapp.length < 10 || !giro) {
    return NextResponse.json({ error: 'Faltan datos: negocio, giro y WhatsApp de 10 dígitos.' }, { status: 400 });
  }
  const ultimos10 = whatsapp.slice(-10);

  const db = await getMongoDb();
  const col = db.collection(SOLICITUDES);
  const yaUso = await col.findOne({ trial: true, whatsapp: { $regex: `${ultimos10}$` }, estado: { $nin: ['error_activacion'] } });
  if (yaUso) {
    return NextResponse.json(
      { error: 'Este WhatsApp ya usó su prueba gratis. Puedes contratar directamente con el botón de pago.', yaUsada: true },
      { status: 409 },
    );
  }
  const hoy = await col.countDocuments({ trial: true, ip, createdAt: { $gt: new Date(Date.now() - 24 * 3600 * 1000) } });
  if (hoy >= 2) {
    return NextResponse.json({ error: 'Demasiadas pruebas desde esta conexión. Escríbenos por WhatsApp.' }, { status: 429 });
  }

  const periodo: Periodo = b.periodo === 'anual' ? 'anual' : 'mensual';
  const pago: MetodoPago = b.pago === 'OXXO' ? 'OXXO' : b.pago === 'Mercado Pago' ? 'Mercado Pago' : 'SPEI';
  const precio = calcularTotal(periodo, Number(b.sucursales), pago);
  const modelo = b.modelo === 'Sellos' ? 'sellos' : b.modelo === 'Cashback' ? 'cashback' : 'puntos';
  const n = Number(b.parametro);
  const parametro =
    modelo === 'sellos' ? ([8, 10, 12].includes(n) ? n : 10) : modelo === 'cashback' ? Math.min(10, Math.max(3, Math.round(n) || 5)) : 1;
  const logoUrl = /^https:\/\/res\.cloudinary\.com\//.test(String(b.logoUrl ?? '')) ? String(b.logoUrl) : '';
  const ref = randomBytes(12).toString('hex');

  await col.insertOne({
    ref,
    tipo: 'contratar',
    trial: true,
    estado: 'pagado', // sin cobro: entra directo a activación
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
  });

  const r = await activarSolicitud(ref);
  if (!r.ok) {
    await notifyOwner(`❌ Prueba gratis de "${negocio}" no se pudo activar: ${r.error?.slice(0, 160)}`);
    return NextResponse.json({ error: 'No pudimos activar tu prueba. Ya nos avisó el sistema; te contactamos por WhatsApp.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ref });
}
