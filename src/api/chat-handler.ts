import { generateGeminiReply } from '../lib/gemini';
import { getMongoDb } from '../../lib/mongodb';
import {
  buildSystemInstruction,
  resolveBusinessConfigByClientId,
} from '../lib/business-config';
import { getKnowledgeDocsForClient } from '../lib/knowledge-docs';
import {
  getOrCreateSession,
  getFollowUpInstruction,
  appendMessageToSession,
  type ChatSession,
} from '../lib/chat-sessions';
import { upsertLead, getLeadById, makeLeadIdFromParams, isBotPaused, updateLeadDocumentExpedient, updateLeadStatus, setBotPaused, type Lead } from '../lib/leads';
import { getBotGlobalPaused } from '../lib/bot-settings';
import { usesPanelConversations } from '../../lib/panel-conversations';
import {
  createAlertIfUrgent,
  createAlertForSaleClosed,
  createAlertForCPValidation,
  createAlertForLocationVerification,
  createAlertForDocumentsConfirmed,
  containsGoogleMapsLink,
  looksLikeSaleClosed,
  stripDecohousePauseMarker,
  replyHasDecohousePauseMarker,
  stripDecohouseInstallPhotoMarker,
  buildDecohouseFullContextForHeuristics,
  shouldQueueDecohouseQuoteReadyAlert,
  buildDecohouseQuoteReadyAlertSummary,
  upsertDecohouseLeadAlert,
} from '../lib/alerts';
import { classifyAndUpdateLead } from '../lib/lead-classifier';
import {
  tryCancelFromMessage,
  tryBookFromConfirmation,
  getAvailabilityForPrompt,
  storeOfferedSlots,
} from '../lib/appointment-flow';
import { getLoyaltyPoints, formatLoyaltyReply } from '../lib/loyalty';
import { handleConfirmationReply } from '../lib/noshow-confirmation';
import { handleBiovelaPickupMessage } from '../../lib/biovela-pickup-flow';
import {
  lookupCoverageByCP,
  formatCoverageContext,
  extractCPFromText,
} from '../lib/coverage-lookup';
import { isPromptInjectionAttempt, getSafeReply } from '../lib/input-sanitization';
import {
  extractDocDataFromImage,
  formatConfirmationMessage,
  formatContactRequestMessage,
  CONFIRMATION_SUCCESS_REPLY,
  PARTIAL_DOCUMENT_REPLY,
  RECOLLECTION_INCOMPLETE_REPLY,
  REQUEST_CONTACT_REPLY,
  REQUEST_PACKAGE_REPLY,
  mergeExtractedData,
  hasCompleteDocData,
  hasAllFiveDocData,
  hasCompleteExpedient,
  hasNameAndCURP,
  type ExtractedDocData,
} from '../lib/document-ocr';
// Izzi: base de conocimiento comercial
// (archivo JS generado por Claude y ubicado en src/lib).
// Se importa como any para no romper el tipado TS existente.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const knowledgeBaseIzzi: any = require('../lib/knowledge-base-izzi.js').default ??
  require('../lib/knowledge-base-izzi.js');

export type ChatRequestBody = {
  clientId?: unknown;
  platform?: unknown;
  entryType?: unknown;
  message?: unknown;
  senderId?: unknown;
  senderName?: unknown;
  pageId?: unknown;
  mediaBase64?: unknown;
  mimeType?: unknown;
};

const CHANNELS_MEDIA_URL = 'https://i.imgur.com/K2N4o04.jpeg';

function isChannelsIntent(message: string): boolean {
  const m = (message || '').toLowerCase().trim();
  return (
    /\bcanales?\b/i.test(m) ||
    /\bqu[eé]\s+canales?\s+inclu/i.test(m) ||
    /\blista\s+de\s+canales?\b/i.test(m) ||
    /\bprogramaci[oó]n\b/i.test(m) ||
    /\bqu[eé]\s+canales?\s+tienen/i.test(m) ||
    /\bcanales?\s+que\s+inclu/i.test(m) ||
    /\bqu[eé]\s+canales?\s+trae/i.test(m) ||
    /\bcanales?\s+incluidos?\b/i.test(m) ||
    /\bgu[ií]a\s+de\s+canales?\b/i.test(m)
  );
}

/** Normaliza datos de expediente (compatibilidad con docs sin paquete/promoción). */
function normalizeExtractedData(raw: Record<string, string>): ExtractedDocData {
  return {
    nombre: raw.nombre || 'NO_LEIBLE',
    curp: raw.curp || 'NO_LEIBLE',
    direccion: raw.direccion || 'NO_LEIBLE',
    telefono: raw.telefono || 'NO_LEIBLE',
    correo: raw.correo || 'NO_LEIBLE',
    paquete: raw.paquete || 'NO_ESPECIFICADO',
    promocion: raw.promocion || 'N/A',
  };
}

