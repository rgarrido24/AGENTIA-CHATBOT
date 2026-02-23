'use client';

import Link from 'next/link';

export default function LeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen p-6 bg-[#0a1209] flex flex-col items-center justify-center">
      <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <h1 className="text-xl font-bold text-red-300 mb-2">Error al cargar Leads</h1>
        <p className="text-slate-400 text-sm mb-4">{error.message}</p>
        <p className="text-slate-500 text-xs mb-6">
          Revisa que MongoDB esté configurado (MONGODB_URI en .env) y que el servidor esté corriendo.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-sage text-slate-900 font-medium hover:bg-sage/90 transition"
          >
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg border border-forest text-sage hover:bg-forest/20 transition"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
