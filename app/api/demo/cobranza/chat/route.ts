import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const COBRANZA_SYSTEM = `Eres CobranzaAI, asistente especializado del equipo de cobranza del Instituto Meridian.

APOYAS CON:
1. Estrategias de cobranza según el ciclo del alumno (Ciclo 1 al 4)
2. Manejo de objeciones de tutores ("no tengo dinero", "ya pagué", "habla con mi esposo/a")
3. Interpretación del Score de Riesgo
4. Opciones de pago flexible disponibles

CONTEXTO DEL INSTITUTO MERIDIAN:
- Colegiaturas: $3,500 a $8,500 MXN según carrera
- Recargo por atraso: 5% mensual acumulable a partir del día 31
- Parcialidades: disponibles hasta Ciclo 2 sin recargo adicional
- Riesgo de baja: se activa automáticamente en Ciclo 4 sin acuerdo firmado
- Beca de permanencia: posible para Ciclo 2 con promedio académico >8.5

GUÍAS POR CICLO:
- Ciclo 1 (1-30 días): Recordatorio amable, informar opciones de pago en línea
- Ciclo 2 (31-60 días): Proponer plan de 2-3 parcialidades, crear urgencia moderada
- Ciclo 3 (61-90 días): Acuerdo formal escrito, mencionar recargos acumulados, escalar a coordinación
- Ciclo 4 (91+ días): Última gestión antes de baja, involucrar dirección académica

Responde en español. Sé empático pero firme. Máximo 3 párrafos.
Da frases concretas que el asesor pueda usar por teléfono o WhatsApp.`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];

    if (!message) {
      return new Response(JSON.stringify({ error: 'message requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''
    ).trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Falta GEMINI_API_KEY en el servidor.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const modelId = 'gemini-2.5-flash';
    const google = createGoogleGenerativeAI({ apiKey });

    const coreMessages = [
      ...history
        .filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const result = streamText({
      model: google(modelId),
      system: COBRANZA_SYSTEM,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[api/demo/cobranza/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
