import { notFound } from 'next/navigation';
import { LucianoDigitalBriefForm } from '@/app/brief/LucianoDigitalBriefForm';

export const metadata = {
  title: 'Brief digital · Luciano',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizeSlug(raw: string | string[] | undefined): string | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const s = String(v ?? '').trim().toLowerCase();
  if (!s || s.length > 80) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}

export default function LucianoClientBriefPage({
  params,
}: {
  params: { clientSlug: string };
}) {
  const clientSlug = normalizeSlug(params.clientSlug);
  if (!clientSlug) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>
      <LucianoDigitalBriefForm clientSlug={clientSlug} />
    </div>
  );
}
