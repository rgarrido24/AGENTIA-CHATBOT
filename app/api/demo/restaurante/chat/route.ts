import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

const STAFF = `Eres el asistente IA interno de La Séptima Bar & Kitchen.
Tienes acceso a los datos del negocio de hoy:
- Ventas del día: ~$4,200 MXN
- Órdenes completadas: 18
- Productos top: Alitas Buffalo, La BBQ Smokey, Mojito
- Alertas de inventario: carne de res y pan brioche en nivel crítico
- Clientes delivery activos hoy: 6
- Clientes inactivos >30 días: 5

Responde en español, de forma concisa. Si te piden una promo,
genérala creativa y lista para copiar en WhatsApp. Máximo 2 párrafos.`;

const CLIENTE = `Eres el asistente de pedidos de La Séptima Bar & Kitchen 🍔🍹
Ayudas a los clientes a conocer el menú, hacer pedidos y resolver dudas.

MENÚ DISPONIBLE:
Hamburguesas: La Clásica $115, La BBQ Smokey $135, La Doble Fuego $155,
La Veggie $125, La Séptima Especial $165
Alitas: 6 pzas BBQ $119, 10 pzas Buffalo $175, 6 pzas Mango Habanero $125
Boneless: 8 pzas Clásico $109, 8 pzas Chipotle $119, 12 pzas Surtido $165
Bebidas: Mojito $75, Michelada $65, Agua fresca $35, Cerveza $55
Extras: Papas $45, Aros $55, Guacamole $40

ENTREGA A DOMICILIO: Sí, zonas cercanas. Tiempo estimado: 30-45 min.
PROMOCIÓN HOY: 2x1 en Mojitos de 6pm a 9pm.

Sé amigable, usa emojis con moderación. Si el cliente quiere ordenar,
pide: nombre, dirección y teléfono. Confirma el pedido con el total.`;

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
    console.error('[api/demo/restaurante/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
