import Link from 'next/link';
import { requireResellerAuth } from '@/lib/reseller-auth';
import {
  FB_OAUTH_SESSION_COOKIE,
  fbConnectUserMessage,
  listPageLeadgenForms,
  loadOauthSession,
} from '@/lib/facebook-lead-connect';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import { decryptFbToken } from '@/lib/fb-token-crypto';
import FacebookPageSelector from './FacebookPageSelector';

export const dynamic = 'force-dynamic';

export default async function FacebookConectarPage({
  params,
  searchParams,
}: {
  params: { resellerId: string };
  searchParams: { clientSlug?: string };
}) {
  const { resellerId } = params;
  await requireResellerAuth(resellerId);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(FB_OAUTH_SESSION_COOKIE)?.value || '';
  const session = await loadOauthSession(sessionId);
  const clientSlug = searchParams.clientSlug || session?.clientSlug || '';

  if (!session || session.resellerId !== resellerId || (clientSlug && session.clientSlug !== clientSlug)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#000' }}>
        <div className="max-w-md text-center space-y-3">
          <p className="text-sm text-white font-semibold">La sesión de Facebook venció</p>
          <p className="text-xs text-slate-400">{fbConnectUserMessage('expired')}</p>
          <Link href={`/portal/${resellerId}/clientes`} className="inline-block text-xs text-lime-400 underline">
            Volver a mis clientes
          </Link>
        </div>
      </div>
    );
  }

  // Pista de cuál es la página de este cliente: la última conectada o la de sus leads recientes.
  let clientNombre = '';
  let hintPageId = '';
  let hintFrom: 'conexion' | 'leads' | 'formulario' | '' = '';
  let formIds: string[] = [];
  try {
    const db = await getMongoDb();
    const col = db.collection('leads');
    const cli = await col.findOne(
      { _collection_type: 'reseller_client', resellerId, clientSlug: session.clientSlug },
      { projection: { nombre: 1, fb_connection: 1 } },
    );
    clientNombre = String(cli?.nombre || '');
    const cliForms = await col.findOne({ _collection_type: 'reseller_client', resellerId, clientSlug: session.clientSlug }, { projection: { formularios: 1 } });
    formIds = ((cliForms?.formularios as Array<{ formId?: string }> | undefined) || []).map((f) => String(f.formId || '')).filter(Boolean);
    const prevId = String(cli?.fb_connection?.page_id || '');
    if (prevId) {
      hintPageId = prevId;
      hintFrom = 'conexion';
    } else {
      const last = await col.findOne(
        { resellerId, clientSlug: session.clientSlug, _collection_type: { $ne: 'reseller_client' }, es_prueba: { $ne: true }, $or: [{ pageId: { $exists: true, $ne: '' } }, { page_name: { $exists: true, $ne: '' } }] },
        { sort: { createdAt: -1 }, projection: { pageId: 1, page_name: 1 } },
      );
      if (last?.pageId) {
        hintPageId = String(last.pageId);
        hintFrom = 'leads';
      } else if (last?.page_name) {
        // Leads que entraron por Zapier: solo traen el nombre de la página; se compara con la lista.
        const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
        const target = norm(String(last.page_name));
        const match = session.pages.find((pg) => norm(pg.name) === target) || session.pages.find((pg) => norm(pg.name).includes(target) || target.includes(norm(pg.name)));
        if (match) {
          hintPageId = match.id;
          hintFrom = 'leads';
        }
      }
    }
  } catch {
    /* sin pista: el usuario elige a mano */
  }
  // Pista definitiva: la página que es dueña de los formularios que el cliente ya tiene en Agentia.
  if (formIds.length && hintFrom !== 'conexion') {
    const withTimeout = <T,>(pr: Promise<T>, ms: number) =>
      Promise.race([pr, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
    const results = await Promise.allSettled(
      session.pages.map(async (pg) => {
        const forms = await withTimeout(listPageLeadgenForms(pg.id, decryptFbToken(pg.access_token_enc)), 8000);
        return { id: pg.id, ids: forms.map((f) => f.id) };
      }),
    );
    const owners = results
      .filter((r): r is PromiseFulfilledResult<{ id: string; ids: string[] }> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((v) => v.ids.some((id) => formIds.includes(id)));
    if (owners.length === 1) {
      hintPageId = owners[0].id;
      hintFrom = 'formulario';
    }
  }
  const pages = session.pages.map((p) => ({ id: p.id, name: p.name }));
  if (!pages.some((p) => p.id === hintPageId)) {
    hintPageId = '';
    hintFrom = '';
  }

  return (
    <FacebookPageSelector
      resellerId={resellerId}
      clientSlug={session.clientSlug}
      clientNombre={clientNombre}
      hintPageId={hintPageId}
      hintFrom={hintFrom}
      pages={pages}
    />
  );
}
