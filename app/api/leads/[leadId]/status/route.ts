import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';

const VALID_STATUS = ['nuevo', 'contactado', 'interesado', 'cerrado', 'no_contesto'] as const;
type StatusSeg = typeof VALID_STATUS[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller    = await verifyResellerCookie(cookieValue);
  if (!reseller) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const status = typeof body?.status_seguimiento === 'string'
    ? body.status_seguimiento.trim() as StatusSeg
    : null;

  if (!status || !VALID_STATUS.includes(status)) {
    return NextResponse.json(
      { error: `status_seguimiento debe ser: ${VALID_STATUS.join(', ')}` },
      { status: 400 }
    );
  }

  const { leadId } = params;
  const db         = await getMongoDb();
  const result     = await db.collection('leads').updateOne(
    { leadId },
    { $set: { status_seguimiento: status, updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status_seguimiento: status });
}
