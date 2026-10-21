import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getResellerAuth } from '@/lib/reseller-auth';
import { verifyClientCookie, CLIENT_COOKIE_NAME } from '@/lib/client-auth';
import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import { getWaAccountByClient } from '@/lib/wa-accounts';
import WhatsAppCampaigns from './WhatsAppCampaigns';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'WhatsApp · campañas' };

function Notice({ back, title, children }: { back: string; title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="inline-block rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300">En construcción</p>
        <h1 className="text-lg font-bold">{title}</h1>
        <div className="space-y-3 text-sm text-zinc-300">{children}</div>
        <Link href={back} className="inline-block text-xs text-zinc-400 underline">← Volver a leads</Link>
      </div>
    </main>
  );
}

export default async function WhatsAppPage({ params }: { params: { resellerId: string; clientSlug: string } }) {
  const { resellerId, clientSlug } = params;
  const back = `/portal/${resellerId}/cliente/${clientSlug}`;
  const reseller = await getResellerAuth(resellerId);
  const clientCookie = (await cookies()).get(CLIENT_COOKIE_NAME)?.value;
  const ok = !!reseller || (await verifyClientCookie(clientCookie, resellerId, clientSlug));

  if (!ok) {
    return (
      <Notice back={back} title="Inicia sesión">
        <p>Entra a tu panel para usar esta sección.</p>
      </Notice>
    );
  }

  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1, nombre: 1 } },
  );

  if (!client || !isAddonEnabled(client, 'whatsappApi')) {
    return (
      <Notice back={back} title="Campañas de WhatsApp">
        <p>Estamos preparando una herramienta para que mandes mensajes de WhatsApp a tus contactos desde este mismo panel, con el número oficial de tu negocio.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Crear mensajes (plantillas) y mandarlos a aprobación.</li>
          <li>Enviar campañas a las personas que ya te dejaron sus datos.</li>
          <li>Ver cuántos mensajes se entregaron y se leyeron.</li>
          <li>Recibir y contestar las respuestas aquí.</li>
        </ul>
        <p>Todavía no está activa en tu cuenta. Cuando esté lista, tu asesor te avisa.</p>
      </Notice>
    );
  }

  const account = await getWaAccountByClient(resellerId, clientSlug);
  if (!account) {
    return (
      <Notice back={back} title="Campañas de WhatsApp">
        <p>Ya está activa en tu cuenta, pero falta conectar el número de WhatsApp de tu negocio.</p>
        <p>Tu asesor lo conecta desde su panel. En cuanto quede listo, aquí podrás crear plantillas y mandar campañas.</p>
      </Notice>
    );
  }

  return (
    <WhatsAppCampaigns
      resellerId={resellerId}
      clientSlug={clientSlug}
      clientName={client.nombre ? String(client.nombre) : clientSlug}
    />
  );
}
