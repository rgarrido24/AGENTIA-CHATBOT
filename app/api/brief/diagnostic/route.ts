import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export type DiagnosticPayload = {
  // v2 (público) — el formulario nuevo manda esto
  step1: { businessName: string; industry: string; teamSize: string };
  step2: { pain: string };
  step3: { imaginedSolution: string };
  step4: { investmentRange: string; contactWhatsapp: string };
  recommendationSummary: string;
};

function buildRecommendation(p: DiagnosticPayload): string {
  const chunks: string[] = [];
  const sol = p.step3.imaginedSolution.toLowerCase();
  const pain = p.step2.pain.toLowerCase();

  if (sol.includes('ia') || pain.includes('ventas') || pain.includes('contestar')) chunks.push('Automatización de IA');
  if (sol.includes('web') || pain.includes('presencia')) chunks.push('Landing page moderna');
  if (sol.includes('crm') || pain.includes('procesos')) chunks.push('Sistema de gestión a medida');

  if (chunks.length === 0) {
    return 'Automatización de IA + Landing page';
  }
  return chunks.join(' + ');
}

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''
  );
}

export async function POST(req: NextRequest) {
  let body: Partial<DiagnosticPayload> & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Honeypot anti-spam (si viene y tiene contenido, rechazamos silenciosamente)
  const hp = String(body.website ?? '').trim();
  if (hp) return NextResponse.json({ ok: true });

  // Acepta el shape nuevo y el viejo (por compatibilidad).
  const s1 = (body.step1 ?? {}) as Record<string, unknown>;
  const s2 = (body.step2 ?? {}) as Record<string, unknown>;
  const s3 = (body.step3 ?? {}) as Record<string, unknown>;
  const s4 = (body.step4 ?? {}) as Record<string, unknown>;

  const businessName = String(s1.businessName ?? '').trim();
  const industry = String(s1.industry ?? '').trim();
  const teamSize = String(s1.teamSize ?? '').trim();

  const pain = String((s2 as { pain?: unknown }).pain ?? (s2 as { mainProblem?: unknown }).mainProblem ?? '').trim();
  const imaginedSolution = String((s3 as { imaginedSolution?: unknown }).imaginedSolution ?? (s3 as { superpower?: unknown }).superpower ?? '').trim();
  const investmentRange = String(s4.investmentRange ?? '').trim();
  const contactWhatsapp = String(s4.contactWhatsapp ?? '').replace(/\D/g, '');

  if (!businessName || !industry || !teamSize || !pain || !imaginedSolution || !investmentRange || !contactWhatsapp) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const payload: DiagnosticPayload = {
    step1: { businessName, industry, teamSize },
    step2: { pain },
    step3: { imaginedSolution },
    step4: { investmentRange, contactWhatsapp },
    recommendationSummary: String(body.recommendationSummary ?? '').trim(),
  };
  if (!payload.recommendationSummary) {
    payload.recommendationSummary = buildRecommendation(payload);
  }

  const db = await getMongoDb();
  const now = new Date();
  await db.collection('project_briefs').insertOne({
    ...payload,
    source: 'diagnostic_brief_v2_public',
    meta: {
      ip: clientIP(req),
      ua: req.headers.get('user-agent') ?? '',
      referer: req.headers.get('referer') ?? '',
    },
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    ok: true,
    recommendation: payload.recommendationSummary,
  });
}
