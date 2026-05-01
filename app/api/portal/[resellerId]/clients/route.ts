import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME, type ResellerClient } from '@/lib/reseller-auth';
import { hashClientPassword, generateTempPassword } from '@/lib/client-auth';

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
    .collection<ResellerClient>('leads')
    .find({ resellerId, _collection_type: 'reseller_client' })
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

export async function POST(
  req: NextRequest,
  { params }: { params: { resellerId: string } }
) {
  const { resellerId } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const nombre      = String(body.nombre      ?? '').trim();
  const negocio     = String(body.negocio     ?? '').trim();
  const telefono    = String(body.telefono    ?? '').trim();
  const email       = String(body.email       ?? '').trim();
  const alertNumber = String(body.alertNumber ?? '').trim();
  const formularios = Array.isArray(body.formularios) ? body.formularios : [];

  if (!nombre || !negocio) {
    return NextResponse.json({ error: 'Nombre y negocio son obligatorios' }, { status: 400 });
  }

  const clientSlug = nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const db = await getMongoDb();

  const existing = await db.collection('leads').findOne({ resellerId, clientSlug, _collection_type: 'reseller_client' });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un cliente con ese nombre' }, { status: 409 });
  }

  const tempPassword       = generateTempPassword(10);
  const clientPasswordHash = hashClientPassword(tempPassword);

  const now = new Date();
  await db.collection('leads').insertOne({
    _collection_type: 'reseller_client',
    resellerId,
    clientSlug,
    nombre,
    negocio,
    ...(telefono    ? { telefono }    : {}),
    ...(email       ? { email }       : {}),
    ...(alertNumber ? { alertNumber } : {}),
    clientPasswordHash,
    formularios: formularios
      .filter((f: { formId?: string }) => f.formId?.trim())
      .map((f: { formId: string; formName?: string }) => ({
        formId:     f.formId.trim(),
        formName:   (f.formName ?? '').trim() || f.formId.trim(),
        plataforma: 'fb/ig',
        activo:     true,
      })),
    status:    'activo',
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ok: true, clientSlug, temporalPassword: tempPassword });
}
