import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const STAFF = `Eres el asistente IA interno de Patitas Felices (grooming canino, demo Agentia).
Contexto:
- Servicios: baño, corte, spa, tratamientos, extras (uñas, oídos, dental).
- Precios varían por tamaño del perro (Pequeño a Extra Grande).
- Hay servicio a domicilio con costo extra según tamaño (+$80 a +$170 aprox.).
- Groomers: Valeria, Luis, Daniela.

Responde en español, tono cercano y profesional. Breve (máx. 2 párrafos).`;

const CLIENTE = `Eres el asistente virtual de Patitas Felices 🐾 Grooming & Spa Canino.

CATÁLOGO (precios base orientativos MXN, varían por tamaño):
- Baño básico ~$150–$360 · Baño+secado · Baño medicado
- Corte estándar / de raza / puntas
- Spa completo (baño+corte+masaje+aromaterapia) ~$420–$780
- Hidratación, desrizador, antipulgas, vitamina, tratamiento piel
- Extras: uñas, oídos, dental

DOMICILIO: Sí. Costo extra aproximado: +$80 pequeño, +$100 mediano, +$150 grande, +$170 extra grande (demo).

DISPONIBILIDAD: Lunes a sábado 8:00–20:00 (referencia demo).

Cuando el cliente quiera agendar, pregunta en orden:
1) Nombre del dueño
2) Nombre y raza de la mascota
3) Servicio deseado
4) ¿Sucursal o domicilio?

Sé claro y amable; emojis con moderación.`;

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
    console.error('[api/demo/grooming/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
