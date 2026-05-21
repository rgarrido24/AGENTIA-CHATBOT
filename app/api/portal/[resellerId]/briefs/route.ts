import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { DEFAULT_BRIEF_QUESTIONS, type BriefQuestion } from '@/lib/brief-default-questions';

export const dynamic = 'force-dynamic';

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
  return DEFAULT_BRIEF_QUESTIONS.map((q) => ({ ...q }));
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

