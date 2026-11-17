import { NextRequest, NextResponse } from 'next/server';
import { isAgentiaPanelAuthenticated } from '@/lib/dashboard-auth';
import { getMongoDb } from '@/lib/mongodb';
import { AGENTIA_FB_PAGE_ID } from '@/lib/agentia-panel';
import type { SocialRule } from '@/src/lib/social-rules';

export const dynamic = 'force-dynamic';

async function findConfig() {
  const db = await getMongoDb();
  const col = db.collection('business_configs');
  const doc =
    (await col.findOne({ pageId: AGENTIA_FB_PAGE_ID })) ?? (await col.findOne({ clientId: 'agentia' }));
  return { col, doc };
}

function clean(raw: unknown): SocialRule[] {
  if (!Array.isArray(raw)) return [];
  const out: SocialRule[] = [];
  raw.slice(0, 50).forEach((r: any, i) => {
    const keywords = (Array.isArray(r?.keywords) ? r.keywords : [])
      .map((k: unknown) => String(k).trim())
      .filter(Boolean)
      .slice(0, 30);
    if (!keywords.length) return;
    const channel = ['comment', 'dm', 'both'].includes(r?.channel) ? r.channel : 'both';
    const publicReplies = (Array.isArray(r?.publicReplies) ? r.publicReplies : [])
      .map((k: unknown) => String(k).trim().slice(0, 300))
      .filter(Boolean)
      .slice(0, 10);
    const dm = String(r?.dmMessage ?? '').trim().slice(0, 1900);
    out.push({
      id: String(r?.id || `regla-${i + 1}`).trim().slice(0, 60),
      active: r?.active !== false,
      channel,
      keywords,
      publicReplies,
      dmMessage: dm || undefined,
    });
  });
  return out;
}

export async function GET(req: NextRequest) {
  if (!isAgentiaPanelAuthenticated(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { doc } = await findConfig();
  if (!doc) return NextResponse.json({ error: 'No se encontró la configuración de Agentia' }, { status: 404 });
  return NextResponse.json({ rules: Array.isArray(doc.socialRules) ? doc.socialRules : [] });
}

export async function PUT(req: NextRequest) {
  if (!isAgentiaPanelAuthenticated(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const rules = clean(body?.rules);
  const { col, doc } = await findConfig();
  if (!doc) return NextResponse.json({ error: 'No se encontró la configuración de Agentia' }, { status: 404 });
  await col.updateOne({ _id: doc._id }, { $set: { socialRules: rules, updatedAt: new Date() } });
  return NextResponse.json({ ok: true, rules, note: 'Aplica en ~1 minuto' });
}
