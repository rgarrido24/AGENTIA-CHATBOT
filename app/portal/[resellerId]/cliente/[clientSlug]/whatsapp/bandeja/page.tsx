import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import { getWaAccountByClient } from '@/lib/wa-accounts';
import Inbox from './Inbox';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'WhatsApp · bandeja' };

function Notice({ back, title, children }: { back: string; title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="inline-block rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300">En construcción</p>
        <h1 className="text-lg font-bold">{title}</h1>
        <div className="space-y-3 text-sm text-zinc-300">{children}</div>
        <Link href={back} className="inline-block text-xs text-zinc-400 underline">← Volver</Link>
      </div>
    </main>
  );
}

export default async function BandejaPage({ params }: { params: { resellerId: string; clientSlug: string } }) {
  const { resellerId, clientSlug } = params;
  const back = `/portal/${resellerId}/cliente/${clientSlug}`;
  const reseller = await getResellerAuth(resellerId);
  const clientCookie = (await cookies()).get(CLIENT_COOKIE_NAME)?.value;
  if (!reseller && !(await verifyClientCookie(clientCookie, resellerId, clientSlug))) {
    return <Notice back={back} title="Inicia sesión"><p>Entra a tu panel para ver tus conversaciones.</p></Notice>;
  }
  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1, nombre: 1 } },
  );
  if (!client || !isAddonEnabled(client, 'whatsappApi')) {
    return (
      <Notice back={back} title="Bandeja de WhatsApp">
        <p>Aquí vas a poder ver y contestar los mensajes que te lleguen por el WhatsApp oficial de tu negocio, sin salir del panel.</p>
        <p>Todavía no está activa en tu cuenta. Cuando esté lista, tu asesor te avisa.</p>
      </Notice>
    );
  }
  if (!(await getWaAccountByClient(resellerId, clientSlug))) {
    return (
      <Notice back={back} title="Bandeja de WhatsApp">
        <p>Falta conectar el número de WhatsApp de tu negocio. Tu asesor lo conecta desde su panel.</p>
      </Notice>
    );
  }
  return <Inbox resellerId={resellerId} clientSlug={clientSlug} clientName={client.nombre ? String(client.nombre) : clientSlug} />;
}
