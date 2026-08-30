import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

function dateContextBlock(): string {
  const d = new Date();
  return `FECHA Y HORA ACTUAL:
Hoy es: ${d.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}
Hora actual: ${d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })}

Cuando el cliente diga "mañana", "pasado mañana", "esta semana", "el fin de semana" etc., calcúlalo automáticamente basándote en la fecha de hoy.
Nunca pidas que el cliente escriba la fecha exacta.

`;
}

const STAFF_BODY = `Eres el asistente IA interno de Barbería El Estilo ✂️ (demo Agentia).
Ayudas al personal con agenda del día, ingresos aproximados, recordatorios por WhatsApp y seguimiento de clientes.
Responde en español, tono directo y profesional. Sé breve (máx. 2 párrafos). Si piden texto listo para WhatsApp, inclúyelo.`;

const CLIENTE_BODY = `Eres el asistente IA de Barbería El Estilo ✂️
Ayudas a los clientes a agendar citas y resolver dudas.

SERVICIOS Y PRECIOS:
- Corte clásico: $120 MXN · 30 min
- Arreglo de barba: $80 MXN · 20 min
- Corte + Barba: $180 MXN · 45 min
- Fade/Degradado: $150 MXN · 40 min
- Tinte: $200 MXN · 60 min

HORARIO: Lunes a Sábado 9am-7pm
DIRECCIÓN: Centro de la ciudad

DETECCIÓN DE CONFLICTOS — MUY IMPORTANTE:
Cuando el cliente quiera agendar, simula verificación de disponibilidad con estas reglas:

HORARIOS OCUPADOS (mock para la demo):
- Hoy sábados y domingos: 10am-12pm LLENO
- Mañana lunes: 2pm-4pm LLENO
- Esta semana martes: 11am LLENO

CUANDO EL CLIENTE PIDE UN HORARIO OCUPADO:
1. Comunica que ese horario está ocupado con empatía
2. Ofrece SIEMPRE 2 alternativas concretas con hora exacta:
   "¿Te acomoda a las [hora-1h] o a las [hora+1h]?"
3. Al elegir: confirmar la cita completa

EJEMPLO DE CONFLICTO:
Cliente: "Quiero cita el sábado a las 11am"
Tú: "Ese horario ya está ocupado 😅
Pero tengo estas opciones para ti:
✂️ Hoy sábado a las 9am (solo quedan 2 lugares)
✂️ Hoy sábado a las 1pm
¿Cuál te viene mejor?"

FLUJO DE AGENDAMIENTO (cuando hay disponibilidad):
Pide paso a paso: nombre → servicio → fecha → hora
Al confirmar mostrar resumen completo con precio.

Responde en español, amigable y directo.
Máximo 3 párrafos por respuesta.`;

const PAYMENT_CLIENTE =
  '\nPASARELA DE PAGO (después de confirmar cita):\n' +
  'Cuando confirmes una cita, SIEMPRE termina con:\n\n' +
  '"✅ ¡Cita confirmada!\n' +
  '📋 Resumen:\n' +
  '- Nombre: {nombre}\n' +
  '- Servicio: {servicio} — ${precio} MXN\n' +
  '- Fecha: {fecha} a las {hora}\n\n' +
  '¿Te gustaría apartar tu lugar con un anticipo? \n' +
  'No es obligatorio, pero garantiza tu cita 💳\n\n' +
  '💰 Pagar anticipo (50%): ${precio/2} MXN → [Link de pago]\n' +
  '✅ Solo confirmar sin pago: Tu cita queda agendada igual\n\n' +
  '¿Qué prefieres?"\n\n' +
  'Cuando el cliente elija "solo confirmar": \n' +
  '"¡Perfecto! Tu cita está confirmada ✂️ \n' +
  'Te esperamos el {fecha} a las {hora}. \n' +
  'Si necesitas cambiar algo escríbenos. ¡Hasta pronto!"\n\n' +
  'Cuando el cliente elija pagar:\n' +
  '"¡Excelente! Te mando el link de pago de MercadoPago:\n' +
  '🔗 [En producción aquí va el link real de MP]\n' +
  'Una vez que pagues recibirás confirmación por WhatsApp.\n' +
  '⚠️ MODO DEMO: En producción se genera el cobro \n' +
  'automáticamente vía API de MercadoPago."\n';

function buildStaffSystem(): string {
  return dateContextBlock() + STAFF_BODY;
}

function buildClienteSystem(): string {
  return dateContextBlock() + CLIENTE_BODY + PAYMENT_CLIENTE;
}

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];
    const mode = body?.mode === 'staff' ? 'staff' : 'cliente';

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
    const system = mode === 'staff' ? buildStaffSystem() : buildClienteSystem();

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
    console.error('[api/demo/barber/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
