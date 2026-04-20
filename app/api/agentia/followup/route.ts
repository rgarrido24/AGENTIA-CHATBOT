import { NextRequest, NextResponse } from 'next/server';
import {
  processAgentiaFollowups,
  getPendingFollowups,
  markFollowupsSent,
  detectAndFlagInterest,
} from '@/src/lib/agentia-followup';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${secret}`;
}

/**
 * GET /api/agentia/followup
 * Devuelve los mensajes de seguimiento pendientes de envío.
 * El bridge los lee y los envía por WhatsApp.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const messages = await getPendingFollowups();
    return NextResponse.json({ messages });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/agentia/followup
 * Cuerpo: vacío o { trigger: true }  → genera nuevos follow-ups
 *         { sentIds: string[] }       → marca mensajes como enviados
 *         { detectInterest: true }    → detecta prospectos que respondieron
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));

    if (Array.isArray(body?.sentIds) && body.sentIds.length > 0) {
      await markFollowupsSent(body.sentIds as string[]);
      return NextResponse.json({ ok: true, marked: body.sentIds.length });
    }

    if (body?.detectInterest) {
      const result = await detectAndFlagInterest();
      return NextResponse.json({ ok: true, ...result });
    }

    // Default: generar nuevos follow-ups
    const result = await processAgentiaFollowups();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
