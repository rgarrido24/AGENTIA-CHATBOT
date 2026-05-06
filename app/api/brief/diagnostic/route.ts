import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { isAdminRequest } from '@/lib/admin-auth-verify';

export const dynamic = 'force-dynamic';

export type DiagnosticPayload = {
  step1: {
    businessName: string;
    industry: string;
    hasWebOrSystem: 'yes' | 'no';
    teamSize: '1-5' | '6-20' | '21+';
  };
  step2: {
    mainProblem: string;
    mainChannel: string;
  };
  step3: {
    superpower: string;
    integrations: string;
  };
  step4: {
    investmentRange: string;
    timeline: string;
    contactName: string;
    contactWhatsapp: string;
  };
  recommendationSummary: string;
};

function buildRecommendation(p: DiagnosticPayload): string {
  const chunks: string[] = [];
  const sp = p.step3.superpower.toLowerCase();
  const prob = p.step2.mainProblem.toLowerCase();

  if (sp.includes('ia') || sp.includes('24/7') || prob.includes('contestar')) {
    chunks.push('Automatización de IA');
  }
  if (sp.includes('web') || prob.includes('presencia')) {
    chunks.push('Landing page moderna');
  }
  if (sp.includes('gestione') || sp.includes('clientes') || prob.includes('manuales')) {
    chunks.push('Sistema de gestión de clientes y pagos');
  }

  if (chunks.length === 0) {
    return 'Automatización de IA + Landing page';
  }
  return chunks.join(' + ');
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: Partial<DiagnosticPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const s1 = body.step1;
  const s2 = body.step2;
  const s3 = body.step3;
  const s4 = body.step4;
  if (
    !s1?.businessName?.trim() ||
    !s1?.industry?.trim() ||
    !s1?.hasWebOrSystem ||
    !s1?.teamSize ||
    !s2?.mainProblem ||
    !s2?.mainChannel ||
    !s3?.superpower ||
    !s4?.investmentRange ||
    !s4?.timeline ||
    !s4?.contactName?.trim() ||
    !s4?.contactWhatsapp?.trim()
  ) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const payload: DiagnosticPayload = {
    step1: {
      businessName: s1.businessName.trim(),
      industry: s1.industry.trim(),
      hasWebOrSystem: s1.hasWebOrSystem,
      teamSize: s1.teamSize,
    },
    step2: {
      mainProblem: s2.mainProblem,
      mainChannel: s2.mainChannel,
    },
    step3: {
      superpower: s3.superpower,
      integrations: String(s3.integrations ?? '').trim(),
    },
    step4: {
      investmentRange: s4.investmentRange,
      timeline: s4.timeline,
      contactName: s4.contactName.trim(),
      contactWhatsapp: s4.contactWhatsapp.replace(/\D/g, ''),
    },
    recommendationSummary:
      body.recommendationSummary?.trim() || '',
  };
  if (!payload.recommendationSummary) {
    payload.recommendationSummary = buildRecommendation(payload);
  }

  const db = await getMongoDb();
  const now = new Date();
  await db.collection('project_briefs').insertOne({
    ...payload,
    source: 'diagnostic_brief_v1',
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    ok: true,
    recommendation: payload.recommendationSummary,
  });
}