/** Extrae mención de paquete del texto con prioridad de intención.
 *
 * Prioridades:
 * 1. Intención explícita: "quiero el de 80 megas", "ese de 60", "el que dijiste de 80 megas"
 * 2. Paquete izzi con nombre real: "izzi 80", "izzi 60 + TV"
 * 3. Megas mencionadas que NO estén seguidas de "?" (no son una pregunta)
 * 4. Último recurso: turbo/paquete + número (puede ser pregunta — menos confiable)
 */
function extractPackageFromText(text: string): string | undefined {
  const t = text.trim();
  if (t.length < 3) return undefined;

  // 1. Intención explícita de selección: permite hasta 6 palabras entre el verbo y el número
  const intentMatch = t.match(
    /(?:quiero|deseo|el\s+de|dame|contrat(?:a|ar)|ese\s+de|mismo\s+de|el\s+que|dijiste\s+de)(?:\s+\w+){0,6}\s+(?:de\s+)?(\d+)\s*megas?/i
  );
  if (intentMatch) {
    const hasTV = /\+\s*(?:izzitv|tv|televisi[oó]n)/i.test(t);
    return hasTV ? `izzi ${intentMatch[1]} + TV` : `${intentMatch[1]} megas`;
  }

  // 2. Paquete izzi con nombre real ("izzi 80", "izzi 60")
  const izziMatch = t.match(/\bizzi\s+(\d+)/i);
  if (izziMatch) {
    const hasTV = /\+\s*(?:izzitv|tv|televisi[oó]n)/i.test(t);
    return hasTV ? `izzi ${izziMatch[1]} + TV` : `izzi ${izziMatch[1]}`;
  }

  // 3. Megas que NO estén en contexto de pregunta (no seguidas de "?")
  const megasAll = [...t.matchAll(/(\d+)\s*megas?/gi)];
  for (const m of megasAll) {
    const after = t.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 3);
    if (!after.includes('?')) return `${m[1]} megas`;
  }

  // 4. Último recurso: turbo/paquete + número SIN "?" inmediato
  const turboMatch = t.match(/(?:turbo|paquete)\s*(?:de\s*)?(\d+)(?!\?)/i);
  if (turboMatch) return `${turboMatch[1]} megas`;

  return undefined;
}

/** Extrae correo y teléfono de un mensaje de texto para completar expediente. */
function extractContactFromText(text: string): { correo?: string; telefono?: string } {
  const result: { correo?: string; telefono?: string } = {};
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/i);
  if (emailMatch) result.correo = emailMatch[0].toLowerCase().trim();

  // Eliminar emails y combinaciones letra+dígito para no contaminar la búsqueda de teléfono
  const cleaned = text
    .replace(/[\w.-]+@[\w.-]+\.\w+/gi, ' ')
    .replace(/[a-zA-Z]\d+/g, ' ')
    .replace(/\d+[a-zA-Z]/g, ' ');

  // Buscar primero por segmento (cada línea/frase separada por coma/punto y coma)
  for (const seg of cleaned.split(/[\n,;]+/)) {
    const digits = seg.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 12) {
      result.telefono = `+52${digits.slice(-10)}`;
      break;
    }
  }

  // Fallback: patrón flexible de 10 dígitos con separadores opcionales (2-4-4, 3-3-4, etc.)
  if (!result.telefono) {
    const m = cleaned.match(/\d[\d\s.-]{6,14}\d/g);
    if (m) {
      for (const candidate of m) {
        const digits = candidate.replace(/\D/g, '');
        if (digits.length >= 10) { result.telefono = `+52${digits.slice(-10)}`; break; }
      }
    }
  }

  return result;
}

function inferTags(message: string): string[] {
  const tags = new Set<string>();
  const text = message.toLowerCase();
  if (/\bizzi\b/i.test(message)) tags.add('izzi');
  if (
    /bienes\s*ra[ií]ces|inmobiliari|inmueble|propiedad|casa|departamento|depa|terreno|lote|hipoteca|renta|alquiler|arrend|venta\s+de\s+casa|comprar\s+casa|vender\s+casa/i.test(
      text
    )
  ) {
    tags.add('bienes_raices');
  }
  return [...tags];
}

async function saveLead(params: {
  clientId: string;
  platform: string;
  entryType: string;
  message: string;
  reply: string;
  tags: string[];
  headers: Headers;
}) {
  const db = await getMongoDb();
  const ip = params.headers.get('x-forwarded-for') ?? params.headers.get('x-real-ip');
  await db.collection('leads_agentia').insertOne({
    clientId: params.clientId,
    platform: params.platform,
    entryType: params.entryType,
    message: params.message,
    reply: params.reply,
    tags: params.tags,
    createdAt: new Date(),
    route: '/api/chat',
    userAgent: params.headers.get('user-agent'),
    ip: ip ?? null,
  });
}

function estimateTokens(text: string): number {
  const t = text?.trim() ?? '';
  if (!t) return 0;
  return Math.ceil(t.length / 4);
}

async function saveUsageLog(params: {
  clientId: string;
  platform: string;
  entryType: string;
  messageCount: number;
  inputTokensEstimated: number;
  outputTokensEstimated: number;
  totalTokensEstimated: number;
}) {
  const db = await getMongoDb();
  await db.collection('usage_logs').insertOne({
    ...params,
    createdAt: new Date(),
  });
}

