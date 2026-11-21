'use client';

import { useCallback, useEffect, useState } from 'react';

type Sol = {
  ref: string; tipo: string; trial: boolean; estado: string; negocio: string; whatsapp: string;
  pago: string; total: number; periodo: string; concepto: string | null; createdAt: string; error: string | null; tenantKey: string | null;
};
type Ten = { key: string; nombre: string; plan: string; panelActivo: boolean; vigenteHasta?: string; whatsapp?: string; estadoSuscripcion?: string };

const pendientes = ['pendiente_spei', 'pendiente_pago', 'error_checkout', 'monto_no_coincide', 'pagado', 'error_activacion'];

export default function AdminLealtad() {
  const [sols, setSols] = useState<Sol[]>([]);
  const [tens, setTens] = useState<Ten[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [tkey, setTkey] = useState('sabucan');

  const cargar = useCallback(async () => {
    const r = await fetch('/api/admin/lealtad');
    if (r.ok) {
      const d = await r.json();
      setSols(d.solicitudes);
      setTens(d.tenants);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function confirmar(s: Sol) {
    if (!confirm(`¿Confirmas que recibiste $${s.total} de ${s.negocio}? Se activará de inmediato.`)) return;
    setBusy(s.ref); setMsg('');
    const r = await fetch('/api/admin/lealtad', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: s.ref }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `✅ ${s.negocio} activado` : `❌ ${d.error || 'Error'}`);
    setBusy(''); cargar();
  }

  async function accionNegocio(accion: 'ocultar' | 'mostrar' | 'activar') {
    const txt = accion === 'ocultar' ? 'DESACTIVAR TOTAL (404 en todo)' : accion === 'mostrar' ? 'dejar visible (suspendido)' : 'ACTIVAR';
    if (!confirm(`¿${txt} el negocio "${tkey}"?`)) return;
    setBusy('t'); setMsg('');
    const r = await fetch('/api/admin/lealtad/tenant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: tkey, accion }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `✅ ${tkey}: ${accion}` : `❌ ${d.error || 'Error'}`);
    setBusy('');
  }

  const f = (d?: string) => (d ? new Date(d).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : '—');
  return (
    <div className="mx-auto max-w-5xl p-6 text-sm">
      <h1 className="text-2xl font-bold">Agentia Lealtad — solicitudes y negocios</h1>
      {msg && <p className="mt-3 font-semibold">{msg}</p>}

      <h2 className="mt-8 text-lg font-semibold">Activar / desactivar un negocio (cualquiera, incluso los anteriores)</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/15 p-3">
        <input value={tkey} onChange={(e) => setTkey(e.target.value)} className="rounded-lg border border-white/20 bg-transparent px-3 py-2" placeholder="key (ej. sabucan)" />
        <button disabled={busy === 't'} onClick={() => accionNegocio('ocultar')} className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white disabled:opacity-50">Desactivar total (404)</button>
        <button disabled={busy === 't'} onClick={() => accionNegocio('mostrar')} className="rounded-lg border border-white/30 px-3 py-2 font-semibold disabled:opacity-50">Dejar visible (suspendido)</button>
        <button disabled={busy === 't'} onClick={() => accionNegocio('activar')} className="rounded-lg bg-white px-3 py-2 font-semibold text-black disabled:opacity-50">Activar</button>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Pendientes de pago o con error</h2>
      <div className="mt-2 space-y-2">
        {sols.filter((s) => pendientes.includes(s.estado)).length === 0 && <p className="opacity-60">Nada pendiente.</p>}
        {sols.filter((s) => pendientes.includes(s.estado)).map((s) => (
          <div key={s.ref} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 p-3">
            <div>
              <b>{s.negocio}</b> · {s.tipo === 'renovacion' ? 'renovación' : 'nuevo'} · {s.pago} · <b>${s.total}</b> ({s.periodo})
              <div className="opacity-70">WhatsApp {s.whatsapp} · concepto <b>{s.concepto ?? '—'}</b> · {s.estado} · {f(s.createdAt)}</div>
              {s.error && <div className="text-red-400">{s.error}</div>}
            </div>
            <button onClick={() => confirmar(s)} disabled={busy === s.ref} className="rounded-lg bg-white px-3 py-2 font-semibold text-black disabled:opacity-50">
              {busy === s.ref ? 'Activando…' : 'Confirmar pago y activar'}
            </button>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold">Negocios (self-serve)</h2>
      <table className="mt-2 w-full text-left">
        <thead className="opacity-60"><tr><th>Negocio</th><th>Plan</th><th>Estado</th><th>Vigente hasta</th><th>WhatsApp</th></tr></thead>
        <tbody>
          {tens.map((t) => (
            <tr key={t.key} className="border-t border-white/10">
              <td className="py-2"><a className="underline" href={`/n/${t.key}/login`} target="_blank">{t.nombre}</a></td>
              <td>{t.plan}</td><td>{t.panelActivo === false ? 'pausado' : 'activo'}</td><td>{f(t.vigenteHasta)}</td><td>{t.whatsapp}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">Últimas solicitudes</h2>
      <table className="mt-2 w-full text-left">
        <thead className="opacity-60"><tr><th>Fecha</th><th>Negocio</th><th>Tipo</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead>
        <tbody>
          {sols.slice(0, 40).map((s) => (
            <tr key={s.ref} className="border-t border-white/10">
              <td className="py-2">{f(s.createdAt)}</td><td>{s.negocio}</td><td>{s.trial ? 'prueba' : s.tipo}</td><td>{s.pago}</td><td>${s.total}</td><td>{s.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
