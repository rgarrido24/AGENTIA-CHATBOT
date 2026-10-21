import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import WhatsAppCampaigns from './WhatsAppCampaigns';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'WhatsApp · campañas' };

export default async function WhatsAppPage({ params }: { params: { resellerId: string; clientSlug: string } }) {
  const { resellerId, clientSlug } = params;
  const reseller = await getResellerAuth(resellerId);
  const clientCookie = (await cookies()).get(CLIENT_COOKIE_NAME)?.value;
  const ok = !!reseller || (await verifyClientCookie(clientCookie, resellerId, clientSlug));

  const shell = (text: string) => (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <p className="max-w-md text-center text-zinc-100">{text}</p>
    </main>
  );

  if (!ok) return shell('Inicia sesión en tu panel para usar esta sección.');

  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1, nombre: 1 } },
  );
  if (!client || !isAddonEnabled(client, 'whatsappApi')) {
    return shell('Esta función no está activa para tu cuenta. Pídele a tu asesor que la active.');
  }

  return (
    <WhatsAppCampaigns
      resellerId={resellerId}
      clientSlug={clientSlug}
      clientName={client.nombre ? String(client.nombre) : clientSlug}
    />
  );
}
