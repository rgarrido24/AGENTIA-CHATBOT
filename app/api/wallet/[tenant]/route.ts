/**
 * Genera saveUrl de Google Wallet para cualquier tenant de lealtad.
 */
import jwt from 'jsonwebtoken';
import { formatPuntos } from '@/lib/wallet-sabucan-points';
import {
  getWalletIssuerId,
  getWalletServiceAccount,
} from '@/lib/wallet-sabucan';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';
import {
  sabucanWaDigits,
  tenantClassId,
  tenantObjectId,
  tenantRecompensa,
} from '@/lib/wallet-tenant';
import { buildLoyaltyObjectTextModules } from '@/lib/wallet-pass-modules';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const cfg = await getLoyaltyTenant(tenant);
    if (!cfg) {
      return Response.json({ error: 'Tenant inválido' }, { status: 404 });
    }

    const issuerId = getWalletIssuerId();
    const serviceAccount = getWalletServiceAccount();
    if (!issuerId || !serviceAccount) {
      return Response.json(
        { error: 'Google Wallet no configurado (ISSUER_ID / SERVICE_ACCOUNT_JSON)' },
        { status: 503 },
      );
    }

    const body = (await req.json()) as {
      clienteId?: string;
      clienteNombre?: string;
      telefono?: string;
      puntosActuales?: number;
    };

    const clienteId = String(body.clienteId ?? '').trim();
    const clienteNombre = String(body.clienteNombre ?? '').trim();
    const telefono = String(body.telefono ?? '').trim();
    const puntosActuales = Number(body.puntosActuales);

    if (!clienteId || !clienteNombre || !telefono || !Number.isFinite(puntosActuales)) {
      return Response.json(
        { error: 'clienteId, clienteNombre, telefono y puntosActuales son requeridos' },
        { status: 400 },
      );
    }

    const objectId = tenantObjectId(cfg, clienteId);
    const classId = tenantClassId(cfg);

    const rec = tenantRecompensa(cfg);
    const esSellos = rec.modelo === 'sellos';
    const saldo = Math.max(0, puntosActuales);
    const textModulesData = buildLoyaltyObjectTextModules(cfg, saldo);

    const links = [
      ...(cfg.waNumber
        ? [
            {
              uri: `https://wa.me/${sabucanWaDigits(cfg.waNumber)}`,
              description: `WhatsApp ${cfg.nombre}`,
              id: 'whatsapp',
            },
          ]
        : []),
      ...(cfg.mapsUrl
        ? [{ uri: cfg.mapsUrl, description: 'Cómo llegar', id: 'maps' }]
        : []),
    ];

    const loyaltyObject = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      accountName: clienteNombre,
      accountId: telefono,
      barcode: {
        type: 'QR_CODE',
        value: telefono,
        alternateText: telefono,
      },
      loyaltyPoints: {
        label: esSellos ? 'Sellos' : 'Puntos',
        balance: {
          string: esSellos ? String(Math.round(saldo)) : formatPuntos(saldo),
        },
      },
      ...(esSellos
        ? {}
        : {
            secondaryLoyaltyPoints: {
              label: 'Saldo a favor',
              balance: {
                money: { currencyCode: 'MXN', micros: Math.round(saldo * 1_000_000) },
              },
            },
          }),
      textModulesData,
      ...(links.length > 0 ? { linksModuleData: { uris: links } } : {}),
      // Sin heroImage a nivel objeto: el objeto pisa a la clase y los pases ya
      // emitidos se quedan con la imagen vieja. El hero se controla en la clase.
    };

    const claims = {
      iss: serviceAccount.client_email,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: { loyaltyObjects: [loyaltyObject] },
    };

    console.log(
      `[wallet/${tenant}] loyaltyObject:`,
      JSON.stringify(loyaltyObject, null, 2),
    );

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return Response.json({ saveUrl, objectId, classId });
  } catch (err) {
    console.error(`[wallet/${(await ctx.params).tenant}]`, err);
    return Response.json({ error: 'No se pudo generar el pase' }, { status: 500 });
  }
}
