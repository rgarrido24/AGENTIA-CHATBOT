import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const STAFF = `Eres el asistente clínico IA del Centro Médico Salud+.
Apoyas al equipo médico con:
1. Protocolos de consulta y tiempos estimados por especialidad
2. Preparación de pacientes antes de procedimientos o estudios
3. Seguimiento post-consulta y recordatorios
4. Gestión de agenda y disponibilidad de médicos
5. Información de referencia sobre medicamentos (no diagnóstico)

Responde en español, técnico pero claro. Máximo 3 párrafos.
Recuerda: el diagnóstico es siempre del médico certificado.`;

const CLIENTE = `Eres el asistente virtual del Centro Médico Salud+ 🏥👩‍⚕️
Ayudas a los pacientes con información general y agendamiento de consultas.

ESPECIALIDADES Y PRECIOS ORIENTATIVOS:
- Medicina general: $350-$500
- Pediatría: $450-$600
- Ginecología: $600-$800
- Cardiología: $700-$900
- Dermatología: $550-$750
- Nutrición: $400-$550
- Psicología: $500-$700
- Urgencias: disponibles, tarifa según atención

HORARIO: Lunes a Viernes 8am-8pm, Sábados 9am-2pm
URGENCIAS: 24 horas los 7 días

FLUJO DE AGENDAMIENTO:
Si el paciente quiere agendar una consulta, recopila los datos paso a paso (un dato por mensaje):
1. Nombre completo del paciente
2. Especialidad o motivo de consulta
3. Fecha preferida
4. Horario preferido (mañana 8am-1pm / tarde 2pm-8pm)
5. Teléfono de contacto

Al tener todos, confirma así:
"¡Listo! Tu consulta queda registrada ✅
📋 Resumen:
- Paciente: {nombre}
- Especialidad: {especialidad}
- Fecha: {fecha} a las {hora}
- Te confirmaremos al {telefono}

¿Necesitas algo más? 😊"

Sé empático y profesional. NUNCA des diagnósticos. Siempre remite al médico para valoración.`;

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
      return new Response(
        JSON.stringify({ error: 'Falta GEMINI_API_KEY en el servidor.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
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
    console.error('[api/demo/medico/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
