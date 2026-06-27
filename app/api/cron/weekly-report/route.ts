import { NextRequest, NextResponse } from 'next/server';
import { sendBiovelaWeeklyReport } from '@/lib/biovela-weekly-report';

export const dynamic = 'force-dynamic';

function hasCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  const q = req.nextUrl.searchParams.get('secret');
  return auth === `Bearer ${secret}` || q === secret;
}

/**
 * Reporte semanal Biovela — programar lunes 9:00 CDMX (15:00 UTC).
 * Cron: 0 15 * * 1
 * GET /api/cron/weekly-report?secret=...
 */
export async function GET(req: NextRequest) {
  if (!hasCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { stats, message } = await sendBiovelaWeeklyReport();
    return NextResponse.json({
      ok: true,
      clientId: 'biovela',
      phone: process.env.BIOVELA_WEEKLY_REPORT_PHONE || '525560556287',
      weekStart: stats.weekStart.toISOString(),
      weekEnd: stats.weekEnd.toISOString(),
      stats: {
        conversations: stats.conversations,
        ventasCerradas: stats.ventasCerradas,
        pedidosEnviados: stats.pedidosEnviados,
        entregasConfirmadas: stats.entregasConfirmadas,
        avgResponseMin: stats.avgResponseMin,
        topProducts: stats.topProducts,
      },
      messagePreview: message.slice(0, 200),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('[cron/weekly-report]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
