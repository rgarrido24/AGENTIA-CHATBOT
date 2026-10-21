import { NextRequest, NextResponse } from 'next/server';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import { createWaTemplate, listWaTemplates } from '@/lib/wa-campaigns';
import { DEFAULT_TEMPLATES } from '@/lib/wa-automation';

export const dynamic = 'force-dynamic';

/** Crea (si no existen) las dos plantillas básicas de Utilidad: bienvenida al lead y aviso a la asesora. */
export async function POST(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  const account = auth.account!;
  const existing = await listWaTemplates(account);
  if (existing.error) return NextResponse.json({ error: existing.error }, { status: 502 });
  const have = new Set(existing.templates.map((t) => t.name));

  const results: Array<{ name: string; result: string }> = [];
  for (const t of Object.values(DEFAULT_TEMPLATES)) {
    if (have.has(t.name)) {
      results.push({ name: t.name, result: 'ya existía' });
      continue;
    }
    const out = await createWaTemplate(account, { name: t.name, category: t.category, language: t.language, bodyText: t.bodyText, examples: t.examples });
    results.push({ name: t.name, result: out.ok ? `enviada a Meta (${out.status})` : `error: ${out.error}` });
  }
  return NextResponse.json({ ok: true, results });
}
