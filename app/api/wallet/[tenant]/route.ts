/**
 * Genera saveUrl de Google Wallet para cualquier tenant de lealtad.
 */
import jwt from 'jsonwebtoken';
import { formatPuntos } from '@/lib/wallet-sabucan-points';
import {
  getWalletIssuerId,
  getWalletServiceAccount,
} from '@/lib/wallet-sabucan';
import {
  getTenant,
  sabucanWaDigits,
  tenantCashbackPct,
  tenantClassId,
  tenantObjectId,
} from '@/lib/wallet-tenant';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const cfg = getTenant(tenant);
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

    const saldo = Math.max(0, puntosActuales);
    const pct = tenantCashbackPct(cfg);

    const textModulesData = [
      {
        header: 'Cómo acumular',
        body:
          pct === 1
            ? `1 punto por cada $100 MXN · ${cfg.nombre}`
            : `${pct}% de cashback en puntos (1 punto = $1 MXN) · ${cfg.nombre}`,
      },
      {
        header: 'Cómo usarlo',
        body: 'Muestra este código en la caja. Puedes usar tu saldo como pago en cualquier visita.',
      },
      ...(cfg.direccion ? [{ header: 'Dónde estamos', body: cfg.direccion }] : []),
      ...(cfg.horario ? [{ header: 'Horario', body: cfg.horario }] : []),
    ];

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
        label: 'Puntos',
        balance: { string: formatPuntos(saldo) },
      },
      secondaryLoyaltyPoints: {
        label: 'Saldo a favor',
        balance: {
          money: { currencyCode: 'MXN', micros: Math.round(saldo * 1_000_000) },
        },
      },
      textModulesData,
      ...(links.length > 0 ? { linksModuleData: { uris: links } } : {}),
      ...(cfg.heroImageUrl
        ? {
            heroImage: {
              sourceUri: { uri: cfg.heroImageUrl },
              contentDescription: {
                defaultValue: { language: 'es-MX', value: cfg.nombre },
              },
            },
          }
        : {}),
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
