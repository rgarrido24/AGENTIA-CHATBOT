import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string } }
) {
  const { resellerId } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const db  = await getMongoDb();
  const now = new Date();
  const hoy    = new Date(now); hoy.setHours(0, 0, 0, 0);
  const semana = new Date(now); semana.setDate(now.getDate() - 7); semana.setHours(0, 0, 0, 0);
  const mes    = new Date(now.getFullYear(), now.getMonth(), 1);

  const [hoyCount, semanaCount, mesCount, totalCount] = await Promise.all([
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: hoy } }),
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: semana } }),
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: mes } }),
    db.collection('leads').countDocuments({ resellerId }),
  ]);

  return NextResponse.json({ hoy: hoyCount, semana: semanaCount, mes: mesCount, total: totalCount });
}
