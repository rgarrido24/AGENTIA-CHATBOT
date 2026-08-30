import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { getAgentiaWhatsAppPhoneNumberId } from '@/lib/agentia-panel';
import { sendWhatsAppCloudText } from '@/lib/whatsapp-cloud';

export const dynamic = 'force-dynamic';

const SOURCE = 'edurne';
const NOTIFY_TO = ['525628426889', '525630663423'] as const;

const OBJECTIVES = new Set(['vender', 'whatsapp', 'leads', 'citas', 'dar_a_conocer']);
const OBJECTIVE_LABELS: Record<string, string> = {
  vender: 'Vender online',
  whatsapp: 'Generar chats de WhatsApp',
  leads: 'Captar leads / formularios',
  citas: 'Agendar citas',
  dar_a_conocer: 'Dar a conocer la marca',
};
const STYLES = new Set(['elegante', 'minimalista', 'premium', 'calida']);

const MATERIAL_OPTS = new Set(['logo', 'fotos', 'videos', 'textos']);
const STRUCTURE_OPTS = new Set([
  'hero',
  'beneficios',
  'servicios',
  'precios',
  'testimonios',
  'galeria',
  'faq',
  'contacto',
  'mapa',
  'whatsapp_flotante',
]);

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''
  );
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function asString(v: unknown, max = 2000): string {
  return String(v ?? '')
    .trim()
    .slice(0, max);
}

function asStringArray(v: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x).trim()).filter((x) => allowed.has(x)))];
}

/** Acepta `objetivos[]` (nuevo) o `objetivo` string (legacy). Máx. 3. */
function parseObjetivos(body: Record<string, unknown>): string[] {
  const fromArray = asStringArray(body.objetivos, OBJECTIVES);
  if (fromArray.length > 0) return fromArray.slice(0, 3);
  const single = asString(body.objetivo, 40);
  if (OBJECTIVES.has(single)) return [single];
  return [];
}

function labelObjetivos(ids: string[]): string {
  return ids.map((id) => OBJECTIVE_LABELS[id] || id).join(' · ');
}

function buildWhatsAppSummary(data: Record<string, unknown>): string {
  const str = (k: string) => String(data[k] ?? '').trim();
  const list = (k: string) =>
    Array.isArray(data[k]) ? (data[k] as string[]).filter(Boolean).join(', ') : '';
  const objetivos = Array.isArray(data.objetivos)
    ? (data.objetivos as string[])
    : str('objetivo')
      ? [str('objetivo')]
      : [];

  const lines = [
    '📋 Nuevo brief landing — Edurne',
    '',
    `👤 ${str('nombre')}`,
    `📱 ${str('telefono')}`,
    `✉️ ${str('email')}`,
    str('redes') ? `🔗 Redes: ${str('redes')}` : null,
    '',
    `🎯 Objetivos: ${labelObjetivos(objetivos)}`,
    `👥 Público: ${str('publicoEdad')} · ${str('publicoSexo')} · ${str('publicoUbicacion')}`,
    str('publicoNecesidades') ? `   Necesidades: ${str('publicoNecesidades')}` : null,
    '',
    `🛍️ Producto: ${str('productoQueEs')}`,
    str('productoPrecio') ? `💰 Precio: ${str('productoPrecio')}` : null,
    str('productoIncluye') ? `📦 Incluye: ${str('productoIncluye')}` : null,
    str('diferenciador') ? `✨ Diferenciador: ${str('diferenciador')}` : null,
    str('testimonios') ? `⭐ Testimonios: ${str('testimonios')}` : null,
    '',
    list('material') ? `📁 Material: ${list('material')}` : null,
    list('estructura') ? `🧱 Secciones: ${list('estructura')}` : null,
    str('cta') ? `👉 CTA: ${str('cta')}` : null,
    `🎨 Estilo: ${str('estiloVisual')}`,
    str('colores') ? `🎨 Colores: ${str('colores')}` : null,
    str('referenciasVisuales') ? `🖼 Refs visuales: ${str('referenciasVisuales')}` : null,
    str('competencia') ? `🏁 Competencia: ${str('competencia')}` : null,
    str('paginasGusto') ? `💡 Páginas que le gustan: ${str('paginasGusto')}` : null,
    str('dominio') || str('hosting') || str('integraciones')
      ? `⚙️ Técnico: dominio=${str('dominio') || '—'} · hosting=${str('hosting') || '—'} · ints=${str('integraciones') || '—'}`
      : null,
    '',
    `🏁 Objetivo final: ${str('objetivoFinal')}`,
  ].filter((l) => l !== null) as string[];

  let msg = lines.join('\n');
  if (msg.length > 3900) {
    msg = `${msg.slice(0, 3890)}…`;
  }
  return msg;
}

