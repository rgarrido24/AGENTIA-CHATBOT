import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { firmaValida, obtenerPago } from '@/lib/mercadopago';
import { activarSolicitud, SOLICITUDES } from '@/lib/lealtad-provision';
import { notifyOwner } from '@/lib/loyalty-security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function manejar(req: Request) {
  const url = new URL(req.url);
  const body = (await req.json().catch(() => ({}))) as { type?: string; topic?: string; data?: { id?: string | number }; id?: string | number };
  const tipo = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
  const dataId = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? body.id ?? '');

  if (tipo !== 'payment' || !dataId) return NextResponse.json({ ok: true });
  if (!firmaValida(req, dataId)) return NextResponse.json({ error: 'firma inválida' }, { status: 401 });

  const pago = await obtenerPago(dataId);
  if (!pago?.external_reference) return NextResponse.json({ ok: true });

  const db = await getMongoDb();
  const col = db.collection(SOLICITUDES);
  const sol = await col.findOne({ ref: pago.external_reference });
  if (!sol) return NextResponse.json({ ok: true });

  await col.updateOne(
    { ref: sol.ref },
    { $set: { mpPaymentId: String(pago.id), mpStatus: pago.status, mpTipo: pago.payment_type_id ?? null, mpUpdatedAt: new Date() } },
  );

  if (pago.status !== 'approved') return NextResponse.json({ ok: true, status: pago.status });

  // Anti-fraude: el monto pagado debe cubrir el total calculado por el servidor.
  if (Number(pago.transaction_amount ?? 0) + 1 < Number(sol.total)) {
    await col.updateOne({ ref: sol.ref }, { $set: { estado: 'monto_no_coincide' } });
    await notifyOwner(`⚠️ Pago de "${sol.negocio}" aprobado por $${pago.transaction_amount} pero esperaba $${sol.total}. No se activó. Ref ${sol.ref}`);
    return NextResponse.json({ ok: true });
  }

  const marcado = await col.updateOne(
    { ref: sol.ref, estado: { $in: ['pendiente_pago', 'error_checkout'] } },
    { $set: { estado: 'pagado', pagadoAt: new Date() } },
  );
  if (marcado.modifiedCount === 1 || ['pagado', 'error_activacion'].includes(String(sol.estado))) {
    const r = await activarSolicitud(String(sol.ref));
    return NextResponse.json({ ok: r.ok });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    return await manejar(req);
  } catch (e) {
    console.error('[lealtad/mp-webhook]', e);
    // 200 para que MP no reintente en bucle; los errores de activación ya se marcan en Mongo y se avisan.
    return NextResponse.json({ ok: false });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
