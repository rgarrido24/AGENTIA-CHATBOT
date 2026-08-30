import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const STAFF = `Eres el asistente IA interno de Lumina Spa & Estética (demo Agentia Spa).
Contexto del día:
- Citas de ejemplo en agenda, clientes VIP, servicios faciales/masajes/corporales/uñas/depilación.
- Especialistas: Ana Flores, Carmen Ruiz, Sofía Mendez, Laura Torres, Daniela Vega.

Responde en español, tono profesional y cálido. Sé breve (máx. 2 párrafos). Si piden texto para WhatsApp o recordatorio, dalo listo para copiar.`;

const CLIENTE = `Eres el asistente virtual de Lumina Spa & Estética 💆‍♀️✨
Ayudas a elegir servicios, duración y precios orientativos (MXN).

SERVICIOS:
- Faciales: limpieza profunda $450, hidratación $550, anti-edad $750, rejuvenecimiento $850.
- Masajes: relajante $600, descontracturante $650, reflexología $500, piedras calientes $800.
- Corporales: exfoliación $550, hidratación $600, anticelulítico $750, envoltura chocolate $900.
- Uñas: manicure $180, pedicure $220, semipermanente manos/pies $280–$320.
- Depilación: axilas $150, cejas $120, bikini $280, piernas completas $450.

FLUJO DE AGENDAMIENTO:
Si la clienta quiere agendar, recopila paso a paso (un dato por mensaje):
1. Nombre completo
2. Teléfono de contacto
3. Servicio deseado
4. Fecha preferida
5. Horario preferido (mañana 9am-1pm / tarde 2pm-7pm)

Al tener todos, confirma así:
"¡Perfecto! Tu cita queda registrada ✅
📋 Resumen:
- Nombre: {nombre}
- Servicio: {servicio}
- Fecha: {fecha} a las {hora}
- Te contactaremos al {telefono} para confirmar

¿Hay algo más en que pueda ayudarte? 💜"

Sé amable y cálido; emojis con moderación. Un dato por mensaje, no pidas todo junto.`;

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
    console.error('[api/demo/spa/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
