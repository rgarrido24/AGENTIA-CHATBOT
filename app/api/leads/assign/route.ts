import { NextRequest } from 'next/server';
import { assignLeadToVendedor, unassignLead } from '@/src/lib/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
    const assignedTo = typeof body?.assignedTo === 'string' ? body.assignedTo.trim() : '';

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }

    if (assignedTo) {
      const ok = await assignLeadToVendedor(leadId, assignedTo);
      return Response.json({ ok, assignedTo });
    } else {
      const ok = await unassignLead(leadId);
      return Response.json({ ok, assignedTo: null });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