function normalizePlatform(input: string): 'facebook' | 'instagram' | 'whatsapp' | null {
  const v = input.trim().toLowerCase();
  if (v === 'facebook' || v === 'instagram' || v === 'whatsapp') return v;
  return null;
}

function normalizeEntryType(input: string): 'comment' | 'dm' | null {
  const v = input.trim().toLowerCase();
  if (v === 'comment' || v === 'dm') return v;
  return null;
}

function buildChannelInstruction(params: {
  platform: 'facebook' | 'instagram' | 'whatsapp';
  entryType: 'comment' | 'dm';
}): string {
  if (params.entryType === 'comment') {
    return [
      `## Canal\nplatform: ${params.platform}\nentryType: comment`,
      `## Formato para comentario público`,
      `- Responde en máximo 2 frases.`,
      `- Termina SIEMPRE invitando a revisar bandeja de entrada (DM).`,
    ].join('\n');
  }
  const base = [
    `## Canal\nplatform: ${params.platform}\nentryType: dm`,
    `## Formato para DM: Senior Sales Closer, persuasivo, pide teléfono en 2-3 turnos.`,
  ];
  if (params.platform === 'whatsapp') {
    base.push(
      `- WhatsApp: respuestas CORTAS (máx 3 líneas). Tono humano, usa emojis con moderación.`
    );
  }
  return base.join('\n');
}

function formatCommentReply(rawReply: string): string {
  const text = String(rawReply ?? '').trim();
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const first = sentences[0] ?? '¡Hola! Con gusto te ayudo.';
  return `${first} Revisa tu bandeja de entrada (DM) y con gusto te paso precios y detalles.`.trim();
}

