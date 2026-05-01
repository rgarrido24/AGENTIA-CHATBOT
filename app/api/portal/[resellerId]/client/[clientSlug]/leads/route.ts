import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME, type ResellerClient } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
  const { resellerId, clientSlug } = params;

  const resellerCookie = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(resellerCookie);
  const isResellerAuth = reseller && reseller.resellerId === resellerId;

  if (!isResellerAuth) {
    const clientCookie = req.cookies.get(CLIENT_COOKIE_NAME)?.value;
    const isClientAuth = await verifyClientCookie(clientCookie, resellerId, clientSlug);
    if (!isClientAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
  }

  const db     = await getMongoDb();
  const client = await db.collection<ResellerClient>('leads').findOne({ resellerId, clientSlug, _collection_type: 'reseller_client' });
  console.log('[leads-route] client doc:', JSON.stringify({ clientSlug, legacyQuery: client?.legacyQuery }));
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const filterFormId = req.nextUrl.searchParams.get('formId') ?? '';
  const base = buildLeadQuery(resellerId, clientSlug, client.legacyQuery);
  const query = filterFormId ? { ...base, form_id: filterFormId } : base;
  const totalCount = await db.collection('leads').countDocuments(base);
  console.log('[leads-route] query:', JSON.stringify(base), '→ total:', totalCount);

  const docs = await db
    .collection('leads')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(300)
    .project({
      leadId: 1, nombre: 1, senderName: 1, telefono: 1, senderId: 1,
      email: 1, campana: 1, adset: 1, canal_origen: 1,
      form_id: 1, form_name: 1, page_name: 1, platform_src: 1,
      form_fields: 1, status_vendedor: 1, status: 1,
      status_seguimiento: 1, notas: 1, createdAt: 1, _id: 0,
    })
    .toArray();

  // Unique form IDs for the filter dropdown — client formularios config has priority for names
  const formMap = new Map<string, string>();
  for (const f of (client.formularios ?? [])) {
    if (f.formId) formMap.set(String(f.formId), String(f.formName || f.formId));
  }
  const allDocs = filterFormId
    ? await db.collection('leads').find(base).project({ form_id: 1, form_name: 1, _id: 0 }).toArray()
    : docs;
  for (const d of allDocs) {
    if (d.form_id && !formMap.has(String(d.form_id))) {
      formMap.set(String(d.form_id), String(d.form_name || d.form_id));
    }
  }
  const formIds = Array.from(formMap.entries()).map(([id, name]) => ({ id, name }));

  const leads = docs.map((d) => ({
    id:                 d.leadId as string,
    nombre:             (d.nombre || d.senderName || d.senderId || 'Sin nombre') as string,
    telefono:           (d.telefono || '') as string,
    email:              (d.email || '') as string,
    campana:            (d.campana || '') as string,
    adset:              (d.adset || '') as string,
    canal_origen:       (d.canal_origen || '') as string,
    form_id:            (d.form_id || '') as string,
    form_name:          (d.form_name || '') as string,
    form_display:       (formMap.get(String(d.form_id || '')) || d.form_name || d.form_id || '') as string,
    page_name:          (d.page_name || '') as string,
    platform_src:       (d.platform_src || '') as string,
    form_fields:        (d.form_fields || {}) as Record<string, string>,
    estado:             mapEstado(d.status_vendedor as string | undefined),
    status_seguimiento: (d.status_seguimiento || 'nuevo') as string,
    notas:              (d.notas || []) as Array<{ texto: string; autor: string; fecha: string }>,
    createdAt:          (d.createdAt as Date).toISOString(),
  }));

  return NextResponse.json({ leads, formIds, clientNombre: client.nombre });
}

function buildLeadQuery(
  resellerId: string,
  clientSlug: string,
  legacyQuery?: Record<string, unknown>
): Record<string, unknown> {
  const primary = { resellerId, clientSlug };
  if (!legacyQuery) return primary;
  return { $or: [primary, legacyQuery] };
}

function mapEstado(sv: string | undefined): 'nuevo' | 'contactado' | 'en_seguimiento' {
  if (!sv || sv === 'nuevo') return 'nuevo';
  if (sv === 'contactado' || sv === 'en_negociacion' || sv === 'vio_demo') return 'contactado';
  return 'en_seguimiento';
}
