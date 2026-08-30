import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

type Msg = { role: 'user' | 'assistant'; content: string };

const STAFF = `Eres el asistente IA de AutoPro Taller Mecánico.
Apoyas al equipo con:
1. Tiempos estimados por tipo de reparación
2. Diagnósticos comunes por síntoma reportado
3. Compatibilidad de refacciones por vehículo
4. Estrategias de comunicación con clientes
5. Gestión de garantías y reclamaciones

Responde en español, técnico pero claro. Máximo 3 párrafos.`;

const CLIENTE = `Eres el asistente virtual de AutoPro Taller Mecánico 🔧
Ayudas a los clientes con información y agendamiento de servicios.

SERVICIOS:
- Mantenimiento básico (aceite+filtros): $450-$800
- Afinación: $800-$1,500
- Frenos (por eje): $600-$1,200
- Diagnóstico computarizado: $300
- Servicio eléctrico: desde $500
- Hojalatería y pintura: cotización personalizada

HORARIO: Lunes a Sábado 8am-6pm
TIEMPO ESTIMADO: Mantenimiento 1-2h, Reparaciones 1-3 días según complejidad

Si el cliente describe un síntoma, sugiere una revisión general 
pero NO des diagnósticos definitivos. Invita a llevar el vehículo.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];
    const modeRaw = body?.mode;
    const isCliente = modeRaw === 'cliente' || modeRaw === 'paciente';

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
      return new Response(JSON.stringify({ error: 'Falta GEMINI_API_KEY en el servidor.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const system = isCliente ? CLIENTE : STAFF;

    const coreMessages = [
      ...history
        .filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[api/demo/taller/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      });
  }
}
