import { NextRequest } from 'next/server';
import { setLeadHandledBy, getLeadById } from '@/src/lib/leads';
import { recordIntervention } from '@/src/lib/intervention-history';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
    const handlerId = typeof body?.handlerId === 'string' ? body.handlerId.trim() || null : null;
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
    const statusAtAction = typeof body?.status === 'string' ? body.status : undefined;

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }

    const prev = await getLeadById(leadId);
    const ok = await setLeadHandledBy(leadId, handlerId);

    if (ok && handlerId) {
      await recordIntervention({
        leadId,
        handlerId,
        action: 'took_control',
        clientId,
        statusAtAction,
      }).catch(() => {});
    }
    if (ok && !handlerId && prev?.is_being_handled_by) {
      await recordIntervention({
        leadId,
        handlerId: prev.is_being_handled_by,
        action: 'released',
        clientId,
        statusAtAction,
      }).catch(() => {});
    }

    return Response.json({ ok, is_being_handled_by: handlerId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
