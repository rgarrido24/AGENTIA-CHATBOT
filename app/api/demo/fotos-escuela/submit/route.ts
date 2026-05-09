import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function cleanStr(v: unknown, max = 200): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const tipo = cleanStr(body.tipo, 30); // 'anuario' | 'fiesta'
    const tutorNombre = cleanStr(body.tutorNombre, 120);
    const tutorWhatsapp = cleanStr(body.tutorWhatsapp, 60);
    const alumnoNombre = cleanStr(body.alumnoNombre, 120);
    const grupo = cleanStr(body.grupo, 60);
    const email = cleanStr(body.email, 160);
    const paquete = cleanStr(body.paquete, 60);
    const notas = cleanStr(body.notas, 800);
    const aportacion = cleanStr(body.aportacion, 800);
    const page = cleanStr(body.page, 200);

    if (!tipo || !tutorNombre || !tutorWhatsapp || !alumnoNombre) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }
    if (tipo !== 'anuario' && tipo !== 'fiesta') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const db = await getMongoDb();
    await db.collection('demo_fotos_escuela_forms').insertOne({
      tipo,
      tutorNombre,
      tutorWhatsapp,
      alumnoNombre,
      grupo: grupo || null,
      email: email || null,
      paquete: paquete || null,
      notas: notas || null,
      aportacion: aportacion || null,
      page: page || null,
      ip: clientIP(req) || null,
      ua: req.headers.get('user-agent') ?? null,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[demo/fotos-escuela/submit]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

