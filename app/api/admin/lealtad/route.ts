import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { activarSolicitud, SOLICITUDES } from '@/lib/lealtad-provision';
import { aplicarRenovacion } from '@/lib/lealtad-renovaciones';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Protegida por el login de /admin (middleware). GET: solicitudes y negocios. POST {ref}: confirma pago manual y activa. */
export async function GET() {
  const db = await getMongoDb();
  const solicitudes = await db.collection(SOLICITUDES).find({}).sort({ createdAt: -1 }).limit(100).toArray();
  const tenants = await db
    .collection('loyalty_tenants')
    .find({ origen: 'self-serve' })
    .project({ key: 1, nombre: 1, plan: 1, panelActivo: 1, vigenteHasta: 1, whatsapp: 1, estadoSuscripcion: 1 })
    .sort({ createdAt: -1 })
    .toArray();
  return NextResponse.json({
    solicitudes: solicitudes.map((s) => ({
      ref: s.ref, tipo: s.tipo, trial: !!s.trial, estado: s.estado, negocio: s.negocio, whatsapp: s.whatsapp,
      pago: s.pago, total: s.total, periodo: s.periodo, concepto: s.concepto ?? null, createdAt: s.createdAt,
      error: s.error ?? null, tenantKey: s.tenantKey ?? null,
    })),
    tenants,
  });
}

export async function POST(req: Request) {
  const { ref } = (await req.json().catch(() => ({}))) as { ref?: string };
  if (!ref) return NextResponse.json({ error: 'ref requerido' }, { status: 400 });
  const col = (await getMongoDb()).collection(SOLICITUDES);
  const sol = await col.findOne({ ref });
  if (!sol) return NextResponse.json({ error: 'No existe' }, { status: 404 });
  if (sol.estado === 'activada') return NextResponse.json({ error: 'Ya estaba activada' }, { status: 409 });

  await col.updateOne(
    { ref, estado: { $in: ['pendiente_spei', 'pendiente_pago', 'error_checkout', 'monto_no_coincide'] } },
    { $set: { estado: 'pagado', pagadoAt: new Date(), pagoConfirmadoManual: true } },
  );
  const r = sol.tipo === 'renovacion' ? await aplicarRenovacion(ref) : await activarSolicitud(ref);
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}
