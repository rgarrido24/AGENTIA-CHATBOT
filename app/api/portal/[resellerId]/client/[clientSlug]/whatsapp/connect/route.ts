import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { getFbAppId } from '@/lib/facebook-lead-connect';
import { isAddonEnabled } from '@/lib/client-addons';
import {
  completeWhatsAppEmbeddedSignup,
  completeWhatsAppManualConnection,
  getWaAccountByClient,
  getWaEmbeddedSignupConfigId,
  toPublicWaAccount,
} from '@/lib/wa-accounts';

export const dynamic = 'force-dynamic';

type Params = { params: { resellerId: string; clientSlug: string } };

async function authAndClient(req: NextRequest, { resellerId, clientSlug }: Params['params']) {
  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!reseller || reseller.resellerId !== resellerId) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) };
  }
  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1 } },
  );
  if (!client) return { error: NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 }) };
  if (!isAddonEnabled(client, 'whatsappApi')) {
    return { error: NextResponse.json({ error: 'El add-on de API de WhatsApp no está activo para este cliente' }, { status: 403 }) };
  }
  return { error: null };
}

/** Estado de la conexión + datos públicos que necesita el botón de Embedded Signup. */
export async function GET(req: NextRequest, ctx: Params) {
  const { error } = await authAndClient(req, ctx.params);
  if (error) return error;
  const acc = await getWaAccountByClient(ctx.params.resellerId, ctx.params.clientSlug);
  return NextResponse.json({
    ok: true,
    appId: getFbAppId(),
    configId: getWaEmbeddedSignupConfigId(),
    account: toPublicWaAccount(acc),
  });
}

/** Recibe lo que devuelve Embedded Signup en el navegador: code + waba_id + phone_number_id. */
export async function POST(req: NextRequest, ctx: Params) {
  const { error } = await authAndClient(req, ctx.params);
  if (error) return error;

  const body = (await req.json().catch(() => ({}))) as { code?: unknown; wabaId?: unknown; phoneNumberId?: unknown; token?: unknown };
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const wabaId = typeof body.wabaId === 'string' ? body.wabaId.trim() : '';
  const phoneNumberId = typeof body.phoneNumberId === 'string' ? body.phoneNumberId.trim() : '';
  const manual = !!token;
  if ((!manual && !code) || !/^\d+$/.test(wabaId) || !/^\d+$/.test(phoneNumberId)) {
    return NextResponse.json(
      { error: manual ? 'Faltan el ID de la cuenta o el ID del número (solo dígitos)' : 'Faltan code, wabaId o phoneNumberId' },
      { status: 400 },
    );
  }

  // Un número solo puede pertenecer a un cliente.
  const existing = await getWaAccountByClient(ctx.params.resellerId, ctx.params.clientSlug);
  const db = await getMongoDb();
  const taken = await db.collection('wa_accounts').findOne({ phoneNumberId });
  if (taken && !(existing && existing.phoneNumberId === phoneNumberId)) {
    return NextResponse.json({ error: 'Ese número ya está conectado a otro cliente' }, { status: 409 });
  }

  try {
    const doc = manual
      ? await completeWhatsAppManualConnection({
          resellerId: ctx.params.resellerId,
          clientSlug: ctx.params.clientSlug,
          wabaId,
          phoneNumberId,
          token,
        })
      : await completeWhatsAppEmbeddedSignup({
          resellerId: ctx.params.resellerId,
          clientSlug: ctx.params.clientSlug,
          code,
          wabaId,
          phoneNumberId,
        });
    return NextResponse.json({ ok: true, account: toPublicWaAccount(doc) });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al conectar WhatsApp';
    console.error('[wa-connect]', ctx.params.clientSlug, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
