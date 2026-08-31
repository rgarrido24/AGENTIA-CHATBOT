import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const GIROS = [
  'Cafeterías',
  'Barberías',
  'Restaurantes',
  'Estéticas',
  'Veterinarias',
  'Gimnasios',
  'Boutiques',
  'Farmacias',
  'Papelerías',
  'Abarrotes',
  'Tacos / comida rápida',
] as const;

const PLAN = 399;

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  );
}

function asInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: true });
  }

  const nombre = String(body.nombre ?? '').trim().slice(0, 80);
  const giro = String(body.giro ?? '').trim();
  const whatsappDigits = String(body.whatsapp ?? '').replace(/\D/g, '');

  if (nombre.length < 2) {
    return NextResponse.json({ error: 'Escribe tu nombre' }, { status: 400 });
  }
  if (whatsappDigits.length < 10 || whatsappDigits.length > 15) {
    return NextResponse.json({ error: 'WhatsApp inválido' }, { status: 400 });
  }
  if (!GIROS.includes(giro as (typeof GIROS)[number])) {
    return NextResponse.json({ error: 'Elige un giro' }, { status: 400 });
  }

  const clientes = asInt(body.clientes, 40, 1500);
  const ticket = asInt(body.ticket, 40, 800);
  const recompra = asInt(body.recompra, 5, 40);
  if (clientes == null || ticket == null || recompra == null) {
    return NextResponse.json({ error: 'Números del simulador inválidos' }, { status: 400 });
  }

  const extraClientes = Math.round(clientes * (recompra / 100));
  const ingresoExtra = extraClientes * ticket;

  const now = new Date();
  try {
    const db = await getMongoDb();
    await db.collection('leads_calculadora').updateOne(
      { whatsapp: whatsappDigits },
      {
        $set: {
          nombre,
          whatsapp: whatsappDigits,
          giro,
          clientes,
          ticket,
          recompra,
          extraClientes,
          ingresoExtra,
          plan: PLAN,
          source: 'lealtad-calculadora',
          updatedAt: now,
          meta: {
            ip: clientIP(req),
            ua: req.headers.get('user-agent') ?? '',
            referer: req.headers.get('referer') ?? '',
          },
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  } catch (err) {
    console.error(
      '[api/lealtad/calculadora]',
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: 'No se pudo guardar. Intenta de nuevo.' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    extraClientes,
    ingresoExtra,
  });
}
