import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import { verifyAnyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const { leadId } = params;
  const db = await getMongoDb();

  const reseller = await verifyResellerCookie(req.cookies.get(COOKIE_NAME)?.value);
  let autorFallback = 'cliente';
  if (!reseller) {
    const clientAuth = await verifyAnyClientCookie(req.cookies.get(CLIENT_COOKIE_NAME)?.value);
    if (!clientAuth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const lead = await db.collection('leads').findOne({ leadId, resellerId: clientAuth.resellerId, clientSlug: clientAuth.clientSlug });
    if (!lead) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    autorFallback = clientAuth.clientSlug;
  } else {
    autorFallback = reseller.resellerId;
  }

  const body  = await req.json().catch(() => ({}));
  const texto = typeof body?.texto === 'string' ? body.texto.trim() : '';
  const autor = typeof body?.autor === 'string' ? body.autor.trim() : autorFallback;

  if (!texto) {
    return NextResponse.json({ error: 'El texto de la nota es requerido' }, { status: 400 });
  }

  const nota   = { texto, autor, fecha: new Date() };
  const result = await db.collection('leads').updateOne(
    { leadId },
    { $push: { notas: nota as never }, $set: { updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, nota: { ...nota, fecha: nota.fecha.toISOString() } });
}
