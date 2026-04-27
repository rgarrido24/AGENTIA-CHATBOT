import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller    = await verifyResellerCookie(cookieValue);
  if (!reseller) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body  = await req.json().catch(() => ({}));
  const texto = typeof body?.texto  === 'string' ? body.texto.trim()  : '';
  const autor = typeof body?.autor  === 'string' ? body.autor.trim()  : reseller.resellerId;

  if (!texto) {
    return NextResponse.json({ error: 'El texto de la nota es requerido' }, { status: 400 });
  }

  const { leadId } = params;
  const nota = { texto, autor, fecha: new Date() };

  const db     = await getMongoDb();
  const result = await db.collection('leads').updateOne(
    { leadId },
    { $push: { notas: nota as never }, $set: { updatedAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, nota: { ...nota, fecha: nota.fecha.toISOString() } });
}
