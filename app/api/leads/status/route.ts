import { NextRequest } from 'next/server';
import { updateLeadStatus, PIPELINE_STATUSES } from '@/src/lib/leads';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
    const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : '';
    const closedBy = typeof body?.closedBy === 'string' ? body.closedBy.trim() : undefined;
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : undefined;
    const cancelReason = typeof body?.cancelReason === 'string' ? body.cancelReason.trim() : undefined;

    if (!leadId) {
      return Response.json({ error: 'leadId requerido' }, { status: 400 });
    }
    if (!PIPELINE_STATUSES.includes(status as any)) {
      return Response.json({ error: `status debe ser: ${PIPELINE_STATUSES.join(', ')}` }, { status: 400 });
    }

    const opts =
      status === 'cierres'
        ? { closedBy, clientId }
        : status === 'cancelados'
          ? { cancelReason }
          : undefined;
    const ok = await updateLeadStatus(leadId, status as any, opts);
    return Response.json({ ok, status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
