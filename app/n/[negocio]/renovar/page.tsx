import { notFound } from 'next/navigation';
import { getMongoDb } from '@/lib/mongodb';
import { promoTipoNegocio } from '@/lib/lealtad-promo';
import { RenovarForm } from './RenovarForm';

export const dynamic = 'force-dynamic';

export default async function RenovarPage({ params }: { params: { negocio: string } }) {
  const t = await (await getMongoDb()).collection('loyalty_tenants').findOne({ key: params.negocio, isDemo: { $ne: true }, plan: { $ne: 'demo' } });
  if (!t) notFound();
  const promoAnual = (await promoTipoNegocio('anual', params.negocio).catch(() => null)) === 'anual';
  const promoMes = (await promoTipoNegocio('mensual', params.negocio).catch(() => null)) === 'mes';
  return (
    <RenovarForm
      negocio={params.negocio}
      nombre={String(t.nombre)}
      sucursales={Number(t.sucursales) || 1}
      promoAnual={promoAnual}
      promoMes={promoMes}
      enPrueba={t.plan === 'trial'}
      vigenteHasta={t.vigenteHasta ? new Date(t.vigenteHasta).toISOString() : null}
    />
  );
}
