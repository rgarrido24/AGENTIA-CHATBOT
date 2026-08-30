'use client';

import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <main className="min-h-screen p-8 bg-luxury">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-slate-400 hover:text-emerald-400 mb-6 inline-block transition">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold mb-4 title-tracking text-white font-heading">
          Motor de Campañas Outbound
        </h1>
        <p className="text-slate-400 mb-8 subtitle-tracking">
          Carga un Excel con números de teléfono y un mensaje plantilla. El sistema enviará los
          mensajes programadamente respetando las políticas de Meta.
        </p>

        <div className="card-glass p-8 space-y-4">
          <p className="text-sm text-slate-400">
            Módulo en construcción. Próximamente podrás:
          </p>
          <ul className="list-disc list-inside text-sm space-y-2">
            <li>Subir archivo Excel (.xlsx) con columna de teléfonos</li>
            <li>Definir mensaje plantilla</li>
            <li>Programar envío por horarios</li>
            <li>Respetar límites de Meta (opt-in, ventana 24h, etc.)</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
