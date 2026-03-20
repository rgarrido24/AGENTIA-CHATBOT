import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ─── Plantillas de mensaje ────────────────────────────────────────────────────
// Cada función recibe: nombre del negocio, nombre del vendedor, link de seguimiento

const PLANTILLAS: Record<string, (nombre: string, vendedor: string, link: string) => string> = {

  // Plantilla A — El Dolor (identifica el problema, ofrece solución)
  intro_a: (nombre, vendedor, link) =>
    `Hola ${nombre} 👋\n\n¿Cuántas veces se te quedan mensajes sin contestar cuando estás con un cliente o ya cerraste?\n\nEso son ventas que se van solas 😔\n\nNosotros lo resolvemos: un asistente de IA que agenda, cotiza y responde por WhatsApp las 24 hrs, aunque estés dormido.\n\nMira cómo funcionaría en tu negocio 👇\n${link}\n\n— ${vendedor}, Agentia AI`,

  // Plantilla B — El Gancho (curiosidad + humor)
  intro_b: (nombre, vendedor, link) =>
    `Hola ${nombre} 👋, soy ${vendedor}.\n\nUna pregunta rápida — si tuvieras un empleado que:\n• Contesta WhatsApp a las 2am ✅\n• Agenda citas solo ✅\n• Nunca se enferma ni pide aumento 😄\n\n¿Lo contratarías?\n\nEso es exactamente lo que hacemos. Mira la demo:\n${link}\n\n¿Platicamos? 🚀`,

  // Plantilla C — La Solución (propuesta de valor directa)
  intro_c: (nombre, vendedor, link) =>
    `Hola ${nombre} 🙌\n\n¿Ya viste lo que hacen los negocios que más crecen?\n\nEstán usando IA en WhatsApp para:\n✅ Agendar citas automático\n✅ Responder dudas a cualquier hora\n✅ No dejar a ningún cliente en visto\n\nTe armé una demo para que lo veas en acción:\n${link}\n\n— ${vendedor}`,

  // Seguimiento — para quien no respondió
  seguimiento: (nombre, vendedor, _l) =>
    `Hola ${nombre} 😊\n\n¿Tuviste oportunidad de ver la demo del chatbot que te compartí?\n\nSi tienes alguna duda o quieres que te explique cómo funcionaría específicamente en tu negocio, con gusto lo hacemos.\n\n— ${vendedor}`,

  // Cierre — para quien ya vio la demo o está interesado
  cierre: (nombre, vendedor, _l) =>
    `Hola ${nombre}, soy ${vendedor} 👋\n\n¿Qué te pareció la demo del chatbot? 🤖\n\nEsta semana tenemos disponibilidad para hacer la instalación personalizada para tu negocio — sin compromisos, en menos de una hora queda funcionando.\n\n¿Platicamos esta semana? 📅`,
};

// Nombres visibles en la UI
export const PLANTILLAS_INFO = [
  { value: 'intro_a',    label: '👋 Intro A — El Dolor (identifica el problema)' },
  { value: 'intro_b',    label: '🎣 Intro B — El Gancho (curiosidad + humor)' },
  { value: 'intro_c',    label: '🚀 Intro C — La Solución (valor directo)' },
  { value: 'seguimiento', label: '🔄 Seguimiento (no respondió)' },
  { value: 'cierre',     label: '🎯 Cierre (ya vio la demo)' },
];

// Segundos de espera entre mensajes (anti-bloqueo WhatsApp)
const DELAY_BETWEEN_MSGS_MS = 45_000; // 45 segundos

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ids, plantilla, vendedor, baseUrl, batchSize, mediaUrl } = body as {
      ids: string[];
      plantilla: string;
      vendedor: string;
      baseUrl: string;
      batchSize?: number;         // opcional: limitar a los primeros N
      mediaUrl?: string;          // opcional: URL de video/GIF a adjuntar
    };

    if (!ids?.length || !plantilla || !vendedor) {
      return NextResponse.json({ ok: false, error: 'ids, plantilla y vendedor requeridos' }, { status: 400 });
    }

    const plantillaFn = PLANTILLAS[plantilla];
    if (!plantillaFn) {
      return NextResponse.json({ ok: false, error: `Plantilla '${plantilla}' no existe` }, { status: 400 });
    }

    const db = await getMongoDb();
    // Respetar batchSize si se envió
    const limitedIds = batchSize && batchSize > 0 ? ids.slice(0, batchSize) : ids;
    const oids = limitedIds.map((id) => new ObjectId(id));
    const prospectos = await db.collection('prospectos').find({ _id: { $in: oids } }).toArray();

    const now = new Date();
    let queued = 0;

    for (let i = 0; i < prospectos.length; i++) {
      const p = prospectos[i];
      const trackLink = `${(baseUrl || '').replace(/\/$/, '')}/t/${p.trackToken}`;
      const message = plantillaFn(p.nombre || 'cliente', vendedor, trackLink);
      const senderId = `${p.telefonoNorm || p.telefono.replace(/\D/g, '')}@c.us`;

      // Escalonar envíos: cada mensaje va 45s después del anterior (anti-bloqueo)
      const scheduledFor = new Date(now.getTime() + i * DELAY_BETWEEN_MSGS_MS);

      await db.collection('outbound_messages').insertOne({
        senderId,
        message,
        clientId: 'prospectos',
        prospecto_id: p._id,
        plantilla,
        mediaUrl: mediaUrl || null,
        scheduledFor,
        createdAt: now,
      });

      // Marcar como contactado
      await db.collection('prospectos').updateOne(
        { _id: p._id },
        {
          $set: {
            status: p.status === 'pendiente' ? 'contactado' : p.status,
            contactadoAt: p.contactadoAt || now,
            contactadoPor: p.contactadoPor || vendedor,
            asignadoA: p.asignadoA || vendedor,
            plantillaEnviada: plantilla,
            updatedAt: now,
          },
          $inc: { mensajesEnviados: 1 },
        }
      );

      queued++;
    }

    const minutesTotal = Math.ceil((prospectos.length - 1) * DELAY_BETWEEN_MSGS_MS / 60000);
    return NextResponse.json({ ok: true, queued, minutesTotal });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// GET: devuelve info de plantillas para la UI
export async function GET() {
  return NextResponse.json({ plantillas: PLANTILLAS_INFO });
}
