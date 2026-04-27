import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME, type ResellerClient } from '@/lib/reseller-auth';

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

  const db = await getMongoDb();
  const clients = await db
    .collection<ResellerClient>('reseller_clients')
    .find({ resellerId })
    .sort({ nombre: 1 })
    .toArray();

  const now  = new Date();
  const hoy  = new Date(now); hoy.setHours(0, 0, 0, 0);
  const mes  = new Date(now.getFullYear(), now.getMonth(), 1);

  const clientsWithStats = await Promise.all(
    clients.map(async (c) => {
      const query = buildLeadQuery(resellerId, c.clientSlug, c.legacyQuery);
      const [total, leadsHoy, leadsMes] = await Promise.all([
        db.collection('leads').countDocuments(query),
        db.collection('leads').countDocuments({ ...query, createdAt: { $gte: hoy } }),
        db.collection('leads').countDocuments({ ...query, createdAt: { $gte: mes } }),
      ]);
      return {
        clientSlug: c.clientSlug,
        nombre:     c.nombre,
        negocio:    c.negocio,
        status:     c.status,
        formularios: c.formularios,
        total,
        leadsHoy,
        leadsMes,
      };
    })
  );

  return NextResponse.json({ clients: clientsWithStats });
}

function buildLeadQuery(
  resellerId: string,
  clientSlug: string,
  legacyQuery?: Record<string, unknown>
) {
  const primary = { resellerId, clientSlug };
  if (!legacyQuery) return primary;
  return { $or: [primary, legacyQuery] };
}
