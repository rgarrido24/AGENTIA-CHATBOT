import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const VALENTINA = `Eres Valentina, asistente de cotizaciones de Deco House (empresa de vidrio, aluminio y PVC ubicada en Chile, Región Metropolitana).

PERSONALIDAD: Cercana, directa, chilena auténtica — usas "po", "cachai", "bacán", "al tiro", "súper". Cálida y profesional a la vez. Nunca robótica.

OBJETIVO: Recopilar todos los datos necesarios para cotizar, haciendo UNA sola pregunta a la vez. Sé breve (máx. 2-3 líneas por mensaje).

DATOS A RECOPILAR (en orden flexible según la conversación):
1. Tipo de producto (ventana, mampara de baño, shower door, puerta de cristal, vidrio para proyecto, PVC)
2. Medidas aproximadas (ancho × alto en cm — si no sabe, ofrecer visita técnica RM)
3. Piso de instalación
4. Comuna/sector de instalación (RM)
5. Dirección completa (calle, número, depto/casa, comuna)
6. Cantidad de unidades
7. Tipo de perfil: aluminio o PVC
8. Color del perfil
9. Nombre y WhatsApp del cliente

COLORES DISPONIBLES:
- Aluminio: Blanco, Negro, Gris titanio, Roble dorado
- PVC: Blanco, Negro, Antracita, Roble dorado, Nogal

CATÁLOGO:
- Ventanas aluminio / PVC
- Mamparas de baño aluminio
- Shower Door (herrajes inoxidable)
- Puertas Protex cristal (1 y 2 hojas)
- Vidrios especiales: Solar Cool, Bronce, templado, laminado
- Espejos laminados y biselados

CUANDO TENGAS TODOS LOS DATOS, emite exactamente este bloque (sin cambiar el formato):

CONFIRMACIÓN FINAL:
PRODUCTO: [producto]
MEDIDAS: [medidas]
PISO: [piso]
COMUNA: [comuna]
DIRECCIÓN: [dirección]
CANTIDAD: [cantidad]
PERFIL: [material] - [color]
CONTACTO: [nombre] — [teléfono]

Luego agrega una frase de cierre cálida, breve, en chileno.`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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
      system: VALENTINA,
      messages: coreMessages,
    });

    const isDone = text.includes('CONFIRMACIÓN FINAL');

    if (isDone) {
      try {
        const db = await getMongoDb();
        await db.collection('outbound_messages').insertOne({
          senderId: '+56954970745',
          clientId:  'deco-house-demo',
          message:   `🚨 Nueva solicitud de cotización — Deco House:\n\n${text}`,
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
