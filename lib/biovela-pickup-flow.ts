import { getMongoDb } from '@/lib/mongodb';
import { createBiovelaPickupEvent, isGoogleCalendarServiceAccountConfigured } from '@/lib/google-calendar';
import { parseTimeFromMessage } from '@/src/lib/appointment-flow';
import { createAppointment } from '@/src/lib/appointments';

const COLLECTION = 'biovela_pickup_sessions';
const ALLOWED_WEEKDAYS = new Set([1, 3, 5]); // Lunes, Miércoles, Viernes
const TIMEZONE = 'America/Mexico_City';
const LOCATION = 'Iztacalco, CDMX (por cita previa)';

type PickupStep = 'idle' | 'collecting' | 'done';

type PickupSession = {
  sessionId: string;
  senderId: string;
  pageId: string;
  step: PickupStep;
  name?: string;
  preferredDate?: string;
  preferredTime?: string;
  products?: string;
  updatedAt: Date;
  createdAt: Date;
};

const PICKUP_INTENT_RE =
  /recolecci[oó]n|recoger(?:lo|la|los|las)?|pasar\s+a\s+(?:recoger|buscar)|visitar\s+(?:el\s+)?almac[eé]n|cita\s+(?:en|para|de)\s+(?:el\s+)?almac[eé]n|agendar\s+(?:una\s+)?cita|cita\s+previa|recolecci[oó]n\s+en\s+almac[eé]n/i;

const CANCEL_RE = /\b(cancelar|cancela|ya no|olv[íi]dalo|detener)\b/i;

const MONTH_MAP: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

const WEEKDAY_MAP: Record<string, number> = {
  lunes: 1,
  lun: 1,
  martes: 2,
  mar: 2,
  miercoles: 3,
  miércoles: 3,
  mie: 3,
  jueves: 4,
  jue: 4,
  viernes: 5,
  vie: 5,
  sabado: 6,
  sábado: 6,
  sab: 6,
  domingo: 0,
  dom: 0,
};

function makeSessionId(senderId: string, pageId: string): string {
  return `${senderId}_${pageId}_biovela_pickup`;
}

function formatWhatsApp(senderId: string): string {
  const digits = senderId.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  if (digits.length >= 12 && digits.startsWith('52')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  return senderId;
}

function weekdayInMexico(date: Date): number {
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[label] ?? date.getDay();
}

function nextWeekday(targetDow: number, from = new Date()): Date {
  const base = new Date(from);
  base.setHours(12, 0, 0, 0);
  const current = weekdayInMexico(base);
  let delta = targetDow - current;
  if (delta <= 0) delta += 7;
  base.setDate(base.getDate() + delta);
  return base;
}

export function detectBiovelaPickupIntent(message: string): boolean {
  return PICKUP_INTENT_RE.test(message);
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:me llamo|soy|mi nombre es|nombre:?)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ][A-Za-zÁÉÍÓÚáéíóúÑñ\s'.-]{1,48})/i,
    /^([A-Za-zÁÉÍÓÚáéíóúÑñ][A-Za-zÁÉÍÓÚáéíóúÑñ\s'.-]{2,40})$/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim().replace(/\s+/g, ' ');
  }
  return null;
}

function parsePreferredDate(text: string, now = new Date()): Date | null {
  const t = text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

  if (/pasado manana|pasado mañana/.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  if (/manana|mañana/.test(t)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }

  const numeric = t.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]) - 1;
    let year = numeric[3] ? Number(numeric[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day, 12, 0, 0, 0);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const namedMonth = t.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?/);
  if (namedMonth) {
    const day = Number(namedMonth[1]);
    const month = MONTH_MAP[namedMonth[2]];
    const year = namedMonth[3] ? Number(namedMonth[3]) : now.getFullYear();
    const d = new Date(year, month, day, 12, 0, 0, 0);
    if (!Number.isNaN(d.getTime())) return d;
  }

  for (const [name, dow] of Object.entries(WEEKDAY_MAP)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(t)) {
      return nextWeekday(dow, now);
    }
  }

  return null;
}

