import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';

export const dynamic = 'force-dynamic';

/** WhatsApp E.164-ish: solo dígitos (el bridge normaliza). */
function normalizeAlertDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
  const { resellerId, clientSlug } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const $set: Record<string, unknown> = { updatedAt: new Date() };
  const $unset: Record<string, string> = {};

  if ('alertNumber' in body) {
    const raw = String((body as { alertNumber?: unknown }).alertNumber ?? '').trim();
    if (!raw) {
      $unset.alertNumber = '';
    } else {
      const digits = normalizeAlertDigits(raw);
      if (digits.length < 10) {
        return NextResponse.json({ error: 'Número de alerta inválido (mín. 10 dígitos)' }, { status: 400 });
      }
      $set.alertNumber = digits;
    }
  }

  if (Object.keys($set).length === 1 && Object.keys($unset).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const db = await getMongoDb();
  const filter = {
    _collection_type: 'reseller_client' as const,
    resellerId,
    clientSlug,
  };

  const updateDoc =
    Object.keys($unset).length > 0
      ? { $set: $set, $unset: $unset }
      : { $set: $set };

  const result = await db.collection('leads').updateOne(filter, updateDoc);

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const updated = await db.collection('leads').findOne(filter, { projection: { alertNumber: 1 } });
  return NextResponse.json({
    ok: true,
    alertNumber: updated?.alertNumber ? String(updated.alertNumber) : null,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
  const { resellerId, clientSlug } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db = await getMongoDb();
  const result = await db.collection('leads').deleteOne({
    _collection_type: 'reseller_client',
    resellerId,
    clientSlug,
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
