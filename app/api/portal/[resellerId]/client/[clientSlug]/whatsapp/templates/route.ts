import { NextRequest, NextResponse } from 'next/server';
import { authWaRoute, type WaRouteCtx } from '@/lib/wa-route-auth';
import { countTemplateVariables, createWaTemplate, listWaTemplates } from '@/lib/wa-campaigns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;
  const out = await listWaTemplates(auth.account!);
  if (out.error) return NextResponse.json({ error: out.error }, { status: 502 });
  return NextResponse.json({ ok: true, templates: out.templates });
}

/** Crea una plantilla en Meta (queda PENDING hasta que Meta la apruebe). */
export async function POST(req: NextRequest, ctx: WaRouteCtx) {
  const auth = await authWaRoute(req, ctx.params, true);
  if (auth.error) return auth.error;

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(b.name ?? '').trim().toLowerCase();
  const category = b.category === 'UTILITY' ? 'UTILITY' : 'MARKETING';
  const language = String(b.language ?? 'es_MX').trim();
  const bodyText = String(b.bodyText ?? '').trim();
  const examples = Array.isArray(b.examples) ? b.examples.map((e) => String(e)) : [];

  if (!/^[a-z0-9_]{1,512}$/.test(name)) {
    return NextResponse.json({ error: 'Nombre inválido: solo minúsculas, números y guion bajo' }, { status: 400 });
  }
  if (!bodyText || bodyText.length > 1024) {
    return NextResponse.json({ error: 'El texto es obligatorio (máx. 1024 caracteres)' }, { status: 400 });
  }
  const vars = countTemplateVariables(bodyText);
  if (vars > 0 && examples.filter((e) => e.trim()).length < vars) {
    return NextResponse.json({ error: `Faltan ejemplos: la plantilla usa ${vars} variable(s) {{n}}` }, { status: 400 });
  }

  const out = await createWaTemplate(auth.account!, { name, category, language, bodyText, examples });
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 502 });
  return NextResponse.json({ ok: true, status: out.status });
}