function serializeBrief(doc: Record<string, unknown>) {
  const data = (doc.data && typeof doc.data === 'object' ? doc.data : {}) as Record<
    string,
    unknown
  >;
  const objetivos = Array.isArray(data.objetivos)
    ? (data.objetivos as string[])
    : typeof data.objetivo === 'string' && data.objetivo
      ? [data.objetivo]
      : [];

  return {
    id: String(doc._id),
    source: doc.source,
    kind: doc.kind,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? String(doc.createdAt)
          : null,
    completedAt:
      doc.completedAt instanceof Date
        ? doc.completedAt.toISOString()
        : doc.completedAt
          ? String(doc.completedAt)
          : null,
    client: doc.client ?? null,
    data: {
      ...data,
      objetivos,
    },
    objetivosLabels: labelObjetivos(objetivos),
  };
}

export async function GET(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id')?.trim();

  const db = await getMongoDb();
  const coll = db.collection('briefs');

  if (id) {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const doc = await coll.findOne({ _id: new ObjectId(id), source: SOURCE });
    if (!doc) {
      return NextResponse.json({ error: 'Brief no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ brief: serializeBrief(doc as Record<string, unknown>) });
  }

  const docs = await coll
    .find({ source: SOURCE })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({
    briefs: docs.map((d) => serializeBrief(d as Record<string, unknown>)),
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Honeypot
  if (asString(body.website, 100)) {
    return NextResponse.json({ ok: true });
  }

  const nombre = asString(body.nombre, 120);
  const telefono = asString(body.telefono, 40);
  const email = asString(body.email, 160).toLowerCase();
  const redes = asString(body.redes, 500);

  const objetivos = parseObjetivos(body);
  const publicoEdad = asString(body.publicoEdad, 80);
  const publicoSexo = asString(body.publicoSexo, 80);
  const publicoUbicacion = asString(body.publicoUbicacion, 200);
  const publicoNecesidades = asString(body.publicoNecesidades, 800);

  const productoQueEs = asString(body.productoQueEs, 800);
  const productoPrecio = asString(body.productoPrecio, 200);
  const productoIncluye = asString(body.productoIncluye, 800);

  const diferenciador = asString(body.diferenciador, 800);
  const testimonios = asString(body.testimonios, 800);

  const material = asStringArray(body.material, MATERIAL_OPTS);
  const estructura = asStringArray(body.estructura, STRUCTURE_OPTS);

  const cta = asString(body.cta, 300);
  const estiloVisual = asString(body.estiloVisual, 40);
  const colores = asString(body.colores, 400);
  const referenciasVisuales = asString(body.referenciasVisuales, 800);

  const competencia = asString(body.competencia, 800);
  const paginasGusto = asString(body.paginasGusto, 800);

  const dominio = asString(body.dominio, 200);
  const hosting = asString(body.hosting, 200);
  const integraciones = asString(body.integraciones, 500);

  const objetivoFinal = asString(body.objetivoFinal, 400);

  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  }
  if (telefono.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 });
  }
  if (!emailOk(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }
  if (objetivos.length < 1 || objetivos.length > 3) {
    return NextResponse.json({ error: 'Selecciona entre 1 y 3 objetivos' }, { status: 400 });
  }
  if (!productoQueEs || productoQueEs.length < 5) {
    return NextResponse.json({ error: 'Describe el producto o servicio' }, { status: 400 });
  }
  if (!STYLES.has(estiloVisual)) {
    return NextResponse.json({ error: 'Estilo visual inválido' }, { status: 400 });
  }
  if (!objetivoFinal || objetivoFinal.length < 5) {
    return NextResponse.json({ error: 'Objetivo final requerido' }, { status: 400 });
  }

  const data = {
    nombre,
    telefono,
    email,
    redes,
    objetivos,
    objetivo: objetivos[0],
    publicoEdad,
    publicoSexo,
    publicoUbicacion,
    publicoNecesidades,
    productoQueEs,
    productoPrecio,
    productoIncluye,
    diferenciador,
    testimonios,
    material,
    estructura,
    cta,
    estiloVisual,
    colores,
    referenciasVisuales,
    competencia,
    paginasGusto,
    dominio,
    hosting,
    integraciones,
    objetivoFinal,
  };

  const now = new Date();
  const db = await getMongoDb();
  const insert = await db.collection('briefs').insertOne({
    source: SOURCE,
    kind: 'landing_brief_edurne_v1',
    createdAt: now,
    updatedAt: now,
    completedAt: now,
    data,
    client: {
      contacto_nombre: nombre,
      contacto_email: email,
      contacto_telefono: telefono,
    },
    meta: {
      ip: clientIP(req),
      ua: req.headers.get('user-agent') ?? '',
    },
  });

  const summary = buildWhatsAppSummary(data);
  const phoneNumberId = getAgentiaWhatsAppPhoneNumberId();

  const waResults = await Promise.all(
    NOTIFY_TO.map(async (to) => {
      const result = await sendWhatsAppCloudText({
        to,
        bodyText: summary,
        phoneNumberId,
      });
      return { to, ok: result.ok, error: result.error };
    })
  );

  return NextResponse.json({
    ok: true,
    id: String(insert.insertedId),
    whatsapp: waResults,
  });
}
