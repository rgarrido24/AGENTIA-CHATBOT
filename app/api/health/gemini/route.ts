import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Diagnóstico: llama a Gemini con un prompt mínimo y devuelve el resultado o el error real.
 * Útil cuando el chat "deja de funcionar de la nada" (cuota, key bloqueada, etc.).
 * GET /api/health/gemini
 */
export async function GET() {
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'Falta GEMINI_API_KEY (o GOOGLE_GENERATIVE_AI_API_KEY) en las variables de entorno.' },
      { status: 503 }
    );
  }

  const modelId = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent('Responde solo con la palabra OK.');
    const response = result.response;
    if (!response) {
      return NextResponse.json(
        { ok: false, error: 'Gemini no devolvió respuesta.' },
        { status: 502 }
      );
    }
    const text = (await response.text())?.trim() || '';
    return NextResponse.json({
      ok: true,
      model: modelId,
      reply: text.slice(0, 100),
      message: 'Gemini responde correctamente. Si el chat sigue fallando, revisa los logs del servidor al enviar un mensaje.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
      ? 429
      : message.includes('403') || message.includes('API key')
        ? 403
        : 500;
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          status === 429
            ? 'Límite de uso de la API de Gemini alcanzado. Revisa tu cuota en Google AI Studio o espera un rato.'
            : status === 403
              ? 'API key inválida o sin permiso. Genera una nueva en https://aistudio.google.com/apikey'
              : 'Revisa el mensaje de error arriba. Si es de red, puede ser un fallo temporal.',
      },
      { status }
    );
  }
}
