import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export type LeadBriefPayload = {
  step1: { businessName: string; industry: string };
  step2: { lostSales: '1-10' | '10-30' | '+30' };
  step3: {
    messageHandling: 'Yo solo' | 'Un empleado' | 'CRM básico' | 'No alcanzo a contestar';
    webOrSocial?: string;
  };
  step4: { contactName: string; contactWhatsapp: string };
};

function computeImpact(p: LeadBriefPayload): { potentialPct: number; hoursWeekly: number } {
  let potentialPct = 40;
  let hoursWeekly = 2;

  if (p.step2.lostSales === '10-30') {
    potentialPct = 65;
    hoursWeekly = 6;
  }
  if (p.step2.lostSales === '+30') {
    potentialPct = 85;
    hoursWeekly = 12;
  }

  if (p.step3.messageHandling === 'No alcanzo a contestar') {
    potentialPct = Math.min(95, potentialPct + 10);
    hoursWeekly = Math.round(hoursWeekly * 1.25);
  }

  return { potentialPct, hoursWeekly };
}

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    ''
  );
}

async function trySendWhatsAppAlert(message: string): Promise<void> {
  const to = (process.env.ALERT_WHATSAPP_NUMBER ?? '').trim();
  const url = (process.env.WHATSAPP_SEND_URL ?? '').trim();
  const token = (process.env.WHATSAPP_API_TOKEN ?? '').trim();
  if (!to || !url || !token) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to,
        type: 'text',
        text: { body: message },
      }),
    });
  } catch {
    // best-effort
  }
}

export async function POST(req: NextRequest) {
  let body: Partial<LeadBriefPayload> & Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Honeypot anti-spam (si viene y tiene contenido, rechazamos silenciosamente)
  const hp = String(body.website ?? '').trim();
  if (hp) return NextResponse.json({ ok: true });

  const s1 = (body.step1 ?? {}) as Record<string, unknown>;
  const s2 = (body.step2 ?? {}) as Record<string, unknown>;
  const s3 = (body.step3 ?? {}) as Record<string, unknown>;
  const s4 = (body.step4 ?? {}) as Record<string, unknown>;

  const businessName = String(s1.businessName ?? '').trim();
  const industry = String(s1.industry ?? '').trim();

  const lostSales = String((s2 as { lostSales?: unknown }).lostSales ?? '').trim();
  const messageHandling = String((s3 as { messageHandling?: unknown }).messageHandling ?? '').trim();
  const webOrSocial = String((s3 as { webOrSocial?: unknown }).webOrSocial ?? '').trim();

  const contactName = String((s4 as { contactName?: unknown }).contactName ?? '').trim();
  const contactWhatsapp = String((s4 as { contactWhatsapp?: unknown }).contactWhatsapp ?? '').replace(/\D/g, '');

  const validLost = lostSales === '1-10' || lostSales === '10-30' || lostSales === '+30';
  const validHandling =
    messageHandling === 'Yo solo' ||
    messageHandling === 'Un empleado' ||
    messageHandling === 'CRM básico' ||
    messageHandling === 'No alcanzo a contestar';

  if (!businessName || !industry || !validLost || !validHandling || !contactName || !contactWhatsapp) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
  }

  const payload: LeadBriefPayload = {
    step1: { businessName, industry },
    step2: { lostSales: lostSales as LeadBriefPayload['step2']['lostSales'] },
    step3: {
      messageHandling: messageHandling as LeadBriefPayload['step3']['messageHandling'],
      ...(webOrSocial ? { webOrSocial } : {}),
    },
    step4: { contactName, contactWhatsapp },
  };

  const impact = computeImpact(payload);

  const db = await getMongoDb();
  const now = new Date();
  await db.collection('lead_briefs').insertOne({
    ...payload,
    impact,
    source: 'lead_brief_v1_scanner',
    meta: {
      ip: clientIP(req),
      ua: req.headers.get('user-agent') ?? '',
      referer: req.headers.get('referer') ?? '',
    },
    createdAt: now,
    updatedAt: now,
  });

  // Aviso a Rodolfo (best-effort). Si no está configurado el sender, se omite.
  void trySendWhatsAppAlert(
    [
      `Nuevo Diagnóstico Agentia (/brief)`,
      `Negocio: ${payload.step1.businessName} (${payload.step1.industry})`,
      `Fugas/mes: ${payload.step2.lostSales}`,
      `Mensajes: ${payload.step3.messageHandling}`,
      payload.step3.webOrSocial ? `Web/Redes: ${payload.step3.webOrSocial}` : null,
      `Contacto: ${payload.step4.contactName} · ${payload.step4.contactWhatsapp}`,
      `Impacto: ${impact.potentialPct}% · ${impact.hoursWeekly}h/sem`,
    ]
      .filter(Boolean)
      .join('\n')
  );

  return NextResponse.json({
    ok: true,
    impact,
  });
}
