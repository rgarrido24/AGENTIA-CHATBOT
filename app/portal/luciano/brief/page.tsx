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

export default function LucianoBriefPage({
  searchParams,
}: {
  searchParams: { clientSlug?: string | string[] };
}) {
  const clientSlug = normalizeSlug(searchParams.clientSlug);

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f8' }}>
      {!clientSlug ? (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <div
            className="rounded-2xl border p-8 shadow-sm"
            style={{ background: '#fff', borderColor: 'rgba(15,23,42,0.08)', color: '#0f172a' }}
          >
            <h1 className="text-lg font-bold">Falta el cliente en el link</h1>
            <p className="mt-2 text-sm text-slate-600">
              Abrí el brief con el enlace que te envió Luciano. Debe incluir{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">?clientSlug=tu-empresa</code>
            </p>
          </div>
        </div>
      ) : (
        <LucianoDigitalBriefForm clientSlug={clientSlug} />
      )}
    </div>
  );
}
