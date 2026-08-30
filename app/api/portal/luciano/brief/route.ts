import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const RESELLER_ID = 'luciano';
const ALERT_WHATSAPP = '5493515920758';
const KIND = 'luciano_portal_brief_v1';

const ALLOWED_DOMAINS = ['agentia.software', 'localhost:3000', 'localhost:3010'];

const INVESTMENT_PILLS = new Set([
  'Hasta 500 USD / mes',
  '500 – 2.000 USD / mes',
  '2.000 – 5.000 USD / mes',
  'Más de 5.000 USD / mes',
]);

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''
  );
}

function normalizeSlug(raw: unknown): string | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s || s.length > 80) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

function emailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function scorePayload(p: Record<string, string>): number {
  let s = 0;
  const t = (k: string) => (p[k] ?? '').trim();

  if (t('nombre').length >= 2) s += 8;
  if (emailOk(t('email'))) s += 10;
  if (t('cuit').replace(/\D/g, '').length >= 9) s += 10;
  const desc = t('descripcionNegocio');
  if (desc.length >= 80) s += 14;
  else if (desc.length >= 20) s += 8;
  const prod = t('productos');
  if (prod.length >= 40) s += 10;
  else if (prod.length >= 8) s += 5;

  const comp = t('competidores');
  if (comp.length >= 30) s += 9;
  else if (comp.length >= 5) s += 5;
  const tar = t('target');
  if (tar.length >= 40) s += 10;
  else if (tar.length >= 8) s += 5;
  const geo = t('orientacionGeo');
  if (geo.length >= 10) s += 8;
  else if (geo.length >= 2) s += 4;

  if (INVESTMENT_PILLS.has(t('inversionMensual'))) s += 12;
  const exp = t('experienciaPrevia');
  if (exp.length >= 40) s += 14;
  else if (exp.length >= 8) s += 7;

  if (t('instagramUser')) s += 4;
  if (t('instagramPassword')) s += 3;
  if (t('facebookUser')) s += 4;
  if (t('facebookPassword')) s += 3;
  const link = t('archivosLink');
  if (link.startsWith('http')) s += 6;

  return Math.min(100, Math.max(0, s));
}

async function sendLucianoWhatsAppAlert(message: string): Promise<void> {
  const url = (process.env.WHATSAPP_SEND_URL ?? '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN ?? '').trim();
  if (!url || !token) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: ALERT_WHATSAPP,
        type: 'text',
        text: { body: message },
      }),
    });
  } catch {
    /* best-effort */
  }
}

function publicBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '');
  if (env) return env;
  const vercel = (process.env.VERCEL_URL ?? '').trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;
  const host = req.headers.get('host');
  if (host?.includes('localhost')) return `http://${host}`;
  return 'https://agentia.software';
}

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  if (!ALLOWED_DOMAINS.some((d) => host.includes(d))) {
    return NextResponse.json({ error: 'Dominio no autorizado' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: true });
  }

  const clientSlug = normalizeSlug(body.clientSlug);
  if (!clientSlug) {
    return NextResponse.json({ error: 'clientSlug inválido' }, { status: 400 });
  }

  const str = (k: string) => String(body[k] ?? '').trim();

  const payload: Record<string, string> = {
    nombre: str('nombre'),
    email: str('email'),
    cuit: str('cuit'),
    descripcionNegocio: str('descripcionNegocio'),
    productos: str('productos'),
    competidores: str('competidores'),
    target: str('target'),
    orientacionGeo: str('orientacionGeo'),
    inversionMensual: str('inversionMensual'),
    experienciaPrevia: str('experienciaPrevia'),
    instagramUser: str('instagramUser'),
    instagramPassword: str('instagramPassword'),
    facebookUser: str('facebookUser'),
    facebookPassword: str('facebookPassword'),
    archivosLink: str('archivosLink'),
  };

  if (!payload.nombre || !emailOk(payload.email) || payload.cuit.replace(/\D/g, '').length < 9) {
    return NextResponse.json({ error: 'Datos de contacto incompletos' }, { status: 400 });
  }
  if (payload.descripcionNegocio.length < 10 || payload.productos.length < 3) {
    return NextResponse.json({ error: 'Descripción o productos insuficientes' }, { status: 400 });
  }
  if (!INVESTMENT_PILLS.has(payload.inversionMensual)) {
    return NextResponse.json({ error: 'Inversión mensual inválida' }, { status: 400 });
  }

  const score = scorePayload(payload);
  const token = crypto.randomBytes(14).toString('hex');
  const now = new Date();

  const negocioNombre =
    payload.descripcionNegocio.split('\n')[0].slice(0, 80) || clientSlug;

  const db = await getMongoDb();
  await db.collection('briefs').insertOne({
    token,
    resellerId: RESELLER_ID,
    clientSlug,
    kind: KIND,
    score,
    payload,
    client: {
      contacto_nombre: payload.nombre,
      contacto_email: payload.email,
      negocio_nombre: negocioNombre,
    },
    answers: payload,
    completedAt: now,
    createdAt: now,
    updatedAt: now,
    meta: {
      ip: clientIP(req),
      ua: req.headers.get('user-agent') ?? '',
    },
  });

  const base = publicBaseUrl(req);
  const portalUrl = `${base}/portal/luciano/brief/${encodeURIComponent(clientSlug)}`;

  const alertMsg = [
    `✅ Brief Luciano completado`,
    `Slug: ${clientSlug}`,
    `Nombre: ${payload.nombre}`,
    `Email: ${payload.email}`,
    `CUIT: ${payload.cuit}`,
    `Inversión/mes: ${payload.inversionMensual}`,
    `Score: ${score}/100`,
    `IG user: ${payload.instagramUser}`,
    `FB user: ${payload.facebookUser}`,
    `Credenciales: recibidas (no por WA)`,
    payload.archivosLink ? `Archivos: ${payload.archivosLink}` : null,
    `Link portal: ${portalUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  void sendLucianoWhatsAppAlert(alertMsg);

  return NextResponse.json({ ok: true, score, token });
}
