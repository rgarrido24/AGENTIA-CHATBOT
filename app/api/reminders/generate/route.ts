import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * Genera recordatorios de seguimiento para leads izzi que:
 *  - Recibieron una solicitud de documentos del bot
 *  - No han respondido en 2+ horas (pero menos de 24h para no molestar leads muertos)
 *  - No tienen ya un recordatorio generado en las últimas 24h
 *  - El bot no está pausado para ese lead
 */

const REMINDER_MESSAGE =
  '¡Hola! 👋 Solo quería recordarte que tenemos tu solicitud de izzi lista. ¿Pudiste conseguir tu INE? Si tienes alguna duda estoy aquí para ayudarte 😊';

// Palabras que indican que el bot pidió documentos en su última respuesta
const DOC_REQUEST_REGEX =
  /INE|credencial|identificaci[oó]n|comprobante|documento|foto|fotograf[ií]a|imagen|envía|m[aá]ndame|manda|sube|adjunta/i;

export async function POST(request: NextRequest) {
  // Autenticación opcional con CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const now = new Date();
    const twoHoursAgo    = new Date(now.getTime() - 2  * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Leads izzi activos cuyo último mensaje del cliente fue hace 2-24h
    //    y cuya última respuesta del bot pedía documentos
    const candidates = await db.collection('leads').find({
      clientId: 'izzi',
      platform: 'whatsapp',
      bot_status: { $ne: 'paused' },
      status: { $nin: ['cancelados', 'cierres'] },
      lastMessageAt: { $lt: twoHoursAgo, $gt: twentyFourHoursAgo },
      lastReply: { $regex: DOC_REQUEST_REGEX.source, $options: 'i' },
    }).toArray();

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, generated: 0 });
    }

    // 2. Filtrar los que ya tienen un recordatorio reciente (últimas 24h)
    const leadIds = candidates.map((l) => l.leadId).filter(Boolean);
    const recentReminders = await db.collection('reminder_queue').find({
      leadId: { $in: leadIds },
      createdAt: { $gt: twentyFourHoursAgo },
    }).toArray();

    const alreadyQueued = new Set(recentReminders.map((r) => r.leadId));

    // 3. Verificar también el bot global pausado
    const botSettings = await db.collection('bot_settings').findOne({ clientId: 'izzi' });
    if (botSettings?.botPaused) {
      return NextResponse.json({ ok: true, generated: 0, reason: 'bot_global_paused' });
    }

    // 4. Generar recordatorios para los elegibles
    const toInsert = candidates
      .filter((l) => l.leadId && l.senderId && !alreadyQueued.has(l.leadId))
      .map((l) => ({
        leadId:  l.leadId,
        senderId: l.senderId.includes('@') ? l.senderId : `${l.senderId}`,
        message:  REMINDER_MESSAGE,
        platform: 'whatsapp',
        status:   'pending',
        createdAt: now,
      }));

    if (toInsert.length > 0) {
      await db.collection('reminder_queue').insertMany(toInsert);
    }

    console.log(`[reminders/generate] ${toInsert.length} recordatorio(s) generado(s) de ${candidates.length} candidatos`);
    return NextResponse.json({ ok: true, generated: toInsert.length, candidates: candidates.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('[reminders/generate]', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// GET para fácil testing desde el browser
export async function GET(request: NextRequest) {
  return POST(request);
}
