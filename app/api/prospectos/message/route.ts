import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// ─── Plantillas de mensaje ────────────────────────────────────────────────────
// Cada función recibe: nombre del negocio, nombre del vendedor, link de seguimiento

const PLANTILLAS: Record<string, (nombre: string, vendedor: string, link: string) => string> = {
  intro_a: (nombre, vendedor, link) =>
    `Hola ${nombre} 👋\n\n¿Cuántas veces se te quedan mensajes sin contestar cuando estás con un cliente o ya cerraste?\n\nEso son ventas que se van solas 😔\n\nNosotros lo resolvemos: un asistente de IA que agenda, cotiza y responde por WhatsApp las 24 hrs, aunque estés dormido.\n\nMira cómo funcionaría en tu negocio 👇\n${link}\n\n— ${vendedor}, Agentia AI`,

  intro_b: (nombre, vendedor, link) =>
    `Hola ${nombre} 👋, soy ${vendedor}.\n\nUna pregunta rápida — si tuvieras un empleado que:\n• Contesta WhatsApp a las 2am ✅\n• Agenda citas solo ✅\n• Nunca se enferma ni pide aumento 😄\n\n¿Lo contratarías?\n\nEso es exactamente lo que hacemos. Mira la demo:\n${link}\n\n¿Platicamos? 🚀`,

  intro_c: (nombre, vendedor, link) =>
    `Hola ${nombre} 🙌\n\n¿Ya viste lo que hacen los negocios que más crecen?\n\nEstán usando IA en WhatsApp para:\n✅ Agendar citas automático\n✅ Responder dudas a cualquier hora\n✅ No dejar a ningún cliente en visto\n\nTe armé una demo para que lo veas en acción:\n${link}\n\n— ${vendedor}`,

  seguimiento: (nombre, vendedor, _l) =>
    `Hola ${nombre} 😊\n\n¿Tuviste oportunidad de ver la demo del chatbot que te compartí?\n\nSi tienes alguna duda o quieres que te explique cómo funcionaría específicamente en tu negocio, con gusto lo hacemos.\n\n— ${vendedor}`,

  cierre: (nombre, vendedor, _l) =>
    `Hola ${nombre}, soy ${vendedor} 👋\n\n¿Qué te pareció la demo del chatbot? 🤖\n\nEsta semana tenemos disponibilidad para hacer la instalación personalizada para tu negocio — sin compromisos, en menos de una hora queda funcionando.\n\n¿Platicamos esta semana? 📅`,

  intro_spa: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 👋\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para spas y estéticas.\nTenemos una demo en vivo de cómo automatizar sus reservas, recordatorios y reactivación de clientes VIP.\n¿Le gustaría verla? 💆 ${link}`,

  intro_dental: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 👋\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para clínicas dentales.\nAgenda digital, respaldo clínico, recetas con QR verificable y alertas de alergias automáticas.\n¿Le gustaría ver una demo en vivo? 🦷 ${link}`,

  intro_restaurante: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 🍔\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para restaurantes.\nMenú QR, panel de cocina en tiempo real, delivery con CRM y control de inventario.\n¿Le gustaría ver cómo funciona? ${link}`,

  intro_taller: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 🔧\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para talleres mecánicos.\nÓrdenes de servicio digitales, presupuestos PDF profesionales y recordatorios automáticos de mantenimiento.\n¿Le interesa verlo en vivo? ${link}`,

  intro_medico: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 👨‍⚕️\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para consultorios médicos.\nAgenda inteligente, respaldo clínico digital, recetas con QR y recordatorios automáticos a pacientes.\n¿Le gustaría ver una demo? ${link}`,

  intro_nutricion: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 🥗\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para nutriólogos.\nTablero de progreso InBody, bot motivacional para pacientes y IA que conoce la dieta de cada uno.\n¿Le gustaría verlo? ${link}`,

  intro_grooming: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 🐾\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para peluquerías caninas.\nFichas por mascota, agenda, domicilio inteligente y recordatorios automáticos de baño mensual.\n¿Le interesa una demo? ${link}`,

  intro_inmobiliaria: (nombre, _v, link) =>
    `Hola, ¿es ${nombre}? 🏠\nLe escribimos de *Agentia* — desarrollamos sistemas con IA para inmobiliarias.\nPortal de propiedades, calificación automática de leads y asistente IA para compradores.\n¿Le gustaría verlo en vivo? ${link}`,
};

/** Si el usuario eligió intro_a y el prospecto tiene giro vertical, usar plantilla específica. */
function plantillaEfectiva(plantillaSeleccionada: string, giro: unknown): string {
  if (plantillaSeleccionada !== 'intro_a') return plantillaSeleccionada;
  const g = String(giro ?? '').trim();
  const porGiro: Record<string, string> = {
    'Spa & Estética': 'intro_spa',
    'Clínica Dental': 'intro_dental',
    Restaurante: 'intro_restaurante',
    'Taller Mecánico': 'intro_taller',
    Médico: 'intro_medico',
    Nutriólogo: 'intro_nutricion',
    Grooming: 'intro_grooming',
    Inmobiliaria: 'intro_inmobiliaria',
  };
  return porGiro[g] ?? 'intro_a';
}

const PLANTILLAS_INFO = [
  { value: 'intro_a', label: '👋 Intro A — El Dolor (identifica el problema)' },
  { value: 'intro_b', label: '🎣 Intro B — El Gancho (curiosidad + humor)' },
  { value: 'intro_c', label: '🚀 Intro C — La Solución (valor directo)' },
  { value: 'seguimiento', label: '🔄 Seguimiento (no respondió)' },
  { value: 'cierre', label: '🎯 Cierre (ya vio la demo)' },
];

const DELAY_BETWEEN_MSGS_MS = 45_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ids, plantilla, vendedor, baseUrl, batchSize, mediaUrl } = body as {
      ids: string[];
      plantilla: string;
      vendedor: string;
      baseUrl: string;
      batchSize?: number;
      mediaUrl?: string;
    };

    if (!ids?.length || !plantilla || !vendedor) {
      return NextResponse.json({ ok: false, error: 'ids, plantilla y vendedor requeridos' }, { status: 400 });
    }

    const plantillaBaseFn = PLANTILLAS[plantilla];
    if (!plantillaBaseFn) {
      return NextResponse.json({ ok: false, error: `Plantilla '${plantilla}' no existe` }, { status: 400 });
    }

    const db = await getMongoDb();
    const limitedIds = batchSize && batchSize > 0 ? ids.slice(0, batchSize) : ids;
    const oids = limitedIds.map((id) => new ObjectId(id));
    const prospectos = await db.collection('prospectos').find({ _id: { $in: oids } }).toArray();

    const now = new Date();
    let queued = 0;

    for (let i = 0; i < prospectos.length; i++) {
      const p = prospectos[i] as Record<string, unknown>;
      const trackLink = `${(baseUrl || '').replace(/\/$/, '')}/t/${p.trackToken}`;
      const keyUsada = plantillaEfectiva(plantilla, p.giro);
      const plantillaFn = PLANTILLAS[keyUsada] ?? plantillaBaseFn;
      const message = plantillaFn(String(p.nombre || 'cliente'), vendedor, trackLink);
      const senderId = `${p.telefonoNorm || String(p.telefono || '').replace(/\D/g, '')}@c.us`;

      const scheduledFor = new Date(now.getTime() + i * DELAY_BETWEEN_MSGS_MS);

      await db.collection('outbound_messages').insertOne({
        senderId,
        message,
        clientId: 'prospectos',
        prospecto_id: p._id,
        plantilla: keyUsada,
        mediaUrl: mediaUrl || null,
        scheduledFor,
        createdAt: now,
      });

      await db.collection('prospectos').updateOne(
        { _id: p._id },
        {
          $set: {
            status: p.status === 'pendiente' ? 'contactado' : p.status,
            contactadoAt: p.contactadoAt || now,
            contactadoPor: p.contactadoPor || vendedor,
            asignadoA: p.asignadoA || vendedor,
            plantillaEnviada: keyUsada,
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

export async function GET() {
  return NextResponse.json({ plantillas: PLANTILLAS_INFO });
}
