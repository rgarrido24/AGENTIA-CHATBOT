import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { decryptFbToken } from '@/lib/fb-token-crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const G = 'https://graph.facebook.com/v20.0';
const q = encodeURIComponent;

function hasCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  const qs = req.nextUrl.searchParams.get('secret');
  return auth === `Bearer ${secret}` || qs === secret;
}

async function gj(url: string): Promise<{ ok: boolean; j: any }> {
  try {
    const r = await fetch(url);
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  } catch (e) {
    return { ok: false, j: { error: { message: String(e) } } };
  }
}

async function sendAlertWa(message: string): Promise<boolean> {
  const url = (process.env.WHATSAPP_SEND_URL ?? '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN ?? '').trim();
  const to = (process.env.ALERT_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
  if (!url || !token || !to) return false;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, type: 'text', text: { body: message } }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

type Problem = { slug: string; page: string; motivo: string };

/**
 * Revisión periódica (SOLO LECTURA): token de página válido, leads_retrieval, acceso a formularios.
 * Si hay problemas avisa por WhatsApp al admin (ALERT_WHATSAPP_NUMBER). Programar 1 vez al día en Render Cron.
 * GET /api/cron/salud-fb?secret=CRON_SECRET  (o header Authorization: Bearer)
 */
export async function GET(req: NextRequest) {
  if (!hasCronSecret(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const appId = (process.env.FB_APP_ID ?? '').trim();
  const appSecret = (process.env.FB_APP_SECRET ?? '').trim();
  if (!appId || !appSecret) return NextResponse.json({ error: 'Falta FB_APP_ID/FB_APP_SECRET' }, { status: 500 });
  const appTok = `${appId}|${appSecret}`;

  const db = await getMongoDb();
  const clients = await db
    .collection('leads')
    .find({ _collection_type: 'reseller_client', status: 'activo', 'fb_connection.page_id': { $exists: true } })
    .project({ clientSlug: 1, fb_connection: 1, fb_extra_pages: 1 })
    .toArray();

  const problems: Problem[] = [];
  let checked = 0;

  for (const cl of clients as any[]) {
    const pages = [cl.fb_connection, ...(Array.isArray(cl.fb_extra_pages) ? cl.fb_extra_pages : [])].filter(Boolean);
    for (const fb of pages) {
      checked++;
      const page = String(fb.page_name || fb.page_id);
      const slug = String(cl.clientSlug);
      if (fb.status !== 'connected' || !fb.page_access_token) {
        problems.push({ slug, page, motivo: `sin conexión (${fb.status ?? 'n/a'})` });
        continue;
      }
      let tok: string;
      try {
        tok = decryptFbToken(fb.page_access_token);
      } catch {
        problems.push({ slug, page, motivo: 'token no descifra' });
        continue;
      }
      const dbg = await gj(`${G}/debug_token?input_token=${q(tok)}&access_token=${q(appTok)}`);
      const d = dbg.j?.data ?? {};
      if (!d.is_valid) {
        problems.push({ slug, page, motivo: `token inválido: ${String(d.error?.message ?? '').slice(0, 80)}` });
        continue;
      }
      if (!(d.scopes ?? []).includes('leads_retrieval')) {
        problems.push({ slug, page, motivo: 'token sin permiso leads_retrieval' });
        continue;
      }
      const forms = await gj(`${G}/${fb.page_id}/leadgen_forms?limit=1&access_token=${q(tok)}`);
      if (!forms.ok) {
        problems.push({ slug, page, motivo: `no lee formularios: ${String(forms.j?.error?.message ?? '').slice(0, 80)}` });
      }
    }
  }

  let alerted = false;
  if (problems.length) {
    const lines = problems.slice(0, 15).map((p) => `• ${p.slug} (${p.page}): ${p.motivo}`);
    const more = problems.length > 15 ? `\n…y ${problems.length - 15} más` : '';
    alerted = await sendAlertWa(
      `⚠️ Agentia: ${problems.length} página(s) de Facebook con problema (de ${checked}). Pueden estar perdiendo leads.\n${lines.join('\n')}${more}\n\nSolución: el cliente debe reconectar su Facebook desde su panel.`
    );
  }
  console.log(`[cron][salud-fb] revisadas=${checked} problemas=${problems.length} alerta=${alerted}`);
  return NextResponse.json({ ok: problems.length === 0, checked, problems, alerted });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
