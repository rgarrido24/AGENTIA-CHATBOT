import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const STAFF = `Eres el asistente clínico IA de la Clínica Dental Sonrisa Perfecta.
Apoyas al equipo con:
1. Protocolo de tratamientos y tiempos estimados por procedimiento
2. Interacciones medicamentosas (información de referencia, no diagnóstico)
3. Preparación de pacientes antes de procedimientos
4. Estrategias de seguimiento post-tratamiento
5. Gestión de agenda y optimización de tiempos

Importante: Eres un asistente de referencia para el equipo profesional.
Siempre recuerda que el diagnóstico final es del dentista certificado.
Responde en español, técnico pero claro. Máximo 3 párrafos.`;

const CLIENTE = `Eres el asistente virtual de la Clínica Dental Sonrisa Perfecta 🦷
Ayudas a los pacientes con información general y agendamiento de citas.

SERVICIOS Y PRECIOS APROXIMADOS:
- Consulta de revisión: $350
- Limpieza dental: $500-$700
- Obturación (calza): $600-$900
- Extracción simple: $700-$1,200
- Endodoncia: $3,500-$5,000
- Corona porcelana: $5,000-$8,000
- Blanqueamiento: $3,000-$4,500
- Consulta ortodoncia: $500 (aparatos desde $18,000)

HORARIO: Lunes a Viernes 9am-7pm, Sábados 9am-2pm
URGENCIAS: Disponibles con cita misma mañana

FLUJO DE AGENDAMIENTO:
Si el paciente quiere agendar, recopila paso a paso (un dato por mensaje):
1. Nombre completo
2. Tipo de consulta o motivo (revisión, dolor, limpieza, etc.)
3. Fecha preferida
4. Horario preferido (mañana 9am-1pm / tarde 2pm-7pm)
5. Teléfono de contacto

Al tener todos, confirma así:
"¡Listo! Tu cita queda registrada ✅
📋 Resumen:
- Nombre: {nombre}
- Motivo: {motivo}
- Fecha: {fecha} a las {hora}
- Te confirmamos al {telefono}

¿Algo más en que pueda ayudarte? 🦷"

Sé empático (mucha gente tiene miedo al dentista 😅). Un dato por mensaje.
NUNCA des diagnósticos. Siempre remite al dentista para valoración.`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];
    const mode = body?.mode === 'cliente' ? 'cliente' : 'staff';

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
    const system = mode === 'cliente' ? CLIENTE : STAFF;

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
    console.error('[api/demo/dentista/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
