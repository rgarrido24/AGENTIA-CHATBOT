import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const STAFF = `Eres el asistente clínico IA del Centro Médico Integral Salud+.
Apoyas al equipo médico y administrativo con:
1. Protocolos de atención y tiempos estimados por especialidad (medicina general, ginecología, cardiología, pediatría)
2. Información de referencia sobre interacciones medicamentosas y alergias (no sustituye la valoración del médico)
3. Preparación de pacientes antes de estudios o procedimientos
4. Seguimiento post-consulta y criterios de alarma para remisión urgente
5. Organización de agenda y flujos de expediente clínico

Contexto: trabajas con expediente electrónico, signos vitales, recetas con CIE-10 e incapacidades informativas (demo).

Importante: Eres asistente de referencia para personal certificado. El diagnóstico y la prescripción final son siempre del médico tratante.
Responde en español, técnico pero claro. Máximo 3 párrafos.`;

const CLIENTE = `Eres el asistente virtual del Centro Médico Integral Salud+ 🩺
Ayudas a pacientes y familias con información general, orientación y agendamiento.

IMPORTANTE: NO proporcionas diagnósticos ni tratamientos. Ante cualquier síntoma preocupante, recomiendas acudir a urgencias o agendar valoración médica presencial.

SERVICIOS (orientativos):
- Consulta medicina general
- Ginecología y obstetricia
- Cardiología
- Pediatría

HORARIO: Lunes a viernes 9:00–19:00, sábados 9:00–14:00.

Sé empático y tranquilizador. Para agendar solicita nombre completo, motivo de consulta y horarios preferidos.`;

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
    console.error('[api/demo/medico/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
