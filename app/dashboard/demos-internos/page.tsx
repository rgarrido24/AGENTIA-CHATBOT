import Link from 'next/link';
import AdminAuthGuard from '@/components/AdminAuthGuard';

export default function DemosInternosPage() {
  return (
    <AdminAuthGuard fromPath="/dashboard/demos-internos">
      <div className="min-h-screen bg-[#0a0a0f] text-white p-6 sm:p-10">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-slate-500">Dashboard</p>
              <h1 className="text-2xl font-bold">Demos internos</h1>
              <p className="text-sm text-slate-400 mt-1">Rutas de demos que no se muestran en el menú principal.</p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:text-white transition"
            >
              ← Volver
            </Link>
          </div>

          <div className="mt-8 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold">Vidriería (mock)</p>
              <p className="text-xs text-slate-400 mt-1">
                Mock anterior de Deco House, útil para futuras demos similares.
              </p>
              <div className="mt-3">
                <Link
                  href="/demo/vidrieria"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-400/20 px-3 py-2 text-xs text-sky-200 hover:bg-sky-500/15 transition"
                >
                  Abrir /demo/vidrieria →
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-8 text-xs text-slate-600">
            Nota: estas rutas se mantienen fuera del menú público para evitar confusión con implementaciones reales.
          </p>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

