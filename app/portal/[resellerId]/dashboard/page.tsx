import type { Metadata } from 'next';
import { requireResellerAuth } from '@/lib/reseller-auth';
import { getMongoDb } from '@/lib/mongodb';
import type { ResellerClient } from '@/lib/reseller-auth';
import {
  isLucianoReseller,
  LUCINO_OG_IMAGE,
  LUCINO_OG_TITLE,
  LUCINO_PRODUCT_TITLE,
} from '@/lib/portal-luciano-ui';
import { LucianoPortalThemeProvider } from './LucianoPortalTheme';
import DashboardView from './DashboardView';

export async function generateMetadata({
  params,
}: {
  params: { resellerId: string };
}): Promise<Metadata> {
  try {
    const db       = await getMongoDb();
    const reseller = await db.collection('leads').findOne(
      { _collection_type: 'reseller', resellerId: params.resellerId },
      { projection: { brandName: 1, brandLogo: 1, nombre: 1 } },
    );
    const isLuc = isLucianoReseller(params.resellerId);
    const brandLogo = reseller?.brandLogo ? String(reseller.brandLogo) : '/logo-agentia-2026.png';
    const brandName = reseller?.brandName ? String(reseller.brandName) : 'Dashboard';
    const resellerNombre = reseller?.nombre ? String(reseller.nombre) : params.resellerId;
    const productTitle = isLuc ? LUCINO_PRODUCT_TITLE : brandName;
    const title = `${resellerNombre} · ${productTitle}`;
    const ogTitle = isLuc ? LUCINO_OG_TITLE : title;
    const ogImage = isLuc ? LUCINO_OG_IMAGE : brandLogo;
    const ogAlt = isLuc ? 'Luciano Ads Mánager' : brandName;
    const desc = 'Gestión de leads en tiempo real';
    return {
      title,
      description: desc,
      openGraph: {
        title: ogTitle,
        description: desc,
        type: 'website',
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
    return { title: 'Dashboard' };
  }
}

export default async function DashboardPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const reseller = await requireResellerAuth(resellerId);

  const db  = await getMongoDb();
  const now = new Date();
  const hoy    = new Date(now); hoy.setHours(0, 0, 0, 0);
  const semana = new Date(now); semana.setDate(now.getDate() - 7);
  const mes    = new Date(now.getFullYear(), now.getMonth(), 1);

  const clients = await db
    .collection<ResellerClient>('leads')
    .find({ resellerId, _collection_type: 'reseller_client' })
    .sort({ nombre: 1 })
    .toArray();

  const clientsWithStats = await Promise.all(
    clients.map(async (c) => {
      const base: Record<string, unknown> = c.legacyQuery
        ? { $or: [{ resellerId, clientSlug: c.clientSlug }, c.legacyQuery] }
        : { resellerId, clientSlug: c.clientSlug };
      const [total, leadsHoy] = await Promise.all([
        db.collection('leads').countDocuments(base),
        db.collection('leads').countDocuments({ ...base, createdAt: { $gte: hoy } }),
      ]);
      return { ...c, total, leadsHoy };
    })
  );

  const [statsHoy, statsSemana, statsMes] = await Promise.all([
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: hoy } }),
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: semana } }),
    db.collection('leads').countDocuments({ resellerId, createdAt: { $gte: mes } }),
  ]);

  return (
    <LucianoPortalThemeProvider resellerId={resellerId}>
      <DashboardView
        resellerId={resellerId}
        brandLogo={reseller.brandLogo}
        brandName={reseller.brandName}
        brandColor={reseller.brandColor}
        nombre={reseller.nombre}
        statsHoy={statsHoy}
        statsSemana={statsSemana}
        statsMes={statsMes}
        clients={clientsWithStats.map((c) => ({
          clientSlug: c.clientSlug,
          nombre: c.nombre,
          negocio: c.negocio,
          status: String(c.status ?? ''),
          leadsHoy: c.leadsHoy,
          total: c.total,
        }))}
      />
    </LucianoPortalThemeProvider>
  );
}
