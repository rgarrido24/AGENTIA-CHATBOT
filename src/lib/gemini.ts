import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

function getApiKey(): string {
  const value = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!value) {
    throw new Error('Falta GEMINI_API_KEY o GOOGLE_GENERATIVE_AI_API_KEY. Configúrala en .env');
  }
  return value;
}

// Modelo disponible en esta API key (gemini-2.0-flash ya no disponible para nuevos usuarios).
const MODEL_ID = "gemini-2.5-flash";

/** Limpia base64: quita prefijo data:...;base64, si existe */
function cleanBase64(data: string): string {
  const match = data.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1].trim() : data.trim();
}

/**
 * Genera una respuesta con Gemini usando @ai-sdk/google.
 * Modelo forzado: gemini-2.5-flash.
 * Soporta contenido multimodal (texto + imagen) cuando se pasa mediaBase64.
 */
type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function generateGeminiReply(params: {
  userMessage: string;
  systemInstruction?: string;
  modelId?: string;
  /** Historial de conversación (mensajes anteriores) para evitar amnesia */
  messages?: ChatMessage[];
  /** Imagen en base64 (raw o data URL) para visión multimodal */
  mediaBase64?: string;
  /** MIME type de la imagen (ej: image/jpeg) */
  mimeType?: string;
}): Promise<string> {
  const apiKey = getApiKey();
  const google = createGoogleGenerativeAI({ apiKey });

  const hasHistory = params.messages && params.messages.length > 0;
  const hasImage = typeof params.mediaBase64 === 'string' && params.mediaBase64.length > 0;
  const mimeType = params.mimeType || 'image/jpeg';

  /** Contenido del último mensaje de usuario: texto y/o imagen */
  const buildUserContent = (): string | Array<{ type: 'text'; text: string } | { type: 'image'; image: string; mediaType: string }> => {
    const textPart = params.userMessage || (hasImage ? 'Analiza esta imagen o documento.' : '');
    if (hasImage) {
      const base64 = cleanBase64(params.mediaBase64!);
      return [
        ...(textPart ? [{ type: 'text' as const, text: textPart }] : []),
        { type: 'image' as const, image: base64, mediaType: mimeType },
      ];
    }
    return textPart || '';
  };

  const userContent = buildUserContent();
  const lastUserMessage = { role: 'user' as const, content: userContent };

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text } = await generateText({
        model: google(MODEL_ID),
        system: params.systemInstruction ?? undefined,
        ...(hasHistory
          ? { messages: [...params.messages!, lastUserMessage] }
          : { prompt: [lastUserMessage] }),
      });
      return (text ?? '').trim();
    } catch (err) {
      lastErr = err;
      console.log("=== ERROR DE GEMINI ===");
      console.error(err);
      console.log("Mensaje:", err instanceof Error ? err.message : String(err));
      console.log("=======================");
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests');
      if (is429 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 12000));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
