import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';

export const dynamic = 'force-dynamic';

type BriefQuestion = {
  id: string;
  step: 1 | 2 | 3 | 4;
  label: string;
  type: 'text' | 'textarea' | 'yesno' | 'number' | 'url';
  placeholder?: string;
};

type BriefDoc = {
  token: string;
  resellerId: string;
  questions: BriefQuestion[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  score?: number;
  recommendation?: string;
  answers?: Record<string, unknown>;
  client?: Record<string, unknown>;
};

function normalizeQuestions(input: unknown): BriefQuestion[] {
  if (!Array.isArray(input)) return [];
  const out: BriefQuestion[] = [];
  for (const q of input) {
    if (!q || typeof q !== 'object') continue;
    const r = q as Record<string, unknown>;
    const id = String(r.id ?? '').trim();
    const label = String(r.label ?? '').trim();
    const stepRaw = Number(r.step);
    const step = (stepRaw === 1 || stepRaw === 2 || stepRaw === 3 || stepRaw === 4 ? stepRaw : 0) as
      | 1
      | 2
      | 3
      | 4;
    const type = String(r.type ?? '').trim() as BriefQuestion['type'];
    const placeholder = typeof r.placeholder === 'string' ? r.placeholder : undefined;
    if (!id || !label || !step) continue;
    if (!['text', 'textarea', 'yesno', 'number', 'url'].includes(type)) continue;
    out.push({ id, label, step, type, ...(placeholder ? { placeholder } : {}) });
  }
  return out.slice(0, 80);
}

function defaultQuestions(): BriefQuestion[] {
  return [
    // Paso 1 — Perfil
    { id: 'negocio_nombre', step: 1, label: 'Nombre del negocio', type: 'text', placeholder: 'Ej: Deco House' },
    { id: 'negocio_rubro', step: 1, label: 'Rubro', type: 'text', placeholder: 'Ej: Construcción, estética, servicios...' },
    { id: 'negocio_producto', step: 1, label: 'Producto / servicio principal', type: 'textarea' },
    { id: 'negocio_redes', step: 1, label: 'Redes sociales (links)', type: 'textarea', placeholder: 'Instagram, Facebook, TikTok...' },
    { id: 'negocio_web', step: 1, label: 'Sitio web', type: 'url', placeholder: 'https://...' },

    // Paso 2 — Objetivos
    { id: 'objetivo_principal', step: 2, label: 'Objetivo principal', type: 'textarea', placeholder: 'Ej: generar leads, ventas, mensajes...' },
    { id: 'publico_objetivo', step: 2, label: 'Público objetivo', type: 'textarea' },
    { id: 'competidores', step: 2, label: 'Competidores', type: 'textarea' },
    { id: 'diferenciador', step: 2, label: 'Diferenciador del negocio', type: 'textarea' },

    // Paso 3 — Técnico
    { id: 'tiene_pixel', step: 3, label: '¿Tiene Pixel de Facebook instalado?', type: 'yesno' },
    { id: 'tiene_gtm', step: 3, label: '¿Tiene Google Tag Manager?', type: 'yesno' },
    { id: 'meta_ads_activa', step: 3, label: '¿Cuenta de Meta Ads activa?', type: 'yesno' },
    { id: 'tiene_catalogo', step: 3, label: '¿Catálogo de productos?', type: 'yesno' },

    // Paso 4 — Inversión
    { id: 'presupuesto_mensual', step: 4, label: 'Presupuesto mensual (MXN)', type: 'number', placeholder: 'Ej: 8000' },
    { id: 'fecha_inicio', step: 4, label: 'Fecha de inicio', type: 'text', placeholder: 'Ej: 15/05/2026' },
    { id: 'invirtio_antes', step: 4, label: '¿Ha invertido antes?', type: 'yesno' },
    { id: 'resultados_previos', step: 4, label: 'Resultados anteriores', type: 'textarea' },
  ];
}

export async function GET(req: NextRequest, { params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getMongoDb();
  const docs = await db
    .collection<BriefDoc>('briefs')
    .find({ resellerId })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({
    briefs: docs.map((d) => ({
      token: d.token,
      createdAt: d.createdAt,
      completedAt: d.completedAt ?? null,
      score: typeof d.score === 'number' ? d.score : null,
      negocio: (d.client as any)?.negocio_nombre ?? null,
      nombre: (d.client as any)?.contacto_nombre ?? null,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const questions = normalizeQuestions((body as any)?.questions);
  const finalQuestions = questions.length > 0 ? questions : defaultQuestions();

  const token = crypto.randomBytes(18).toString('hex');
  const now = new Date();
  const doc: BriefDoc = {
    token,
    resellerId,
    questions: finalQuestions,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getMongoDb();
  await db.collection<BriefDoc>('briefs').insertOne(doc);

  return NextResponse.json({
    ok: true,
    token,
    url: `/brief/${token}`,
  });
}

