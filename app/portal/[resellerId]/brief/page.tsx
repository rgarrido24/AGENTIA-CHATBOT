import { requireResellerAuth } from '@/lib/reseller-auth';
import { getMongoDb } from '@/lib/mongodb';
import { LucianoPortalThemeProvider } from '../dashboard/LucianoPortalTheme';
import BriefAdminView from './ui/BriefAdminView';

/** Preguntas por defecto del brief: `lib/brief-default-questions.ts` (editables en BriefAdminView). */

export const dynamic = 'force-dynamic';

type BriefRow = {
  resellerId: string;
  token: string;
  createdAt: Date;
  completedAt?: Date;
  score?: number;
  client?: Record<string, unknown>;
};

export default async function BriefPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const reseller = await requireResellerAuth(resellerId);

  const db = await getMongoDb();
  const docs = await db
    .collection<BriefRow>('briefs')
    .find({ resellerId })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return (
    <LucianoPortalThemeProvider resellerId={resellerId}>
      <BriefAdminView
        resellerId={resellerId}
        brandLogo={reseller.brandLogo}
        brandName={reseller.brandName}
        brandColor={reseller.brandColor}
        nombre={reseller.nombre}
        briefs={docs.map((d) => ({
          token: d.token,
          createdAt: d.createdAt,
          completedAt: d.completedAt ?? null,
          score: typeof d.score === 'number' ? d.score : null,
          negocio: String((d.client as any)?.negocio_nombre ?? ''),
          contacto: String((d.client as any)?.contacto_nombre ?? ''),
        }))}
      />
    </LucianoPortalThemeProvider>
  );
}

