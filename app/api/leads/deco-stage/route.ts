import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const STAGES = new Set([
  'Nuevo',
  'En seguimiento',
  'Visita técnico',
  'Anticipo 50%',
  'Contra entrega',
  'Cerrado',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
    const stage = typeof body?.stage === 'string' ? body.stage.trim() : '';
    if (!leadId) return NextResponse.json({ error: 'leadId requerido' }, { status: 400 });
    if (!STAGES.has(stage)) return NextResponse.json({ error: 'stage inválido' }, { status: 400 });

    const db = await getMongoDb();
    const result = await db.collection('leads').updateOne(
      { leadId },
      { $set: { deco_stage: stage, updatedAt: new Date() } }
    );

    return NextResponse.json({ ok: result.matchedCount > 0, stage });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

