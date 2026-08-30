import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { enqueueOutbound } from '@/src/lib/outbound-queue';

export const dynamic = 'force-dynamic';

const CLIENT_ID = 'decohouse';
const WHATSAPP_TO = '56935311883';

/** Fecha calendario "ayer" en America/Santiago como YYYY-MM-DD */
function chileYesterdayYmd(): string {
  const tz = 'America/Santiago';
  const fmt = (t: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(t);
  const today = fmt(new Date());
  let t = Date.now();
  while (fmt(new Date(t)) === today) {
    t -= 60 * 60 * 1000;
  }
  return fmt(new Date(t));
}

/** Etiqueta dd/mm/aaaa para el mensaje */
function chileYesterdayLabelDdMmYyyy(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

const COTIZACION_REPLY_REGEX =
  /CONFIRMACI(O|Ó)N\s+FINAL|EN\s+BREVE\s+RECIBIR(A|Á)S\s+TU\s+COTIZACI(O|Ó)N|RECIBIR(A|Á)S\s+TU\s+COTIZACI(O|Ó)N/i;

function hasCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  const q = req.nextUrl.searchParams.get('secret');
  return auth === `Bearer ${secret}` || q === secret;
}

export async function GET(req: NextRequest) {
  if (!hasCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const ymd = chileYesterdayYmd();
  const fechaLabel = chileYesterdayLabelDdMmYyyy(ymd);

  try {
    const db = await getMongoDb();

    const baseLeadMatch = {
      clientId: CLIENT_ID,
      leadId: { $exists: true },
      deleted: { $ne: true },
    };

    const [conversaciones, cotizaciones, leadsNuevos, seguimiento] = await Promise.all([
      db
        .collection('leads_agentia')
        .aggregate<{ n: number }>([
          { $match: { clientId: CLIENT_ID } },
          {
            $addFields: {
              chileDay: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'America/Santiago' },
              },
            },
          },
          { $match: { chileDay: ymd } },
          { $count: 'n' },
        ])
        .toArray()
        .then((a) => a[0]?.n ?? 0),

      db
        .collection('leads_agentia')
        .aggregate<{ n: number }>([
          {
            $match: {
              clientId: CLIENT_ID,
              reply: { $regex: COTIZACION_REPLY_REGEX },
            },
          },
          {
            $addFields: {
              chileDay: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'America/Santiago' },
              },
            },
          },
          { $match: { chileDay: ymd } },
          { $count: 'n' },
        ])
        .toArray()
        .then((a) => a[0]?.n ?? 0),

      db
        .collection('leads')
        .aggregate<{ n: number }>([
          { $match: baseLeadMatch },
          {
            $addFields: {
              chileDay: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'America/Santiago' },
              },
            },
          },
          { $match: { chileDay: ymd } },
          { $count: 'n' },
        ])
        .toArray()
        .then((a) => a[0]?.n ?? 0),

      db
        .collection('leads')
        .aggregate<{ n: number }>([
          {
            $match: {
              ...baseLeadMatch,
              status: 'seguimiento',
            },
          },
          {
            $addFields: {
              chileDay: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $ifNull: ['$lastMessageAt', '$updatedAt'] },
                  timezone: 'America/Santiago',
                },
              },
            },
          },
          { $match: { chileDay: ymd } },
          { $count: 'n' },
        ])
        .toArray()
        .then((a) => a[0]?.n ?? 0),
    ]);

    const message =
      `📊 Resumen Deco House — ${fechaLabel}\n\n` +
      `🗣️ Conversaciones ayer: ${conversaciones}\n` +
      `📋 Cotizaciones generadas: ${cotizaciones}\n` +
      `👤 Leads nuevos: ${leadsNuevos}\n` +
      `🔄 En seguimiento: ${seguimiento}\n\n` +
      `Que tengas un excelente día Georfrank! 🪟\n` +
      `— Elisa`;

    await enqueueOutbound({
      senderId: WHATSAPP_TO,
      clientId: CLIENT_ID,
      message,
      type: 'manual',
      delaySeconds: 5,
    });

    return NextResponse.json({
      ok: true,
      ymdSantiago: ymd,
      fechaLabel,
      conversaciones,
      cotizaciones,
      leadsNuevos,
      seguimiento,
      queued: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[cron/decohouse-summary]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
