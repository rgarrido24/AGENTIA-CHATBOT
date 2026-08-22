/**
 * Genera el link real "Guardar en Google Wallet" para un cliente de SABUCAN.
 * Modelo: PUNTOS — 1 punto por cada $100 MXN de compra (ajustable en POINTS_RATE).
 *
 * Uso cajero:
 *   import { calcularPuntos } from '@/lib/wallet-sabucan';
 *   const puntosGanados = calcularPuntos(montoDeLaVenta);
 *
 *   const res = await fetch('/api/wallet/sabucan', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       clienteId: cliente._id,
 *       clienteNombre: cliente.nombre,
 *       telefono: cliente.telefono,
 *       puntosActuales: cliente.puntos,
 *     }),
 *   });
 *   const { saveUrl } = await res.json();
 *   window.location.href = saveUrl;
 */
import jwt from 'jsonwebtoken';
import {
  getWalletIssuerId,
  getWalletServiceAccount,
  sabucanClassId,
  sabucanObjectId,
} from '@/lib/wallet-sabucan';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
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

    const objectId = sabucanObjectId(issuerId, clienteId);
    const classId = sabucanClassId(issuerId);

    const loyaltyObject = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      accountName: clienteNombre,
      accountId: telefono,
      loyaltyPoints: {
        label: 'Puntos',
        balance: { int: Math.max(0, Math.floor(puntosActuales)) },
      },
      textModulesData: [
        { header: 'Cómo acumular', body: '1 punto por cada $100 MXN de compra' },
      ],
    };

    const claims = {
      iss: serviceAccount.client_email,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: { loyaltyObjects: [loyaltyObject] },
    };

    const token = jwt.sign(claims, serviceAccount.private_key, { algorithm: 'RS256' });
    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return Response.json({ saveUrl, objectId, classId });
  } catch (err) {
    console.error('Error generando pase de SABUCAN:', err);
    return Response.json({ error: 'No se pudo generar el pase' }, { status: 500 });
  }
}