function buildDateTime(date: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map((v) => Number(v));
  const result = new Date(date);
  result.setHours(h, m || 0, 0, 0);
  return result;
}

function formatDateLabel(date: Date, timeStr: string): string {
  const start = buildDateTime(date, timeStr);
  const datePart = new Intl.DateTimeFormat('es-MX', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start);
  const timePart = new Intl.DateTimeFormat('es-MX', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(start);
  return `${datePart} a las ${timePart}`;
}

function askForMissingFields(session: PickupSession): string {
  const missing: string[] = [];
  if (!session.name) missing.push('tu nombre');
  if (!session.preferredDate) missing.push('fecha preferida (Lunes, Miércoles o Viernes)');
  if (!session.preferredTime) missing.push('hora aproximada');
  if (!session.products) missing.push('qué productos vas a recoger');

  if (missing.length === 0) {
    return 'Gracias, estoy confirmando tu cita…';
  }

  return (
    `Para agendar tu recolección en almacén (${LOCATION}) necesito:\n` +
    missing.map((m, i) => `${i + 1}️⃣ ${m.charAt(0).toUpperCase()}${m.slice(1)}`).join('\n') +
    '\n\n📅 Horarios disponibles: **Lunes, Miércoles y Viernes**.'
  );
}

function startMessage(): string {
  return (
    '¡Con gusto te agendo una cita de recolección en nuestro almacén! 🕯\n\n' +
    `📍 ${LOCATION}\n` +
    '📅 Días disponibles: **Lunes, Miércoles y Viernes**\n\n' +
    'Compárteme por favor:\n' +
    '1️⃣ Tu nombre\n' +
    '2️⃣ Fecha preferida\n' +
    '3️⃣ Hora aproximada\n' +
    '4️⃣ Qué productos vas a recoger'
  );
}

async function getSession(sessionId: string): Promise<PickupSession | null> {
  const db = await getMongoDb();
  return db.collection<PickupSession>(COLLECTION).findOne({ sessionId });
}

async function saveSession(session: PickupSession): Promise<void> {
  const db = await getMongoDb();
  await db.collection<PickupSession>(COLLECTION).updateOne(
    { sessionId: session.sessionId },
    { $set: { ...session, updatedAt: new Date() } },
    { upsert: true },
  );
}

async function clearSession(sessionId: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection(COLLECTION).deleteOne({ sessionId });
}

function mergeFieldsFromMessage(session: PickupSession, message: string): PickupSession {
  const next = { ...session };
  const text = message.trim();

  if (!next.name) {
    const name = extractName(text);
    if (name) next.name = name;
  }

  if (!next.preferredDate) {
    const date = parsePreferredDate(text);
    if (date) next.preferredDate = date.toISOString().slice(0, 10);
  }

  if (!next.preferredTime) {
    const time = parseTimeFromMessage(text);
    if (time) next.preferredTime = time;
  }

  if (!next.products) {
    const productMatch = text.match(
      /(?:productos?|recoger|llevar(?:me|se)?|necesito|quiero)\s*[:\-]?\s*(.+)$/i,
    );
    if (productMatch?.[1] && productMatch[1].trim().length >= 3) {
      next.products = productMatch[1].trim();
    } else if (
      next.name &&
      next.preferredDate &&
      next.preferredTime &&
      text.length >= 8 &&
      !detectBiovelaPickupIntent(text)
    ) {
      next.products = text;
    }
  }

  return next;
}

export async function handleBiovelaPickupMessage(params: {
  message: string;
  senderId: string;
  senderName?: string;
  pageId: string;
  platform?: string;
}): Promise<{ handled: boolean; reply?: string }> {
  const message = params.message.trim();
  if (!message || !params.senderId || !params.pageId) {
    return { handled: false };
  }

  const sessionId = makeSessionId(params.senderId, params.pageId);
  let session = await getSession(sessionId);
  const intent = detectBiovelaPickupIntent(message);

  if (CANCEL_RE.test(message) && session?.step === 'collecting') {
    await clearSession(sessionId);
    return {
      handled: true,
      reply: 'Sin problema, cancelé el agendado de recolección. Si más adelante lo necesitas, escríbeme "agendar recolección".',
    };
  }

  if (!session && !intent) {
    return { handled: false };
  }

  if (!session && intent) {
    session = {
      sessionId,
      senderId: params.senderId,
      pageId: params.pageId,
      step: 'collecting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    session = mergeFieldsFromMessage(session, message);
    await saveSession(session);

    if (session.name && session.preferredDate && session.preferredTime && session.products) {
      // all in one message
    } else {
      return { handled: true, reply: startMessage() };
    }
  }

  if (!session) {
    return { handled: false };
  }

  if (session.step === 'done') {
    if (intent) {
      session = {
        sessionId,
        senderId: params.senderId,
        pageId: params.pageId,
        step: 'collecting',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      session = mergeFieldsFromMessage(session, message);
      await saveSession(session);
      return { handled: true, reply: startMessage() };
    }
    return { handled: false };
  }

  session = mergeFieldsFromMessage(session, message);
  if (!session.name && params.senderName && params.senderName !== params.senderId) {
    session.name = params.senderName;
  }

  if (!session.name || !session.preferredDate || !session.preferredTime || !session.products) {
    await saveSession(session);
    return { handled: true, reply: askForMissingFields(session) };
  }

  const date = new Date(`${session.preferredDate}T12:00:00`);
  const dow = weekdayInMexico(date);
  if (!ALLOWED_WEEKDAYS.has(dow)) {
    session.preferredDate = undefined;
    await saveSession(session);
    return {
      handled: true,
      reply:
        'Ese día no tenemos recolección en almacén. Solo agendamos **Lunes, Miércoles y Viernes**. ¿Qué fecha prefieres?',
    };
  }

  const start = buildDateTime(date, session.preferredTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  if (start.getTime() < Date.now() - 5 * 60 * 1000) {
    session.preferredDate = undefined;
    await saveSession(session);
    return {
      handled: true,
      reply: 'Esa fecha y hora ya pasaron. Indícame una fecha futura (Lunes, Miércoles o Viernes) y hora aproximada.',
    };
  }

  const whatsapp = formatWhatsApp(params.senderId);
  const customerName = session.name;
  const products = session.products;

  try {
    if (!isGoogleCalendarServiceAccountConfigured()) {
      throw new Error('Google Calendar no configurado');
    }

    const event = await createBiovelaPickupEvent({
      customerName,
      whatsapp,
      products,
      start,
      end,
    });

    try {
      await createAppointment({
        clientId: 'biovela',
        slotStart: start,
        slotEnd: end,
        senderId: params.senderId,
        senderName: customerName,
        platform: params.platform || 'whatsapp',
        pageId: params.pageId,
        googleEventId: event.id,
      });
    } catch (apptErr) {
      console.warn('[biovela-pickup] cita en MongoDB:', apptErr instanceof Error ? apptErr.message : apptErr);
    }

    session.step = 'done';
    await saveSession(session);

    const when = formatDateLabel(date, session.preferredTime);
    return {
      handled: true,
      reply:
        `✅ ¡Listo, ${customerName}! Tu cita de recolección quedó agendada:\n\n` +
        `📅 ${when}\n` +
        `📍 ${LOCATION}\n` +
        `📦 Productos: ${products}\n\n` +
        'Te esperamos con gusto. Si necesitas cambiarla, escribe *cancelar* y volvemos a agendar.',
    };
  } catch (err) {
    console.error('[biovela-pickup] error al crear evento:', err instanceof Error ? err.message : err);
    return {
      handled: true,
      reply:
        'Tu solicitud la recibí, pero hubo un problema al confirmar en calendario. ' +
        'Por favor escríbenos al WhatsApp +52 55 3448 9552 para confirmar tu cita manualmente.',
    };
  }
}