export async function handleChat(params: {
  body: ChatRequestBody;
  headers: Headers;
}): Promise<{ status: number; json: object }> {
  const { body, headers } = params;
  const clientIdRaw = body?.clientId;
  const platformRaw = body?.platform;
  const entryTypeRaw = body?.entryType;
  const message = body?.message;
  const senderId = typeof body?.senderId === 'string' ? body.senderId.trim() : undefined;
  const senderName = typeof body?.senderName === 'string' ? body.senderName.trim() : undefined;
  const pageId = typeof body?.pageId === 'string' ? body.pageId.trim() : undefined;

  if (typeof clientIdRaw !== 'string' || !clientIdRaw.trim()) {
    return { status: 400, json: { error: 'clientId requerido' } };
  }
  const clientId = clientIdRaw.trim().toLowerCase();

  if (typeof platformRaw !== 'string' || !normalizePlatform(platformRaw)) {
    return { status: 400, json: { error: 'platform debe ser: facebook|instagram|whatsapp' } };
  }
  if (typeof entryTypeRaw !== 'string' || !normalizeEntryType(entryTypeRaw)) {
    return { status: 400, json: { error: 'entryType debe ser: comment|dm' } };
  }
  const mediaBase64 = typeof body?.mediaBase64 === 'string' ? body.mediaBase64.trim() : null;
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : 'image/jpeg';

  if (typeof message !== 'string') {
    return { status: 400, json: { error: 'message requerido' } };
  }
  const userMessage = String(message || '').trim();
  if (!userMessage && !mediaBase64) {
    return { status: 400, json: { error: 'message o mediaBase64 requerido' } };
  }

  const platform = normalizePlatform(platformRaw)!;
  const entryType = normalizeEntryType(entryTypeRaw)!;
  const effectiveMessage = userMessage || '[imagen/documento adjunto]';

  const leadId = senderId && pageId ? makeLeadIdFromParams(senderId, pageId, clientId) : '';

  // KILL SWITCH (Cadenero) - Bloqueo infalible: si el bot está pausado, NO procesar NADA
  const globalPaused = await getBotGlobalPaused(clientId);
  if (globalPaused) {
    console.log('[chat-handler] Kill switch GLOBAL activo - bot pausado para clientId:', clientId);
    return { status: 200, json: { clientId, reply: '', botPaused: true } };
  }
  if (leadId) {
    const lead = await getLeadById(leadId);
    if (isBotPaused(lead)) {
      console.log('[chat-handler] Kill switch LEAD activo - bot pausado para leadId:', leadId);
      if (usesPanelConversations(clientId) && senderId) {
        const skipPushNotification = clientId === 'cwf' && pageId === 'whatsapp-cloud';
        void import('../../lib/panel-conversations')
          .then(({ recordPanelInboundWhilePaused, platformToChannel }) =>
            recordPanelInboundWhilePaused({
              clientId,
              senderId,
              senderName,
              pageId,
              platform,
              channel: platformToChannel(platform),
              message: effectiveMessage,
              skipPushNotification,
            })
          )
          .catch(() => {});
      }
      return { status: 200, json: { clientId, reply: '', botPaused: true } };
    }
  }

  // CAPA 1: El Cadenero - Bloqueo anti prompt-injection (solo para texto)
  if (userMessage && isPromptInjectionAttempt(userMessage)) {
    console.warn('[chat-handler] Intento de prompt injection bloqueado:', userMessage.slice(0, 80));
    return { status: 200, json: { clientId, reply: getSafeReply() } };
  }

  // COMANDO: Mis Puntos (sistema de lealtad)
  if (senderId && /\bmis\s*puntos?\b/i.test(userMessage)) {
    try {
      const visits = await getLoyaltyPoints(senderId, clientId);
      const reply = formatLoyaltyReply(visits, senderName);
      return { status: 200, json: { clientId, reply } };
    } catch (loyaltyErr) {
      console.error('[chat-handler] Error loyalty:', loyaltyErr instanceof Error ? loyaltyErr.message : loyaltyErr);
    }
  }

  // RESPUESTA: CONFIRMAR / REPROGRAMAR (anti no-show)
  if (senderId && userMessage && /\b(CONFIRMAR|REPROGRAMAR)\b/i.test(userMessage)) {
    try {
      const confirmReply = await handleConfirmationReply(senderId, userMessage, clientId);
      if (confirmReply) {
        return { status: 200, json: { clientId, reply: confirmReply } };
      }
    } catch (confirmErr) {
      console.error('[chat-handler] Error confirmation reply:', confirmErr instanceof Error ? confirmErr.message : confirmErr);
    }
  }

  // Biovela: agendar recolección en almacén (Lun/Mie/Vie)
  if (
    clientId === 'biovela' &&
    senderId &&
    pageId &&
    userMessage &&
    !mediaBase64
  ) {
    try {
      const pickup = await handleBiovelaPickupMessage({
        message: userMessage,
        senderId,
        senderName,
        pageId,
        platform,
      });
      if (pickup.handled && pickup.reply) {
        return { status: 200, json: { clientId, reply: pickup.reply } };
      }
    } catch (pickupErr) {
      console.error('[chat-handler] biovela pickup:', pickupErr instanceof Error ? pickupErr.message : pickupErr);
    }
  }

  try {
  const isConfirmation = /\b(s[ií]|si|es correcto|correcto|est[aá] bien|estan bien|ok|confirmo|confirmado)\b/i.test(userMessage);
  if (leadId && isConfirmation && !mediaBase64) {
    const db = await getMongoDb();
    const pending = await db.collection('document_pending_confirmations').findOne({ leadId });
    const rawData = pending?.extractedData as Record<string, string> | undefined;
    const data = rawData ? normalizeExtractedData(rawData) : undefined;
    if (data && hasCompleteExpedient(data)) {
      await db.collection('document_pending_confirmations').deleteOne({ leadId });
      createAlertForDocumentsConfirmed({
        leadId,
        clientId,
        senderId,
        senderName,
        platform,
        extractedData: data,
      }).catch(() => {});
      console.log('[chat-handler] 📋 Documentos confirmados - Datos para Izzi:', JSON.stringify(data, null, 2));
      const tags = inferTags(effectiveMessage);
      Promise.allSettled([
        saveLead({
          clientId,
          platform,
          entryType,
          message: effectiveMessage,
          reply: CONFIRMATION_SUCCESS_REPLY,
          tags,
          headers,
        }),
        senderId && pageId
          ? upsertLead({
              senderId,
              pageId,
              clientId,
              senderName,
              platform,
              message: effectiveMessage,
              reply: CONFIRMATION_SUCCESS_REPLY,
              tags,
            })
          : Promise.resolve(),
      ])
        .then(() => {
          // Mover lead a Cierres en el pipeline al confirmar documentos.
          if (clientId === 'izzi' && leadId) {
            updateLeadStatus(leadId, 'cierres', { clientId }).catch(() => {});
          }
        })
        .catch(() => {});
      return { status: 200, json: { clientId, reply: CONFIRMATION_SUCCESS_REPLY } };
    }
  }

  // Flujo recolección: usuario envía texto (correo/teléfono/paquete) para completar expediente
  if (leadId && clientId === 'izzi' && userMessage && !mediaBase64) {
    const db = await getMongoDb();
    const pending = await db.collection('document_pending_confirmations').findOne({ leadId });
    const raw = pending?.extractedData as Record<string, string> | undefined;
    const data = raw ? normalizeExtractedData(raw) : undefined;
    if (data && hasCompleteDocData(data)) {
      const extracted = extractContactFromText(userMessage);
      const paqueteFromText = extractPackageFromText(userMessage);
      const updated: ExtractedDocData = { ...data };
      let changed = false;
      if (!hasAllFiveDocData(data)) {
        const needsCorreo = !data.correo || data.correo === 'NO_LEIBLE' || /no_leible|pendiente\.com/i.test(data.correo);
        const needsTelefono = !data.telefono || data.telefono === 'NO_LEIBLE';
        if (needsCorreo && extracted.correo) { updated.correo = extracted.correo; changed = true; }
        if (needsTelefono && extracted.telefono) { updated.telefono = extracted.telefono; changed = true; }
      }
      if ((hasAllFiveDocData(updated) || hasAllFiveDocData(data)) && (!data.paquete || data.paquete === 'NO_ESPECIFICADO') && paqueteFromText) {
        updated.paquete = paqueteFromText;
        changed = true;
      }
      if (changed) {
        await db.collection('document_pending_confirmations').updateOne(
          { leadId },
          { $set: { leadId, extractedData: updated, updatedAt: new Date() } },
          { upsert: true }
        );
        await updateLeadDocumentExpedient(leadId, updated).catch(() => {});
        let reply: string;
        if (hasCompleteExpedient(updated)) {
          reply = formatConfirmationMessage(updated);
        } else if (hasAllFiveDocData(updated)) {
          reply = REQUEST_PACKAGE_REPLY;
        } else {
          reply = REQUEST_CONTACT_REPLY;
        }
        const tags = inferTags(effectiveMessage);
        Promise.allSettled([
          saveLead({ clientId, platform, entryType, message: effectiveMessage, reply, tags, headers }),
          upsertLead({
            senderId: senderId!,
            pageId: pageId!,
            clientId,
            senderName,
            platform,
            message: effectiveMessage,
            reply,
            tags,
          }),
        ]).catch(() => {});
        return { status: 200, json: { clientId, reply } };
      }
    }
  }

  // Flujo OCR: imagen recibida (agregación de múltiples fotos: frente/reverso INE)
  // RESTRICCIÓN: Con imagen + izzi, NUNCA pasar al LLM; solo procesamiento programático.
  if (mediaBase64 && clientId === 'izzi') {
    if (!leadId) {
      return { status: 200, json: { clientId, reply: RECOLLECTION_INCOMPLETE_REPLY } };
    }
    try {
      const db = await getMongoDb();
      const existing = await db.collection('document_pending_confirmations').findOne({ leadId });
      const existingRaw = existing?.extractedData as Record<string, string> | undefined;
      const existingData = existingRaw ? normalizeExtractedData(existingRaw) : null;

      const userPhone = senderId?.replace(/@.*$/, '').replace(/\D/g, '') || undefined;
      const incomingData = await extractDocDataFromImage(mediaBase64, mimeType, userPhone);
      const mergedData = mergeExtractedData(existingData, incomingData);

      await db.collection('document_pending_confirmations').updateOne(
        { leadId },
        { $set: { leadId, extractedData: mergedData, updatedAt: new Date() } },
        { upsert: true }
      );
      await updateLeadDocumentExpedient(leadId, mergedData).catch(() => {});

      let reply: string;
      if (hasCompleteExpedient(mergedData)) {
        reply = formatConfirmationMessage(mergedData);
      } else if (hasAllFiveDocData(mergedData)) {
        reply = REQUEST_PACKAGE_REPLY;
      } else if (hasCompleteDocData(mergedData)) {
        reply = formatContactRequestMessage(mergedData); // muestra datos extraídos + pide lo que falta
      } else if (hasNameAndCURP(mergedData)) {
        reply = RECOLLECTION_INCOMPLETE_REPLY;
      } else {
        reply = PARTIAL_DOCUMENT_REPLY;
      }

      const tags = inferTags(effectiveMessage);
      Promise.allSettled([
        saveLead({ clientId, platform, entryType, message: effectiveMessage, reply, tags, headers }),
        upsertLead({
          senderId: senderId!,
          pageId: pageId!,
          clientId,
          senderName,
          platform,
          message: effectiveMessage,
          reply,
          tags,
        }),
      ]).catch(() => {});
      return { status: 200, json: { clientId, reply } };
    } catch (ocrErr) {
      console.error('[chat-handler] Error OCR modelo:', ocrErr instanceof Error ? ocrErr.message : ocrErr);
      console.error('[chat-handler] Error OCR stack:', ocrErr instanceof Error ? ocrErr.stack : '(no stack)');
      console.error('[chat-handler] mediaBase64 length:', mediaBase64?.length, '| mimeType:', mimeType);
      return { status: 200, json: { clientId, reply: RECOLLECTION_INCOMPLETE_REPLY } };
    }
  }

    const cfg = await resolveBusinessConfigByClientId(clientId);
    if (!cfg) {
      // Fallback operativo: algunos tenants demo (ej. DecoHouse) pueden usar el bridge
      // antes de que se cree su documento en `business_configs`. No debemos tumbar la operación.
      if (clientId === 'decohouse') {
        const reply =
          '¡Hola! Soy el asistente de DecoHouse. 👋\n' +
          'En este momento estamos terminando la configuración del bot.\n' +
          '¿Me dices qué necesitas (muebles, decoración o asesoría)?';
        return { status: 200, json: { clientId, reply } };
      }
      return {
        status: 404,
        json: {
          error: `No existe config para clientId='${clientId}'. Crea un documento en MongoDB (business_configs) con clientId "${clientId}" o ejecuta: node scripts/seed-business-configs.js`,
        },
      };
    }

    if (senderId && pageId) {
      const cancelResult = await tryCancelFromMessage(effectiveMessage, senderId, pageId, clientId);
      if (cancelResult.cancelled) {
        const tags = inferTags(effectiveMessage);
        Promise.allSettled([
          saveLead({ clientId, platform, entryType, message: effectiveMessage, reply: cancelResult.reply!, tags, headers }),
          upsertLead({ senderId, pageId, clientId, senderName, platform, message: effectiveMessage, reply: cancelResult.reply!, tags }),
        ]).catch(() => {});
        return { status: 200, json: { clientId, reply: cancelResult.reply } };
      }

      const sessionId = `${senderId}_${pageId}_${clientId}`;
      const bookResult = await tryBookFromConfirmation(
        effectiveMessage,
        sessionId,
        senderId,
        senderName,
        pageId,
        clientId,
        platform
      );
      if (bookResult.booked && bookResult.reply) {
        const tags = inferTags(effectiveMessage);
        Promise.allSettled([
          saveLead({ clientId, platform, entryType, message: effectiveMessage, reply: bookResult.reply, tags, headers }),
          upsertLead({ senderId, pageId, clientId, senderName, platform, message: effectiveMessage, reply: bookResult.reply, tags }),
        ]).catch(() => {});
        return { status: 200, json: { clientId, reply: bookResult.reply } };
      }
    }

    let session: (ChatSession & { _isReturningUser?: boolean }) | null = null;
    if (senderId && pageId) {
      session = await getOrCreateSession({
        senderId,
        pageId,
        clientId,
        platform,
        message: effectiveMessage,
      });
    }

    let availabilityBlock = '';
    if (clientId !== 'biovela' && /cita|agendar|disponibilidad|horario|hora/i.test(effectiveMessage)) {
      const sessionId = senderId && pageId ? `${senderId}_${pageId}_${clientId}` : '';
      let date = new Date();
      if (/mañana|manana/i.test(effectiveMessage)) {
        date.setDate(date.getDate() + 1);
      }
      const dateStr = date.toISOString().slice(0, 10);
      availabilityBlock = await getAvailabilityForPrompt(clientId, dateStr);
      const slots = await import('../lib/appointments').then((m) => m.getAvailableSlots(clientId, new Date(dateStr)));
      if (sessionId && slots.length > 0) {
        await storeOfferedSlots(sessionId, slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })));
      }
      availabilityBlock = `\n\n## Calendario\n${availabilityBlock}`;
    }

    const extraKnowledge = await getKnowledgeDocsForClient(clientId);
    const { systemInstruction, modelId } = buildSystemInstruction({
      clientId,
      config: cfg,
      extraKnowledge: extraKnowledge || undefined,
    });
    const channelInstruction = buildChannelInstruction({ platform, entryType });
    let finalSystemInstruction = `${systemInstruction}\n\n${channelInstruction}${availabilityBlock}`.trim();
    if (session) {
      finalSystemInstruction += `\n\n## Estado: ${session.currentStep}`;
      finalSystemInstruction += getFollowUpInstruction(session, clientId);
    }

    // Para izzi, inyectar la base de conocimiento estructurada (precios, promociones, reglas).
    if (clientId === 'izzi' && knowledgeBaseIzzi) {
      try {
        const kbJson = JSON.stringify(knowledgeBaseIzzi, null, 2);
        const fallback =
          (knowledgeBaseIzzi.META && knowledgeBaseIzzi.META.fallbackMessage) ||
          (knowledgeBaseIzzi.REGLAS_BOT && knowledgeBaseIzzi.REGLAS_BOT.fallbackResponse) ||
          'Déjame consultar para darte la información exacta.';
        finalSystemInstruction += `\n\n## BASE_DE_CONOCIMIENTO_IZZI (NO INVENTES DATOS FUERA DE ESTO)\n${kbJson}\n\n` +
          `REGLA CRITICA: Si el cliente pregunta algo que NO esté explícitamente cubierto en esta base de conocimiento, responde exactamente: \"${fallback}\".\n\n` +
          `## REGLA ABSOLUTA – CLIENTES ACTIVOS IZZI\n` +
          `Este canal de WhatsApp es EXCLUSIVAMENTE para contrataciones NUEVAS.\n` +
          `Si el cliente YA TIENE servicio izzi activo y solicita: aplicar una nueva promoción a su servicio actual, pagar su recibo, reportar una falla o presentar una queja → responde EXACTAMENTE:\n` +
          `"Este número es exclusivo para contrataciones nuevas. Para cualquier gestión en tu servicio actual, comunícate al 800-120-5000, con gusto te atienden ahí."\n` +
          `ÚNICA EXCEPCIÓN PERMITIDA para clientes activos: ofrecerles una línea izzi Móvil adicional si no la tienen.\n` +
          `NO tramites ni prometas ninguna otra gestión para clientes con servicio activo.`;
      } catch {
        // Si por alguna razón no se puede serializar, continuamos sin bloquear el flujo.
      }
    }

    const existingLead = leadId ? await getLeadById(leadId) : null;

    if (clientId === 'izzi' && leadId) {
      const db = await getMongoDb();
      const pending = await db.collection('document_pending_confirmations').findOne({ leadId });
      const expRaw = pending?.extractedData as Record<string, string> | undefined;
      const expedient = expRaw ? normalizeExtractedData(expRaw) : existingLead?.documentExpedient;
      if (expedient && (expedient.nombre !== 'NO_LEIBLE' || expedient.curp !== 'NO_LEIBLE')) {
        const lines: string[] = ['## DATOS YA RECOLECTADOS (NO VOLVER A PEDIR)'];
        if (expedient.nombre !== 'NO_LEIBLE') lines.push(`- Nombre: ${expedient.nombre}`);
        if (expedient.curp !== 'NO_LEIBLE') lines.push(`- CURP: ${expedient.curp}`);
        if (expedient.direccion !== 'NO_LEIBLE') lines.push(`- Direccion: ${expedient.direccion}`);
        if (expedient.telefono !== 'NO_LEIBLE') lines.push(`- Telefono: ${expedient.telefono}`);
        if (expedient.correo !== 'NO_LEIBLE' && !/no_leible|pendiente\.com/i.test(expedient.correo)) lines.push(`- Correo: ${expedient.correo}`);
        if (expedient.paquete && expedient.paquete !== 'NO_ESPECIFICADO') lines.push(`- Paquete: ${expedient.paquete}`);
        finalSystemInstruction += '\n\n' + lines.join('\n');
        // Anti-bucle: no pedir documentación si ya está recibida (INE frontal+reverso)
        if (hasNameAndCURP(expedient)) {
          finalSystemInstruction += '\n\nREGLA ANTI-BUCLE: El usuario ya envió documentación (INE frontal y/o reverso). NO vuelvas a pedir INE, credencial ni comprobante de domicilio a menos que falte un dato concreto que se indique arriba.';
        }
      }
    }

    // Historial completo de la sesión (hasta 10 pares) para que Gemini no olvide
    const conversationMessages: { role: 'user' | 'assistant'; content: string }[] =
      session?.recentMessages && session.recentMessages.length > 0
        ? session.recentMessages
        : existingLead?.lastMessage && existingLead?.lastReply
          ? [
              { role: 'user', content: existingLead.lastMessage },
              { role: 'assistant', content: existingLead.lastReply },
            ]
          : [];

    let cpFromConversation: string | null = extractCPFromText(userMessage);
    if (!cpFromConversation && existingLead?.lastMessage) {
      cpFromConversation = extractCPFromText(existingLead.lastMessage);
    }
    if (cpFromConversation) {
      console.log(`🔍 [chat-handler] CP extraído del mensaje: "${cpFromConversation}"`);
    }
    if (cpFromConversation && clientId === 'izzi') {
      const coverageResult = await lookupCoverageByCP(clientId, cpFromConversation);
      console.log(
        `✅ [chat-handler] Resultado para ${cpFromConversation}: ${coverageResult.found ? (coverageResult as { tipo: string }).tipo : 'no encontrado'}`
      );
      const coverageBlock = formatCoverageContext(coverageResult);
      finalSystemInstruction += `\n\n${coverageBlock}`;
      if (!coverageResult.found && leadId) {
        createAlertForCPValidation({
          leadId,
          clientId,
          senderName: existingLead?.senderName,
          lastMessage: userMessage,
          platform,
          cp: cpFromConversation,
        }).catch(() => {});
      }
    }

    if (mediaBase64 && mimeType && clientId !== 'decohouse') {
      finalSystemInstruction += `

## REGLA CRITICA - IMAGEN/DOCUMENTO RECIBIDO
REGLA ANTI-ALUCINACION: Extrae UNICAMENTE el texto visible y legible en la imagen. ESTA ESTRICTAMENTE PROHIBIDO inventar, deducir o autocompletar direcciones, nombres o numeros. Si un dato no esta claro, omitelo.

El usuario acaba de enviar una imagen o documento. DEBES:
1. Extraer los datos mediante OCR de la imagen (INE, comprobante, etc.).
2. Responder UNICAMENTE con la plantilla de confirmacion en MAYUSCULAS Y SIN ACENTOS:
   NOMBRE: [valor]
   CURP: [valor]
   DIRECCION: [valor]
   TELEFONO: [valor]
   CORREO: [valor]
   ¿Son correctos? (Responde Si o No)
3. NO avances a pedir correo, fechas ni otros datos hasta que el usuario confirme con "si" o "es correcto".`;
    }

    const MAX_SYSTEM_CHARS = 120000;
    if (finalSystemInstruction.length > MAX_SYSTEM_CHARS) {
      console.warn(
        `[chat-handler] System instruction excede límite (${finalSystemInstruction.length} > ${MAX_SYSTEM_CHARS}). Truncando.`
      );
      finalSystemInstruction =
        finalSystemInstruction.slice(0, MAX_SYSTEM_CHARS) +
        "\n\n[... contenido truncado por límite de tokens ...]";
    }

    let reply: string;
    try {
      reply = await generateGeminiReply({
        userMessage: userMessage,
        systemInstruction: finalSystemInstruction,
        modelId,
        messages: conversationMessages.length > 0 ? conversationMessages : undefined,
        ...(mediaBase64 && mimeType ? { mediaBase64, mimeType } : {}),
      });
    } catch (geminiErr) {
      console.log("=== ERROR FATAL EN API CHAT (Gemini) ===");
      console.error(geminiErr);
      console.log("Stack:", geminiErr instanceof Error ? geminiErr.stack : "(no stack)");
      console.log("=======================");
      throw geminiErr;
    }
    const decoCatalogPause = clientId === 'decohouse' && leadId && replyHasDecohousePauseMarker(reply);
    if (decoCatalogPause) {
      await setBotPaused(leadId, true).catch(() => {});
    }
    const replyForClient = stripDecohouseInstallPhotoMarker(stripDecohousePauseMarker(reply));
    const finalReply = entryType === 'comment' ? formatCommentReply(replyForClient) : replyForClient;
    const tags = inferTags(message);

    // Persistir el turno en el historial de la sesión para la próxima llamada
    if (session?.sessionId) {
      appendMessageToSession(session.sessionId, userMessage, finalReply).catch(() => {});
    }

    if (usesPanelConversations(clientId) && senderId) {
      const skipPushNotification = clientId === 'cwf' && pageId === 'whatsapp-cloud';
      void import('../../lib/panel-conversations')
        .then(({ appendPanelConversationTurn, platformToChannel }) =>
          appendPanelConversationTurn({
            clientId,
            senderId,
            senderName,
            pageId,
            platform,
            channel: platformToChannel(platform),
            userMessage,
            botReply: finalReply,
            skipPushNotification,
          })
        )
        .catch(() => {});
    }

    const inputTokensEstimated =
      estimateTokens(finalSystemInstruction) + estimateTokens(message);
    const outputTokensEstimated = estimateTokens(finalReply);

    const nextMessageCount = (existingLead?.messageCount ?? 0) + 1;

    Promise.allSettled([
      saveLead({ clientId, platform, entryType, message, reply: finalReply, tags, headers }),
      senderId && pageId
        ? upsertLead({
            senderId,
            pageId,
            clientId,
            senderName,
            platform,
            message,
            reply: finalReply,
            tags,
          })
        : Promise.resolve(),
      saveUsageLog({
        clientId,
        platform,
        entryType,
        messageCount: 2,
        inputTokensEstimated,
        outputTokensEstimated,
        totalTokensEstimated: inputTokensEstimated + outputTokensEstimated,
      }),
      leadId && clientId !== 'decohouse'
        ? createAlertIfUrgent({
            leadId,
            clientId,
            senderName,
            lastMessage: userMessage,
            platform,
            messageCount: nextMessageCount,
            assignedTo: existingLead?.assignedTo,
          })
        : Promise.resolve(),
      leadId && clientId === 'izzi' && containsGoogleMapsLink(userMessage)
        ? createAlertForLocationVerification({
            leadId,
            clientId,
            senderName: existingLead?.senderName ?? senderName,
            lastMessage: userMessage,
            platform,
          })
        : Promise.resolve(),
      leadId && clientId === 'izzi' && looksLikeSaleClosed(userMessage)
        ? createAlertForSaleClosed({
            leadId,
            clientId,
            senderId,
            senderName,
            lastMessage: userMessage,
            platform,
          })
        : Promise.resolve(),
      leadId && !existingLead?.assignedTo
        ? classifyAndUpdateLead({
            leadId,
            lastUserMessage: userMessage,
            lastBotReply: finalReply,
            messageCount: nextMessageCount,
            currentStatus: existingLead?.status ?? 'nuevos',
          })
        : Promise.resolve(),
    ]).catch(() => {});

    // Alertas Deco House: solo con datos listos para cotizar + cierre Elisa (BLOQUE 5) o pausa gerencia; nunca por volumen de mensajes.
    if (clientId === 'decohouse' && leadId) {
      const decoFullContext = buildDecohouseFullContextForHeuristics({
        conversationMessages,
        userMessage,
        botReply: finalReply,
      });
      if (
        shouldQueueDecohouseQuoteReadyAlert({
          fullContext: decoFullContext,
          rawBotReply: reply,
          finalBotReply: finalReply,
        })
      ) {
        void upsertDecohouseLeadAlert({
          leadId,
          clientId,
          senderId,
          senderName,
          platform,
          summary: buildDecohouseQuoteReadyAlertSummary({
            senderName,
            existingLead,
            fullContext: decoFullContext,
            userMessage,
            botReply: finalReply,
            rawBotReply: reply,
          }),
        }).catch(() => {});
      }
    }

    const responseJson: { clientId: string; reply: string; mediaUrl?: string } = {
      clientId,
      reply: finalReply,
    };
    if (clientId === 'izzi' && isChannelsIntent(userMessage)) {
      responseJson.mediaUrl = CHANNELS_MEDIA_URL;
      console.log('[chat-handler] Intención canales detectada, inyectando mediaUrl');
    }
    return { status: 200, json: responseJson };
  } catch (err) {
    console.log("=== ERROR FATAL EN API CHAT ===");
    console.error(err);
    console.log("Stack:", err instanceof Error ? err.stack : "(no stack)");
    console.log("=======================");
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return { status: 500, json: { error: msg } };
  }
}
