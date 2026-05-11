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

  // ─── Aislamiento estricto entre clientes ────────────────────────────────
  // Lista de form_id permitidos para ESTE cliente (los configurados y activos).
  // Si el cliente no tiene formularios activos cargados, no ve ningún lead
  // (mejor mostrar vacío que filtrar cosas ajenas por error).
  const allowedFormIds = (client.formularios ?? [])
    .filter((f) => f.formId && f.activo !== false)
    .map((f) => String(f.formId));

  const filterFormId = req.nextUrl.searchParams.get('formId') ?? '';
  // Si el usuario pide un formId específico, validar que sea uno de los suyos.
  const effectiveFormIds = filterFormId
    ? (allowedFormIds.includes(filterFormId) ? [filterFormId] : [])
    : allowedFormIds;

  const base = buildLeadQuery(resellerId, clientSlug, effectiveFormIds);
  const totalCount = await db.collection('leads').countDocuments(base);
  console.log(
    '[leads-route] strict isolation',
    JSON.stringify({ resellerId, clientSlug, allowedFormIds, effectiveFormIds, totalCount }),
  );

  const docs = effectiveFormIds.length === 0
    ? []
    : await db
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

  // El dropdown SOLO muestra los formularios configurados para este cliente.
  // Nunca inferimos formIds desde los leads — eso es lo que filtraba info ajena.
  const formIds = (client.formularios ?? [])
    .filter((f) => f.formId)
    .map((f) => ({ id: String(f.formId), name: String(f.formName || f.formId) }));
  const formMap = new Map<string, string>(formIds.map((f) => [f.id, f.name]));

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

  const allowedFormIds = (client.formularios ?? [])
    .filter((f) => f.formId && f.activo !== false)
    .map((f) => String(f.formId));

  const scope  = buildLeadQuery(resellerId, clientSlug, allowedFormIds);
  const result = await db.collection('leads').deleteOne({ leadId, ...scope });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'Lead no encontrado o sin permiso' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

/**
 * Aislamiento estricto: un cliente solo ve leads que cumplan TODAS estas
 * condiciones a la vez:
 *   1. resellerId === su reseller (Luciano)
 *   2. clientSlug === su slug (antonio, gabriela_alcaraz, etc.)
 *   3. form_id ∈ formularios configurados y activos para ESE cliente
 *
 * Si el cliente no tiene formularios configurados, no ve nada (fail-closed),
 * que es lo correcto en términos de privacidad.
 */
function buildLeadQuery(
  resellerId: string,
  clientSlug: string,
  allowedFormIds: string[],
): Record<string, unknown> {
  if (allowedFormIds.length === 0) {
    // Fail-closed: ningún match posible si no hay formularios cargados.
    return { resellerId, clientSlug, form_id: { $in: [] } };
  }
  return { resellerId, clientSlug, form_id: { $in: allowedFormIds } };
}

function mapEstado(sv: string | undefined): 'nuevo' | 'contactado' | 'en_seguimiento' {
  if (!sv || sv === 'nuevo') return 'nuevo';
  if (sv === 'contactado' || sv === 'en_negociacion' || sv === 'vio_demo') return 'contactado';
  return 'en_seguimiento';
}
