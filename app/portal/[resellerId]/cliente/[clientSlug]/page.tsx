import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { getMongoDb } from '@/lib/mongodb';
import {
  isLucianoReseller,
  LUCINO_OG_IMAGE,
  LUCINO_OG_TITLE,
  LUCINO_PRODUCT_TITLE,
} from '@/lib/portal-luciano-ui';
import { LeadsPanel } from './LeadsPanel';
import ClientLogin from './ClientLogin';

export const dynamic = 'force-dynamic';

async function isResellerClientSuspended(
  resellerId: string,
  clientSlug: string,
): Promise<boolean> {
  try {
    const db = await getMongoDb();
    const doc = await db.collection('leads').findOne(
      { _collection_type: 'reseller_client', resellerId, clientSlug },
      { projection: { status: 1 } },
    );
    return doc?.status === 'suspendido';
  } catch {
    return false;
  }
}

function ClientSuspendedNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <p className="max-w-md text-center text-base leading-relaxed text-zinc-100 md:text-lg">
        Tu cuenta está temporalmente suspendida.
        <br />
        <br />
        Contacta a tu asesor para más información.
      </p>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { resellerId: string; clientSlug: string };
}): Promise<Metadata> {
  try {
    const metadataBase = new URL('https://agentia.software');
    const db = await getMongoDb();
    const [reseller, clientDoc] = await Promise.all([
      db.collection('leads').findOne(
        { _collection_type: 'reseller', resellerId: params.resellerId },
        { projection: { brandName: 1, brandLogo: 1 } },
      ),
      db.collection('leads').findOne(
        { _collection_type: 'reseller_client', resellerId: params.resellerId, clientSlug: params.clientSlug },
        { projection: { nombre: 1 } },
      ),
    ]);
    const clientNombre = clientDoc?.nombre ? String(clientDoc.nombre) : params.clientSlug;
    const isLuc = isLucianoReseller(params.resellerId);
    const brandLogo = reseller?.brandLogo ? String(reseller.brandLogo) : '/logo-agentia-2026.png';
    const brandName = reseller?.brandName ? String(reseller.brandName) : 'Panel de Leads';
    const productTitle = isLuc ? LUCINO_PRODUCT_TITLE : brandName;
    const title = `${clientNombre} · ${productTitle}`;
    const ogTitle = isLuc ? LUCINO_OG_TITLE : title;
    const ogImage = isLuc ? new URL(LUCINO_OG_IMAGE, metadataBase).toString() : new URL(brandLogo, metadataBase).toString();
    const ogAlt = isLuc ? 'Luciano Ads Mánager' : brandName;
    const desc = 'Gestión de leads en tiempo real';
    return {
      metadataBase,
      title,
      description: desc,
      openGraph: {
        title: ogTitle,
        description: desc,
        type: 'website',
        url: new URL(`/portal/${params.resellerId}/cliente/${params.clientSlug}`, metadataBase).toString(),
        images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: desc,
        images: [ogImage],
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

  // Client cookie → restricted access (client views their own leads)
  const cookieStore  = await cookies();
  const clientCookie = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  const isClientAuthed =
    !reseller && (await verifyClientCookie(clientCookie, resellerId, clientSlug));

  if (reseller || isClientAuthed) {
    if (await isResellerClientSuspended(resellerId, clientSlug)) {
      return <ClientSuspendedNotice />;
    }
    if (reseller) {
      return <LeadsPanel resellerId={resellerId} clientSlug={clientSlug} allowLeadDelete />;
    }
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
