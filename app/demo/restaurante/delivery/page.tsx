'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MOCK_CLIENTES_DELIVERY, MOCK_ORDENES, type ClienteDelivery } from '@/lib/mock-data-restaurante';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

type FiltroCrm = 'todos' | 'gt30' | '15_29' | 'activos';

function mensajeRecordatorio(c: ClienteDelivery): string {
  if (c.diasSinPedir > 30) {
    return `¡Hola ${c.nombre}! 👋 ¿Ya pasó mucho tiempo desde tu última visita a La Séptima?\nTe extrañamos 🍔 Hoy tenemos una promo especial solo para ti:\n🎉 2x1 en Mojitos + Envío GRATIS en tu próximo pedido.\n¡Válido solo hoy! Haz tu pedido por WhatsApp: https://wa.me/529991234567`;
  }
  if (c.diasSinPedir >= 15) {
    return `¡Hola ${c.nombre}! En La Séptima tenemos novedades que te van a encantar 🔥\nSabemos que te gustan ${c.favorito} — hoy están en promo.\n¿Antojo de algo rico? Pedimos para ti 🛵`;
  }
  return `¡Hola ${c.nombre}! Gracias por ser parte de La Séptima 🍻\nTu platillo favorito ${c.favorito} te espera. ¿Pedimos hoy?`;
}

export default function DeliveryCrmPage() {
  const [tab, setTab] = useState<'ordenes' | 'crm'>('ordenes');
  const [filtro, setFiltro] = useState<FiltroCrm>('todos');
  const [modal, setModal] = useState<ClienteDelivery | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [campañaTexto, setCampañaTexto] = useState(
    'Hola {nombre}, te extrañamos en La Séptima. Hoy 2x1 en Mojitos + envío gratis.'
  );
  const [campañaMsgs, setCampañaMsgs] = useState<string[] | null>(null);

  const deliveryOrdenes = useMemo(
    () => MOCK_ORDENES.filter((o) => o.tipo === 'delivery'),
    []
  );

  const clientesFiltrados = useMemo(() => {
    return MOCK_CLIENTES_DELIVERY.filter((c) => {
      if (filtro === 'gt30') return c.diasSinPedir > 30;
      if (filtro === '15_29') return c.diasSinPedir >= 15 && c.diasSinPedir <= 29;
      if (filtro === 'activos') return c.diasSinPedir < 15;
      return true;
    });
  }, [filtro]);

  const inactivos30 = MOCK_CLIENTES_DELIVERY.filter((c) => c.diasSinPedir > 30);

  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      nueva: 'Nueva',
      en_preparacion: 'Preparando',
      lista: 'En camino',
      entregada: 'Entregada',
    };
    return m[s] ?? s;
  };

  const badgeDias = (d: number) => {
    if (d > 30)
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
          {d} días — En riesgo de perder
        </span>
      );
    if (d >= 15)
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40">
          {d} días — Necesita recordatorio
        </span>
      );
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        {d} días — Cliente activo
      </span>
    );
  };

  const waLink = (c: ClienteDelivery, msg: string) =>
    `https://wa.me/52${c.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setTab('ordenes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'ordenes' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          🛵 Órdenes Delivery
        </button>
        <button
          type="button"
          onClick={() => setTab('crm')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'crm' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          👥 Clientes & Recordatorios
        </button>
      </div>

      {tab === 'ordenes' && (
        <div className="grid gap-4 md:grid-cols-2">
          {deliveryOrdenes.map((o) => (
            <div key={o.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-bold text-white">#{o.id}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-200">
                  {statusLabel(o.status)}
                </span>
              </div>
              <p className="text-sm text-slate-300">{o.cliente?.nombre}</p>
              <p className="text-xs text-slate-500">{o.cliente?.direccion}</p>
              <ul className="mt-2 text-sm text-slate-400">
                {o.items.map((it) => (
                  <li key={it.productoId}>
                    {it.cantidad}x {it.nombre}
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-bold text-amber-300">{fmt(o.total)}</p>
              <p className="text-xs text-slate-500">ETA ~{o.tiempoEstimado} min</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'crm' && (
        <>
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/30 p-4 text-sm text-slate-300">
            Agentia detecta automáticamente clientes que llevan más de X días sin pedir y genera recordatorios
            personalizados por WhatsApp.
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['todos', 'Todos'],
                ['gt30', 'Sin pedir >30 días 🔴'],
                ['15_29', 'Sin pedir 15-29 días 🟡'],
                ['activos', 'Activos 🟢'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFiltro(k)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  filtro === k ? 'bg-red-600 border-red-500 text-white' : 'border-white/15 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Tel</th>
                  <th className="px-3 py-3">Último pedido</th>
                  <th className="px-3 py-3">Días sin pedir</th>
                  <th className="px-3 py-3">Favorito</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => (
                  <tr key={c.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-white font-medium">{c.nombre}</td>
                    <td className="px-3 py-2 text-slate-400">{c.telefono}</td>
                    <td className="px-3 py-2 text-slate-500">{c.ultimaVisita}</td>
                    <td className="px-3 py-2">{badgeDias(c.diasSinPedir)}</td>
                    <td className="px-3 py-2 text-slate-400">{c.favorito}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setModal(c)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Generar recordatorio
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 space-y-3">
            <h3 className="font-semibold text-white">Campaña masiva</h3>
            <p className="text-sm text-slate-400">
              Enviar recordatorio a todos los clientes inactivos (+30 días) —{' '}
              <strong className="text-amber-300">{inactivos30.length} clientes seleccionados</strong>
            </p>
            <textarea
              value={campañaTexto}
              onChange={(e) => setCampañaTexto(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => {
                const msgs = inactivos30.map(
                  (c) => campañaTexto.replace('{nombre}', c.nombre).replace('{favorito}', c.favorito)
                );
                setCampañaMsgs(msgs);
              }}
              className="px-4 py-2 rounded-lg bg-red-600 text-sm font-semibold"
            >
              Generar mensajes para todos
            </button>
            {campañaMsgs && (
              <ul className="text-xs text-slate-400 space-y-2 max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2">
                {campañaMsgs.map((m, i) => (
                  <li key={i}>{m.slice(0, 120)}…</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500">
              En producción esto se automatiza vía API de WhatsApp Business.
            </p>
          </div>
        </>
      )}

      <AnimatePresence>
        {modal && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setModal(null)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-2rem,480px)] rounded-xl border border-white/10 bg-[#0f172a] p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <p className="font-semibold text-white mb-2">Mensaje para {modal.nombre}</p>
              <textarea
                readOnly
                className="w-full min-h-[160px] bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-slate-200"
                value={mensajeRecordatorio(modal)}
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(mensajeRecordatorio(modal));
                    setToast('Copiado al portapapeles');
                    setTimeout(() => setToast(null), 2000);
                  }}
                  className="flex-1 py-2 rounded-lg bg-slate-700 text-sm"
                >
                  📋 Copiar
                </button>
                <a
                  href={waLink(modal, mensajeRecordatorio(modal))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-center text-sm font-medium"
                >
                  💬 WhatsApp
                </a>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="mt-3 w-full py-2 text-sm text-slate-500"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
