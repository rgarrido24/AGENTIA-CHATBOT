import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMongoDb } from '@/lib/mongodb';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';
import { isPanelActive } from '@/lib/loyalty-session';
import { ENLACES_VACIOS, limpiarEnlaces, type Enlaces } from '@/lib/lealtad-enlaces';

export const dynamic = 'force-dynamic';

type Props = { params: { negocio: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getLoyaltyTenant(params.negocio);
  return { title: t ? `${t.nombre} · Enlaces` : 'Enlaces', robots: { index: false, follow: false } };
}

export default async function LinkNegocioPage({ params }: Props) {
  const t = await getLoyaltyTenant(params.negocio);
  if (!t || t.isDemo) notFound();
  const doc = await (await getMongoDb()).collection('loyalty_enlaces').findOne({ key: t.id });
  const e: Enlaces = { ...ENLACES_VACIOS, ...limpiarEnlaces((doc as Record<string, unknown>) ?? {}) };
  const activo = await isPanelActive(t.id);

  const botones: { href: string; texto: string; principal?: boolean }[] = [];
  if (activo) botones.push({ href: `${t.basePath}/alta`, texto: '💳 Mi tarjeta de lealtad', principal: true });
  if (e.menuUrl) botones.push({ href: e.menuUrl, texto: '🍽️ Menú' });
  if (e.mapsUrl) botones.push({ href: e.mapsUrl, texto: '📍 Ubicación' });
  if (e.whatsapp) botones.push({ href: `https://wa.me/${e.whatsapp}`, texto: '💬 WhatsApp' });
  if (e.web) botones.push({ href: e.web, texto: '🌐 Sitio web' });
  const redes = [
    { href: e.instagram, texto: 'Instagram' },
    { href: e.facebook, texto: 'Facebook' },
    { href: e.tiktok, texto: 'TikTok' },
  ].filter((r) => r.href);

  return (
    <main
      className="flex min-h-screen flex-col items-center px-5 py-10 text-white"
      style={{ background: `linear-gradient(160deg, ${t.colorPrimario}, #000 170%)` }}
    >
      <div className="w-full max-w-sm text-center">
        {t.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logoUrl} alt={t.nombre} className="mx-auto h-28 w-28 rounded-3xl bg-white object-contain p-1.5 shadow-xl" />
        ) : null}
        <h1 className="mt-5 text-2xl font-black">{t.nombre}</h1>
        {e.descripcion ? <p className="mt-2 text-sm text-white/75">{e.descripcion}</p> : null}
        <div className="mt-7 flex flex-col gap-3">
          {botones.map((b) => (
            <a
              key={b.texto}
              href={b.href}
              target={b.href.startsWith('/') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="rounded-2xl px-5 py-3.5 text-base font-bold shadow-md"
              style={b.principal ? { background: t.colorAcento, color: '#111' } : { background: 'rgba(255,255,255,0.14)', color: '#fff' }}
            >
              {b.texto}
            </a>
          ))}
        </div>
        {redes.length ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {redes.map((r) => (
              <a key={r.texto} href={r.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white/85">
                {r.texto}
              </a>
            ))}
          </div>
        ) : null}
        <p className="mt-10 text-[10px] uppercase tracking-widest text-white/35">Tarjeta de lealtad por Agentia</p>
      </div>
    </main>
  );
}
