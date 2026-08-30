import { NextRequest, NextResponse } from 'next/server';
import { deleteLead } from '@/src/lib/leads';
import { deleteSession } from '@/src/lib/chat-sessions';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : null;
    if (!leadId) {
      return NextResponse.json({ ok: false, error: 'leadId requerido' }, { status: 400 });
    }
    const deleted = await deleteLead(leadId);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Lead no encontrado' }, { status: 404 });
    }
    // Limpiar datos asociados para que el chat reinicie desde cero al volver a escribir
    await Promise.allSettled([
      deleteSession(leadId),
      getMongoDb().then((db) =>
        db.collection('document_pending_confirmations').deleteOne({ leadId })
      ),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
