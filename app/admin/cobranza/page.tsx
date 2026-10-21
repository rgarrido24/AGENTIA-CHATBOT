'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Detail = {
  clientSlug: string; nombre: string; status: string; fbNative: boolean; whatsappApi: boolean; forms: boolean;
  waNumber: string; waStatus: string; waQuality: string; waError: string; messagesMonth: number; formsCount: number;
};
type Reseller = {
  resellerId: string; nombre: string;
  totals: { clients: number; activos: number; fbNative: number; whatsappApi: number; forms: number; both: number };
  detail: Detail[];
};

const TARIFF_KEY = 'agentia_cobranza_tarifas_v1';

export default function CobranzaPage() {
  const [data, setData] = useState<{ month: string; resellers: Reseller[] } | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  // Tarifas mensuales por cliente activo (USD). Se guardan solo en este navegador.
  const [api, setApi] = useState(8);
  const [forms, setForms] = useState(4);
  const [both, setBoth] = useState(10);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TARIFF_KEY);
      if (raw) {
        const t = JSON.parse(raw) as { api?: number; forms?: number; both?: number };
        if (typeof t.api === 'number') setApi(t.api);
        if (typeof t.forms === 'number') setForms(t.forms);
        if (typeof t.both === 'number') setBoth(t.both);
      }
    } catch { /* sin almacenamiento */ }
    fetch('/api/admin/cobranza', { cache: 'no-store' })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'Error');
        setData(j);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error de conexión'));
  }, []);

  useEffect(() => {
    try { localStorage.setItem(TARIFF_KEY, JSON.stringify({ api, forms, both })); } catch { /* ignorar */ }
  }, [api, forms, both]);

  const amount = useMemo(
    () => (t: Reseller['totals']) => (t.whatsappApi - t.both) * api + (t.forms - t.both) * forms + t.both * both,
    [api, forms, both],
  );

  const num = 'w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-right text-sm';

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="text-sm text-slate-400 hover:text-emerald-400">← Panel</Link>
          <h1 className="text-xl font-bold">Cobranza de revendedores</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
          <span className="text-slate-300">Tarifa mensual por cliente (USD):</span>
          <label className="flex items-center gap-2">API WhatsApp <input type="number" min={0} className={num} value={api} onChange={(e) => setApi(Number(e.target.value) || 0)} /></label>
          <label className="flex items-center gap-2">Formularios <input type="number" min={0} className={num} value={forms} onChange={(e) => setForms(Number(e.target.value) || 0)} /></label>
          <label className="flex items-center gap-2">Los dos juntos <input type="number" min={0} className={num} value={both} onChange={(e) => setBoth(Number(e.target.value) || 0)} /></label>
        </div>

        {error ? <p className="text-amber-400">{error}</p> : null}
        {!data && !error ? <p className="text-slate-500">Cargando…</p> : null}

        {data?.resellers.map((r) => (
          <section key={r.resellerId} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{r.nombre}</h2>
                <p className="text-xs text-slate-400">{r.resellerId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">A cobrar este mes</p>
                <p className="text-2xl font-bold text-emerald-400">${amount(r.totals).toFixed(2)} USD</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-6">
              {[
                ['Clientes', r.totals.clients],
                ['Activos', r.totals.activos],
                ['Con Facebook directo', r.totals.fbNative],
                ['API WhatsApp', r.totals.whatsappApi],
                ['Formularios', r.totals.forms],
                ['Con los dos', r.totals.both],
              ].map(([label, v]) => (
                <div key={String(label)} className="rounded-lg bg-black/30 p-2">
                  <p className="text-lg font-bold">{v}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs text-slate-300 underline" onClick={() => setOpen(open === r.resellerId ? null : r.resellerId)}>
              {open === r.resellerId ? 'Ocultar detalle' : 'Ver detalle por cliente'}
            </button>
            {open === r.resellerId ? (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-slate-400">
                      <th className="py-2 pr-2">Cliente</th><th className="pr-2">Estado</th><th className="pr-2">Facebook</th>
                      <th className="pr-2">API</th><th className="pr-2">Número</th><th className="pr-2">Msgs mes</th><th className="pr-2">Forms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.detail.map((d) => (
                      <tr key={d.clientSlug} className="border-b border-white/5">
                        <td className="py-1.5 pr-2">{d.nombre}</td>
                        <td className="pr-2">{d.status}</td>
                        <td className="pr-2">{d.fbNative ? '✔' : '—'}</td>
                        <td className="pr-2">{d.whatsappApi ? 'Sí' : '—'}</td>
                        <td className="pr-2">
                          {d.waNumber ? `${d.waNumber} ${d.waStatus === 'connected' ? '✔' : '⚠'}` : d.whatsappApi ? 'sin conectar' : '—'}
                          {d.waQuality ? ` · ${d.waQuality}` : ''}
                          {d.waError ? <span className="block text-amber-400">{d.waError}</span> : null}
                        </td>
                        <td className="pr-2">{d.messagesMonth}</td>
                        <td className="pr-2">{d.forms ? `Sí (${d.formsCount})` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ))}
        <p className="text-xs text-slate-500">
          El monto es una referencia: cuenta los add-ons activados hoy y las tarifas de arriba. Los mensajes de WhatsApp los cobra Meta directo a cada cliente y no entran aquí.
        </p>
      </div>
    </div>
  );
}
