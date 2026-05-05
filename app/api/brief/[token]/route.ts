import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { generateGeminiReply } from '@/src/lib/gemini';
import { enqueueOutbound } from '@/src/lib/outbound-queue';

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

function yes(v: unknown): boolean {
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'sí' || s === 'si' || s === 'true' || s === '1' || s === 'yes';
}

function scoreBrief(answers: Record<string, unknown>): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const pixel = yes(answers.tiene_pixel);
  if (pixel) {
    score += 20;
    reasons.push('Pixel instalado (+20)');
  }

  const presupuesto = Number(String(answers.presupuesto_mensual ?? '').replace(/[^\d.]/g, '')) || 0;
  if (presupuesto > 5000) {
    score += 20;
    reasons.push('Presupuesto mensual > $5000 MXN (+20)');
  }

  const cuentaActiva = yes(answers.meta_ads_activa);
  if (cuentaActiva) {
    score += 20;
    reasons.push('Cuenta Meta Ads activa (+20)');
  }

  const objetivo = String(answers.objetivo_principal ?? '').trim();
  if (objetivo.length >= 20) {
    score += 20;
    reasons.push('Objetivo claro (+20)');
  }

  const web = String(answers.negocio_web ?? '').trim();
  const hasWeb = web.length >= 6;
  if (hasWeb) {
    score += 20;
    reasons.push('Tiene web (+20)');
  }

  if (score > 100) score = 100;
  if (score < 0) score = 0;
  return { score, reasons };
}

async function buildRecommendation(params: {
  score: number;
  reasons: string[];
  answers: Record<string, unknown>;
}): Promise<string> {
  const profile = {
    negocio: String(params.answers.negocio_nombre ?? ''),
    rubro: String(params.answers.negocio_rubro ?? ''),
    producto: String(params.answers.negocio_producto ?? ''),
    web: String(params.answers.negocio_web ?? ''),
    redes: String(params.answers.negocio_redes ?? ''),
    objetivo: String(params.answers.objetivo_principal ?? ''),
    publico: String(params.answers.publico_objetivo ?? ''),
    competidores: String(params.answers.competidores ?? ''),
    diferenciador: String(params.answers.diferenciador ?? ''),
    pixel: String(params.answers.tiene_pixel ?? ''),
    gtm: String(params.answers.tiene_gtm ?? ''),
    metaAds: String(params.answers.meta_ads_activa ?? ''),
    catalogo: String(params.answers.tiene_catalogo ?? ''),
    presupuestoMensual: String(params.answers.presupuesto_mensual ?? ''),
    fechaInicio: String(params.answers.fecha_inicio ?? ''),
    invirtioAntes: String(params.answers.invirtio_antes ?? ''),
    resultadosPrevios: String(params.answers.resultados_previos ?? ''),
  };

  const systemInstruction =
    'Eres un consultor senior de performance marketing. Responde en español, concreto y accionable. ' +
    'No menciones marcas de software ni proveedores. No menciones Agentia. ' +
    'Estructura: 1) Diagnóstico breve (2-3 bullets) 2) Plan 14 días (3-5 bullets) 3) Riesgos y dependencias (2-3 bullets). ' +
    'Longitud máx: 1200 caracteres.';

  const userMessage =
    `Brief completado. Score: ${params.score}/100.\n` +
    `Señales: ${params.reasons.join(', ') || '—'}\n\n` +
    `Datos (JSON):\n${JSON.stringify(profile, null, 2)}`;

  try {
    return await generateGeminiReply({ userMessage, systemInstruction });
  } catch {
    // Fallback seguro si falta GEMINI_API_KEY o hay error.
    const objetivo = profile.objetivo ? `Objetivo: ${profile.objetivo}` : 'Definir objetivo y KPIs.';
    return [
      '- Diagnóstico: falta información o tracking a validar.',
      `- ${objetivo}`,
      '- Plan 14 días: instalar/validar Pixel y eventos, armar audiencias, lanzar 1 campaña de captación + 1 retargeting, y optimizar por CPL/CPA.',
      '- Riesgos: presupuesto insuficiente, medición incompleta, activos creativos limitados.',
    ].join('\n');
  }
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token || '').trim();
  if (!token) return NextResponse.json({ error: 'token requerido' }, { status: 400 });
  const db = await getMongoDb();
  const doc = await db.collection<BriefDoc>('briefs').findOne({ token });
  if (!doc) return NextResponse.json({ error: 'Brief no encontrado' }, { status: 404 });
  return NextResponse.json({
    token: doc.token,
    resellerId: doc.resellerId,
    questions: doc.questions,
    completedAt: doc.completedAt ?? null,
  });
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token || '').trim();
  if (!token) return NextResponse.json({ error: 'token requerido' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const answers = (body as any)?.answers;
  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'answers requeridos' }, { status: 400 });
  }

  const client = (body as any)?.client && typeof (body as any).client === 'object' ? (body as any).client : {};
  const db = await getMongoDb();
  const existing = await db.collection<BriefDoc>('briefs').findOne({ token });
  if (!existing) return NextResponse.json({ error: 'Brief no encontrado' }, { status: 404 });

  if (existing.completedAt) {
    return NextResponse.json({ ok: true, score: existing.score ?? null, recommendation: existing.recommendation ?? null });
  }

  const { score, reasons } = scoreBrief(answers as Record<string, unknown>);
  const recommendation = await buildRecommendation({ score, reasons, answers });
  const now = new Date();

  await db.collection<BriefDoc>('briefs').updateOne(
    { token },
    {
      $set: {
        answers,
        client,
        score,
        recommendation,
        completedAt: now,
        updatedAt: now,
      },
    }
  );

  // Alerta WhatsApp a Luciano (reseller.alertNumber/whatsappNumber).
  try {
    const reseller = await db.collection('leads').findOne(
      { _collection_type: 'reseller', resellerId: existing.resellerId },
      { projection: { alertNumber: 1, whatsappNumber: 1, nombre: 1, brandName: 1 } }
    );
    const alertNumber = String((reseller as any)?.alertNumber || (reseller as any)?.whatsappNumber || '').trim();
    if (alertNumber) {
      const negocio = String((client as any)?.negocio_nombre || (answers as any)?.negocio_nombre || '').trim();
      const contacto = String((client as any)?.contacto_nombre || '').trim();
      const portalUrl = `https://agentia.software/portal/${existing.resellerId}/brief`;
      const message =
        `✅ Brief completado\n` +
        `${negocio ? `Negocio: ${negocio}\n` : ''}` +
        `${contacto ? `Contacto: ${contacto}\n` : ''}` +
        `Score: ${score}/100\n\n` +
        `Ver en panel: ${portalUrl}`;
      await enqueueOutbound({
        senderId: alertNumber,
        clientId: 'agentia',
        type: 'manual',
        message,
        delaySeconds: 5,
      });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ ok: true, score, recommendation });
}

