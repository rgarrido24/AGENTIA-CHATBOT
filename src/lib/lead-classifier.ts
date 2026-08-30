import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { updateLeadStatus, type PipelineStatus } from './leads';
import { extractCPFromText } from './coverage-lookup';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const PIPELINE_STATUSES: PipelineStatus[] = ['nuevos', 'preguntones', 'seguimiento', 'interesado', 'cierres', 'cancelados'];

/** Reglas para embudo automático: si coinciden, se usa el status sin llamar a la IA. */
export function inferStatusFromRules(params: {
  lastUserMessage: string;
  lastBotReply: string;
  messageCount: number;
}): PipelineStatus | null {
  const msg = (params.lastUserMessage || '').toLowerCase().trim();
  const botReply = (params.lastBotReply || '').toLowerCase().trim();
  const count = params.messageCount ?? 0;

  // Cancelados: rechazo explícito
  if (
    /\b(no\s+quiero|no\s+me\s+interesa|no\s+gracias|cancelar|no\s+procedo|no\s+contrato|descarto|no\s+me\s+interesa|sin\s+cobertura|no\s+hay\s+cobertura)\b/i.test(msg)
  ) {
    return 'cancelados';
  }

  // Cierres: intención de contratar ya
  if (
    /\b(quiero\s+contratar|contrato\s+ya|me\s+apunto|acepto|sí\s+quiero|si\s+quiero|dame\s+el\s+paquete|quiero\s+ese|confirmo|procedo|envío\s+documentos|mando\s+documentos)\b/i.test(msg)
  ) {
    return 'cierres';
  }

  // Interesado: CP válido (5 dígitos) o interés en paquetes/precios
  const cp = extractCPFromText(params.lastUserMessage);
  if (cp) return 'interesado';
  if (
    /\b(paquete|precio|cuánto|costo|planes|internet|televisión|tv|instalación|cobertura|me\s+interesa|quiero\s+saber)\b/i.test(msg)
  ) {
    return 'interesado';
  }

  // Preguntones: bot pide CP o preguntas generales (primeros mensajes)
  if (botReply.includes('código postal') || botReply.includes('código post') || /dame\s+tu\s+cp|¿cuál\s+es\s+tu\s+cp/i.test(botReply)) {
    return 'preguntones';
  }
  if (
    count <= 3 &&
    /\b(hola|buenas|buenos\s+días|qué\s+tal|información|info|saben|tienen|ofrecen)\b/i.test(msg)
  ) {
    return 'preguntones';
  }

  // Nuevos: primer mensaje
  if (count <= 1) {
    return 'nuevos';
  }

  return null;
}

const CLASSIFY_PROMPT = `Eres un clasificador de leads para un CRM. Dado el último mensaje del cliente y la respuesta del bot, determina en qué etapa del pipeline está el lead.

Columnas del pipeline:
- nuevos: Primer contacto, mensaje inicial, saludo genérico.
- preguntones: Hace preguntas exploratorias pero sin compromiso, tono frío o distante.
- seguimiento: Hay interés moderado, sigue la conversación, pide más info.
- interesado: Alto interés, pregunta precios/paquetes, quiere contratar, pide detalles de instalación.
- cierres: Aceptó la oferta, envió documentos, confirmó compra/contrato.
- cancelados: El cliente NO tiene cobertura y rechazó la oferta de TV; o dijo explícitamente que no le interesa (no quiero, no gracias, cancelar, etc.).

Para cancelados, responde en formato: cancelados|MOTIVO (ej: cancelados|Sin Cobertura Internet, cancelados|No Interesado, cancelados|Rechazó TV sin cobertura).
Para las demás columnas, responde solo la palabra.`;

export async function classifyLeadStage(params: {
  lastUserMessage: string;
  lastBotReply: string;
  messageCount: number;
}): Promise<PipelineStatus> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'nuevos';

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `${CLASSIFY_PROMPT}\n\nMensaje del cliente: "${params.lastUserMessage}"\nRespuesta del bot: "${params.lastBotReply}"\nMensajes en conversación: ${params.messageCount}\n\nEtapa:`,
    });

    const raw = (text || '').trim().toLowerCase();
    if (raw.startsWith('cancelados|')) {
      return 'cancelados';
    }
    if (PIPELINE_STATUSES.includes(raw as PipelineStatus)) {
      return raw as PipelineStatus;
    }
  } catch {
    //
  }
  return 'nuevos';
}

function extractCancelReason(text: string): string | undefined {
  const raw = (text || '').trim().toLowerCase();
  if (raw.startsWith('cancelados|')) {
    const reason = raw.slice('cancelados|'.length).trim();
    return reason || 'Sin especificar';
  }
  return undefined;
}

export async function classifyAndUpdateLead(params: {
  leadId: string;
  lastUserMessage: string;
  lastBotReply: string;
  messageCount: number;
  currentStatus: string;
}): Promise<{ updated: boolean; newStatus?: PipelineStatus }> {
  const currentNorm = (params.currentStatus || '').toLowerCase().trim();

  // 1. Embudo automático: reglas primero
  const ruleStatus = inferStatusFromRules({
    lastUserMessage: params.lastUserMessage,
    lastBotReply: params.lastBotReply,
    messageCount: params.messageCount,
  });
  if (ruleStatus && ruleStatus !== currentNorm) {
    const ok = await updateLeadStatus(params.leadId, ruleStatus, {
      fromAI: false,
      cancelReason: ruleStatus === 'cancelados' ? 'Regla automática' : undefined,
    });
    return { updated: ok, newStatus: ruleStatus };
  }
  if (ruleStatus) return { updated: false };

  // 2. Fallback a IA
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { updated: false };

  let rawText = '';
  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `${CLASSIFY_PROMPT}\n\nMensaje del cliente: "${params.lastUserMessage}"\nRespuesta del bot: "${params.lastBotReply}"\nMensajes en conversación: ${params.messageCount}\n\nEtapa:`,
  
    });
    rawText = text || '';
  } catch {
    return { updated: false };
  }

  const newStatus = rawText.startsWith('cancelados|')
    ? 'cancelados'
    : PIPELINE_STATUSES.includes((rawText.trim().toLowerCase()) as PipelineStatus)
      ? (rawText.trim().toLowerCase() as PipelineStatus)
      : 'nuevos';

  if (newStatus === currentNorm) {
    return { updated: false };
  }

  const cancelReason = newStatus === 'cancelados' ? extractCancelReason(rawText) : undefined;
  const ok = await updateLeadStatus(params.leadId, newStatus, {
    fromAI: true,
    cancelReason: cancelReason || (newStatus === 'cancelados' ? 'Sin especificar' : undefined),
  });
  return { updated: ok, newStatus };
}
