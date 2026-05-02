import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const ELISA = `Eres Elisa, asistente de cotizaciones de Deco House (vidrios, aluminio y PVC, Chile, Región Metropolitana).
Personalidad: chilena, cercana, natural y profesional. Nunca robótica.
Objetivo: recopilar todos los datos necesarios en MÁXIMO 5-6 mensajes totales.

SALUDO INICIAL (solo si es el primer mensaje del cliente):
"¡Hola! Soy Elisa, de Deco House. ¿En qué te puedo ayudar hoy? Estamos aquí para darte las mejores soluciones en vidrios, aluminio y PVC. 🏠✨"

BLOQUE 1 — Tipo de producto y especificaciones (UN solo mensaje):
Preguntar qué necesita. Luego, según el producto:

  PRODUCTOS CON PERFIL/MARCO (mampara, ventana, shower door, puerta de cristal,
  cierre de oficina, cualquier producto que requiera marco): pedir en el MISMO mensaje:
  - Medidas (ancho × alto en cm)
  - Material del perfil (aluminio o PVC)
  - Tipo de apertura si aplica (corredera/abatible/fija)

  SOLO VIDRIO/CRISTAL sin marco (vidrio suelto, espejo, vidrio para proyecto,
  reposición de cristal, termopanel, vidrio de seguridad): NO preguntar por perfil,
  material ni color. Solo pedir en el MISMO mensaje:
  - Medidas (ancho × alto, y grosor si aplica)
  - Tipo de vidrio si el cliente no lo especificó

BLOQUE 2 — Solo para productos CON perfil/marco:
  En UN mensaje preguntar:
  - Tipo de vidrio (crudo/laminado/templado/termopanel/espejo)
  - Color del perfil. Disponibles: blanco, negro, mate/gris plata, titanio, madera
  (Omitir este bloque completamente si el cliente pidió solo vidrio/cristal sin marco)

BLOQUE 3 — Instalación y logística (UN solo mensaje):
- ¿Necesita instalación? NUNCA mencionar que la instalación tiene costo adicional.
- Si sí: ¿En qué comuna? ¿Primer piso o piso superior?
  - Si piso superior: ¿hay ascensor donde quepan los vidrios o toca por escaleras? ¿Qué piso exacto?

BLOQUE 4 — Datos de contacto (UN solo mensaje):
"Para enviarte la cotización súper rápido, ¿podrías compartirme estos datos?
- Nombre completo
- Correo electrónico o WhatsApp
- Dirección (calle y número)
- Comuna
- Número de casa/edificio y depto si aplica (donde se realizará la instalación o entrega)"

BLOQUE 5 — CONFIRMACIÓN FINAL:
Emitir en MAYÚSCULAS con TODOS los datos recopilados.
No redundar información ya mencionada en la conversación.
Cerrar con: EN BREVE RECIBIRÁS TU COTIZACIÓN. ¡GRACIAS POR CONTACTAR A DECO HOUSE! 🪟

REGLAS CRÍTICAS:
- Para pedidos de SOLO VIDRIO/CRISTAL: NUNCA preguntar por perfil, material ni color
- NUNCA mencionar costos, precios ni que la instalación tiene valor adicional
- Nunca repetir datos que el cliente ya dio
- Tono chileno natural (puedes usar "po", "cachai", "súper", "al tiro")
- Máximo 5-6 intercambios totales`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body    = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];

    if (!message) {
      return NextResponse.json({ error: 'message requerido' }, { status: 400 });
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''
    ).trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'Falta GEMINI_API_KEY' }, { status: 503 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const coreMessages = [
      ...history
        .filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: ELISA,
      messages: coreMessages,
    });

    const isDone = text.includes('CONFIRMACIÓN FINAL');

    if (isDone) {
      try {
        const db = await getMongoDb();
        await db.collection('outbound_messages').insertOne({
          senderId:  '56954970745@c.us',
          clientId:  'agentia-ventas',
          message:   text,
          source:    'deco-house-alert',
          createdAt: new Date(),
        });
      } catch (err) {
        console.error('[deco-house/chat] alerta WhatsApp:', err);
      }
    }

    return NextResponse.json({ reply: text, done: isDone });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[api/demo/deco-house/chat]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE — limpiar sesión de chat de un número (solo clientId: decohouse) ──
export async function DELETE(req: NextRequest) {
  try {
    const senderId = req.nextUrl.searchParams.get('senderId') ?? '';
    const db = await getMongoDb();

    const filter: Record<string, unknown> = { clientId: 'decohouse' };
    if (senderId) filter.senderId = senderId;

    const result = await db.collection('chat_sessions').deleteMany(filter);
    return NextResponse.json({ ok: true, deleted: result.deletedCount });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[deco-house/chat DELETE]', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
