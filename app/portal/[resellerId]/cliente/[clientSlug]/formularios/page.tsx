import type { Metadata } from 'next';
import { getResellerAuth } from '@/lib/reseller-auth';
import { getMongoDb } from '@/lib/mongodb';
import { isAddonEnabled } from '@/lib/client-addons';
import FormsManager from './FormsManager';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Formularios a WhatsApp' };

export default async function FormulariosPage({ params }: { params: { resellerId: string; clientSlug: string } }) {
  const { resellerId, clientSlug } = params;
  const reseller = await getResellerAuth(resellerId);

  const shell = (text: string) => (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <p className="max-w-md text-center text-zinc-100">{text}</p>
    </main>
  );

  if (!reseller) return shell('Inicia sesión en tu panel para usar esta sección.');

  const db = await getMongoDb();
  const client = await db.collection('leads').findOne(
    { _collection_type: 'reseller_client', resellerId, clientSlug },
    { projection: { addons: 1, nombre: 1, alertNumber: 1 } },
  );
  if (!client || !isAddonEnabled(client, 'forms')) {
    return shell('Activa el add-on "Formularios a WhatsApp" para este cliente en la lista de clientes.');
  }

  return (
    <FormsManager
      resellerId={resellerId}
      clientSlug={clientSlug}
      clientName={client.nombre ? String(client.nombre) : clientSlug}
      defaultNumber={client.alertNumber ? String(client.alertNumber) : ''}
    />
  );
}
