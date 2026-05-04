import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { getMongoDb } from '@/lib/mongodb';
import { LeadsPanel } from './LeadsPanel';
import ClientLogin from './ClientLogin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { resellerId: string; clientSlug: string };
}): Promise<Metadata> {
  try {
    const db       = await getMongoDb();
    const reseller = await db.collection('leads').findOne(
      { _collection_type: 'reseller', resellerId: params.resellerId },
      { projection: { brandName: 1, brandLogo: 1 } },
    );
    const brandName = reseller?.brandName ? String(reseller.brandName) : 'Panel de Leads';
    const brandLogo = reseller?.brandLogo ? String(reseller.brandLogo) : '/logo-agentia-2026.png';
    const title     = `${brandName} · Panel de Leads`;
    return {
      title,
      description: 'Gestión de leads en tiempo real',
      openGraph: {
        title,
        description: 'Gestión de leads en tiempo real',
        images: [{ url: brandLogo, width: 512, height: 512, alt: brandName }],
      },
    };
  } catch {
    return { title: 'Panel de Leads' };
  }
}

export default async function ClientPage({
  params,
}: {
  params: { resellerId: string; clientSlug: string };
}) {
  const { resellerId, clientSlug } = params;

  // Reseller cookie → full access (Luciano viewing his client's panel)
  const reseller = await getResellerAuth(resellerId);
  if (reseller) {
    return <LeadsPanel resellerId={resellerId} clientSlug={clientSlug} />;
  }

  // Client cookie → restricted access (client views their own leads)
  const cookieStore  = await cookies();
  const clientCookie = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  const isAuthed     = await verifyClientCookie(clientCookie, resellerId, clientSlug);
  if (isAuthed) {
    return <LeadsPanel resellerId={resellerId} clientSlug={clientSlug} />;
  }

  // Not authenticated → show login
  let clientNombre: string | undefined;
  let brandLogo: string | undefined;
  let brandName: string | undefined;
  try {
    const db = await getMongoDb();
    const [clientDoc, resellerDoc] = await Promise.all([
      db.collection('leads').findOne({ _collection_type: 'reseller_client', resellerId, clientSlug }),
      db.collection('leads').findOne({ _collection_type: 'reseller', resellerId }),
    ]);
    clientNombre = clientDoc?.nombre ? String(clientDoc.nombre) : undefined;
    brandLogo    = resellerDoc?.brandLogo ? String(resellerDoc.brandLogo) : undefined;
    brandName    = resellerDoc?.brandName ? String(resellerDoc.brandName) : undefined;
  } catch { /* ignore */ }

  return (
    <ClientLogin
      resellerId={resellerId}
      clientSlug={clientSlug}
      clientNombre={clientNombre}
      brandLogo={brandLogo}
      brandName={brandName}
    />
  );
}
