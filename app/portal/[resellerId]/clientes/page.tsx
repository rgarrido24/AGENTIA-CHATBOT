import { requireResellerAuth } from '@/lib/reseller-auth';
import { getMongoDb } from '@/lib/mongodb';
import type { ResellerClient } from '@/lib/reseller-auth';
import { LucianoPortalThemeProvider } from '../dashboard/LucianoPortalTheme';
import ClientesPageView from './ClientesPageView';

export default async function ClientesPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const reseller = await requireResellerAuth(resellerId);

  const db = await getMongoDb();
  const now = new Date();
  const hoy = new Date(now);
  hoy.setHours(0, 0, 0, 0);
  const mes = new Date(now.getFullYear(), now.getMonth(), 1);

  const clients = await db
    .collection<ResellerClient>('leads')
    .find({ resellerId, _collection_type: 'reseller_client' })
    .sort({ nombre: 1 })
    .toArray();

  const rows = await Promise.all(
    clients.map(async (c) => {
      const base: Record<string, unknown> = c.legacyQuery
        ? { $or: [{ resellerId, clientSlug: c.clientSlug }, c.legacyQuery] }
        : { resellerId, clientSlug: c.clientSlug };
      const [total, leadsHoy, leadsMes] = await Promise.all([
        db.collection('leads').countDocuments(base),
        db.collection('leads').countDocuments({ ...base, createdAt: { $gte: hoy } }),
        db.collection('leads').countDocuments({ ...base, createdAt: { $gte: mes } }),
      ]);
      return {
        clientSlug: c.clientSlug,
        nombre: c.nombre,
        negocio: c.negocio,
        status: String(c.status ?? ''),
        activeForms: c.formularios.filter((f) => f.activo).length,
        leadsHoy,
        leadsMes,
        total,
      };
    }),
  );

  return (
    <LucianoPortalThemeProvider resellerId={resellerId}>
      <ClientesPageView
        resellerId={resellerId}
        brandLogo={reseller.brandLogo}
        brandName={reseller.brandName}
        nombre={reseller.nombre}
        rows={rows}
      />
    </LucianoPortalThemeProvider>
  );
}
