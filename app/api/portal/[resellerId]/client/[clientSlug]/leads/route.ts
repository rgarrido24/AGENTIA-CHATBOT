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
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const base = buildLeadQuery(resellerId, clientSlug);
  const totalCount = await db.collection('leads').countDocuments(base);
  console.log('[leads-route]', JSON.stringify({ resellerId, clientSlug, totalCount }));

  const docs = await db
    .collection('leads')
    .find(base)
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

  const formMap = new Map<string, string>(
    (client.formularios ?? [])
      .filter((f) => f.formId)
      .map((f) => [String(f.formId), String(f.formName || f.formId)]),
  );

  const leads = docs.map((d) => ({
    id:                 d.leadId as string,
    nombre:             (d.nombre || d.senderName || d.senderId || 'Sin nombre') as string,
    telefono:           readLeadTelefono(d),
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

  return NextResponse.json({ leads, clientNombre: client.nombre });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } }
) {
  const { resellerId, clientSlug } = params;
  const resellerCookie = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(resellerCookie);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.json({ error: 'Solo el reseller puede eliminar leads' }, { status: 403 });
  }

  const leadId = req.nextUrl.searchParams.get('leadId')?.trim();
  if (!leadId) {
    return NextResponse.json({ error: 'Falta leadId' }, { status: 400 });
  }

  const db     = await getMongoDb();
  const client = await db.collection<ResellerClient>('leads').findOne({ resellerId, clientSlug, _collection_type: 'reseller_client' });
  if (!client) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const scope  = buildLeadQuery(resellerId, clientSlug);
  const result = await db.collection('leads').deleteOne({ leadId, ...scope });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Lead no encontrado o sin permiso' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

function buildLeadQuery(resellerId: string, clientSlug: string): Record<string, unknown> {
  return { resellerId, clientSlug };
}

/** Teléfono del lead: en MongoDB el campo es `telefono` (no whatsapp/phone). */
function readLeadTelefono(doc: Record<string, unknown>): string {
  const raw = doc.telefono;
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

function mapEstado(sv: string | undefined): 'nuevo' | 'contactado' | 'en_seguimiento' {
  if (!sv || sv === 'nuevo') return 'nuevo';
  if (sv === 'contactado' || sv === 'en_negociacion' || sv === 'vio_demo') return 'contactado';
  return 'en_seguimiento';
}
