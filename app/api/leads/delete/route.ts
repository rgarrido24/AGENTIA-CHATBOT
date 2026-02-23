import { NextRequest, NextResponse } from 'next/server';
import { deleteLead } from '@/src/lib/leads';

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
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
