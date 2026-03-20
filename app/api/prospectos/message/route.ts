import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const PLANTILLAS: Record<string, (nombre: string, vendedor: string, link: string) => string> = {
  intro: (nombre, vendedor, link) =>
    `Hola ${nombre} 👋, soy ${vendedor} de Agentia AI.\n\nTe comparto una demo de chatbot para tu negocio que automatiza reservas, responde clientes 24/7 y lleva tu agenda sin que tú tengas que estar al pendiente.\n\nDale un vistazo aquí (menos de 1 minuto): ${link}\n\n¿Te interesa saber cómo funcionaría para ti? 🚀`,
  seguimiento: (nombre, _v, _l) =>
    `Hola ${nombre} 😊, ¿tuviste oportunidad de ver la demo del chatbot? Con gusto te la explico y resuelvo cualquier duda que tengas.`,
  cierre: (nombre, vendedor, _l) =>
    `Hola ${nombre}, soy ${vendedor}. ¿Qué te pareció el chatbot? 🤖\n\nEsta semana tenemos disponibilidad para hacer la instalación para tu negocio. ¿Platicamos? 📅`,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ids, plantilla, vendedor, baseUrl } = body as {
      ids: string[];
      plantilla: string;
      vendedor: string;
      baseUrl: string;
    };

    if (!ids?.length || !plantilla || !vendedor) {
      return NextResponse.json({ ok: false, error: 'ids, plantilla y vendedor requeridos' }, { status: 400 });
    }

    const plantillaFn = PLANTILLAS[plantilla];
    if (!plantillaFn) {
      return NextResponse.json({ ok: false, error: `Plantilla '${plantilla}' no existe` }, { status: 400 });
    }

    const db = await getMongoDb();
    const oids = ids.map((id) => new ObjectId(id));
    const prospectos = await db.collection('prospectos').find({ _id: { $in: oids } }).toArray();

    const now = new Date();
    let queued = 0;

    for (const p of prospectos) {
      const trackLink = `${(baseUrl || '').replace(/\/$/, '')}/t/${p.trackToken}`;
      const message = plantillaFn(p.nombre || 'cliente', vendedor, trackLink);
      const senderId = `${p.telefonoNorm || p.telefono.replace(/\D/g, '')}@c.us`;

      // Encolar en outbound_messages para que el bridge lo envíe
      await db.collection('outbound_messages').insertOne({
        senderId,
        message,
        clientId: 'prospectos',
        prospecto_id: p._id,
        plantilla,
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

    return NextResponse.json({ ok: true, queued });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
