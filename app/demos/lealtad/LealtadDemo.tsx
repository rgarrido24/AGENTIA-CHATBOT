'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cormorant_Garamond, Lato } from 'next/font/google';
import { motion } from 'framer-motion';
import {
  COLORS,
  DEMO_CUSTOMERS,
  DEMO_STORAGE_KEY,
  REDEMPTION_OPTIONS,
  computeStats,
  formatWhatsAppEarned,
  handleWhatsAppCommand,
  progressToNextReward,
  puntosPorMonto,
  type LoyaltyCustomer,
  type RedemptionId,
} from '@/lib/loyalty-restaurant';

const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'] });
const body = Lato({ subsets: ['latin'], weight: ['400', '700'] });

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

type View = 'cliente' | 'panel' | 'whatsapp';
type ChatMsg = { role: 'user' | 'bot'; text: string };

function loadCustomers(): LoyaltyCustomer[] {
  if (typeof window === 'undefined') return DEMO_CUSTOMERS;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoyaltyCustomer[]) : DEMO_CUSTOMERS;
  } catch {
    return DEMO_CUSTOMERS;
  }
}

function LoyaltyCard({ customer }: { customer: LoyaltyCustomer }) {
  const { target, percent, remaining } = progressToNextReward(customer.puntos);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 shadow-xl"
      style={{
        background: `linear-gradient(145deg, ${COLORS.dark} 0%, #3d2418 100%)`,
        border: `1px solid ${COLORS.gold}55`,
      }}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20" style={{ background: COLORS.gold }} />
      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-10" style={{ background: COLORS.gold }} />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`${body.className} text-[10px] font-bold uppercase tracking-[0.3em] text-white/50`}>
              Tarjeta de lealtad
            </p>
            <h2 className={`${display.className} mt-1 text-2xl font-bold text-white`}>MASA MADRE</h2>
          </div>
          <span className="text-3xl" aria-hidden>🥐</span>
        </div>

        <div className="mt-6">
          <p className={`${body.className} text-sm text-white/60`}>{customer.nombre}</p>
          <p className={`${display.className} mt-1 text-5xl font-bold`} style={{ color: COLORS.gold }}>
            {customer.puntos}
            <span className="ml-2 text-lg font-medium text-white/70">pts</span>
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-white/60">
            <span>Próximo: {target.emoji} {target.label}</span>
            <span>{remaining} pts</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${COLORS.gold}, #e8c96a)` }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <p className={`${body.className} mt-4 text-center text-[11px] text-white/40`}>
          Cada $10 MXN = 1 punto · Canje en mostrador
        </p>
      </div>
    </motion.div>
  );
}

function VisitHistory({ visitas }: { visitas: LoyaltyCustomer['visitas'] }) {
  if (visitas.length === 0) {
    return <p className={`${body.className} text-sm text-[#7a6558]`}>Sin visitas registradas.</p>;
  }
  return (
    <ul className="space-y-3">
      {visitas.slice(0, 6).map((v, i) => (
        <li
          key={`${v.fecha}-${i}`}
          className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
          style={{ borderColor: `${COLORS.gold}33`, background: 'white' }}
        >
          <div>
            <p className={`${body.className} text-sm font-bold`} style={{ color: COLORS.dark }}>
              {v.tipo === 'canje' ? `Canje: ${v.nota ?? 'premio'}` : `Consumo ${fmt(v.monto)}`}
            </p>
            <p className="text-xs text-[#8a7568]">{fmtDate(v.fecha)}</p>
          </div>
          <span
            className={`${body.className} shrink-0 text-sm font-bold`}
            style={{ color: v.tipo === 'canje' ? '#c0392b' : COLORS.gold }}
          >
            {v.tipo === 'canje' ? `−${v.puntos}` : `+${v.puntos}`} pts
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function LealtadDemo() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>(DEMO_CUSTOMERS);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>('cliente');
  const [selectedId, setSelectedId] = useState(DEMO_CUSTOMERS[0]!.id);
  const [consumoMonto, setConsumoMonto] = useState('');
  const [consumoCustomerId, setConsumoCustomerId] = useState(DEMO_CUSTOMERS[0]!.id);
  const [canjeCustomerId, setCanjeCustomerId] = useState(DEMO_CUSTOMERS[0]!.id);
  const [canjeId, setCanjeId] = useState<RedemptionId>('descuento-50');
  const [toast, setToast] = useState<string | null>(null);
  const [chatPhone, setChatPhone] = useState('9991234567');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: '¡Hola! Soy el bot de lealtad de Masa Madre 🥐\nEscribe PUNTOS, CANJEAR o HISTORIAL.' },
  ]);
  const [modal, setModal] = useState<'consumo' | 'canje' | null>(null);

  useEffect(() => {
    setCustomers(loadCustomers());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(customers));
  }, [customers, hydrated]);

  const selected = customers.find((c) => c.id === selectedId) ?? customers[0]!;
  const stats = useMemo(() => computeStats(customers), [customers]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const updateCustomer = useCallback((updated: LoyaltyCustomer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedId(updated.id);
  }, []);

  const registerConsumo = () => {
    const monto = Number(consumoMonto);
    if (!Number.isFinite(monto) || monto <= 0) {
      showToast('Ingresa un monto válido');
      return;
    }
    const customer = customers.find((c) => c.id === consumoCustomerId);
    if (!customer) return;

    const earned = puntosPorMonto(monto);
    const now = new Date().toISOString();
    const updated: LoyaltyCustomer = {
      ...customer,
      puntos: customer.puntos + earned,
      ultimo_consumo: now,
      visitas: [{ fecha: now, monto, puntos: earned, tipo: 'consumo' }, ...customer.visitas],
    };
    updateCustomer(updated);
    setConsumoMonto('');
    setModal(null);
    showToast(formatWhatsAppEarned(customer.nombre, earned, updated.puntos));
  };

  const redeemCanje = () => {
    const customer = customers.find((c) => c.id === canjeCustomerId);
    if (!customer) return;
    const option = REDEMPTION_OPTIONS.find((r) => r.id === canjeId)!;
    if (customer.puntos < option.puntos) {
      showToast(`Saldo insuficiente (${customer.puntos}/${option.puntos} pts)`);
      return;
    }
    const now = new Date().toISOString();
    const updated: LoyaltyCustomer = {
      ...customer,
      puntos: customer.puntos - option.puntos,
      visitas: [
        { fecha: now, monto: 0, puntos: option.puntos, tipo: 'canje', nota: option.label },
        ...customer.visitas,
      ],
    };
    updateCustomer(updated);
    setModal(null);
    showToast(`Canje registrado: ${option.label}`);
  };

  const sendWhatsApp = () => {
    const text = chatInput.trim();
    if (!text) return;
    const customer = customers.find((c) => c.telefono === chatPhone);
    const result = handleWhatsAppCommand(text, customer, chatPhone);

    let nextCustomers = customers;
    if (result.customer && result.isNew) {
      nextCustomers = [...customers, result.customer];
      setCustomers(nextCustomers);
    }

    setChatMessages((m) => [
      ...m,
      { role: 'user', text },
      { role: 'bot', text: result.reply },
    ]);
    setChatInput('');
  };

  return (
    <div className={`${display.className} min-h-screen`} style={{ background: COLORS.cream, color: COLORS.dark }}>
      <header className="border-b px-4 py-5 sm:px-6" style={{ borderColor: `${COLORS.gold}44` }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className={`${body.className} text-xs font-bold uppercase tracking-[0.2em] text-[#8a7568]`}>
              Programa de lealtad
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">MASA MADRE</h1>
          </div>
          <a
            href="/demos/masa-madre"
            className={`${body.className} rounded-full border px-4 py-2 text-sm font-bold transition hover:bg-white`}
            style={{ borderColor: COLORS.gold, color: COLORS.dark }}
          >
            Ver menú →
          </a>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b backdrop-blur-md" style={{ background: `${COLORS.cream}ee`, borderColor: `${COLORS.gold}33` }}>
        <div className={`${body.className} mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3`}>
          {([
            ['cliente', 'Tarjeta cliente'],
            ['panel', 'Panel restaurante'],
            ['whatsapp', 'Simulador WhatsApp'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition"
              style={{
                background: view === id ? COLORS.dark : 'transparent',
                color: view === id ? COLORS.cream : COLORS.dark,
                border: view === id ? 'none' : `1px solid ${COLORS.gold}55`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {view === 'cliente' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <LoyaltyCard customer={selected} />
              <div>
                <h3 className={`${body.className} mb-3 text-sm font-bold uppercase tracking-wider text-[#8a7568]`}>
                  Seleccionar cliente demo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`${body.className} rounded-full px-3 py-1.5 text-xs font-bold transition`}
                      style={{
                        background: selectedId === c.id ? COLORS.gold : 'white',
                        color: selectedId === c.id ? COLORS.dark : '#5c4a3d',
                        border: `1px solid ${COLORS.gold}44`,
                      }}
                    >
                      {c.nombre.split(' ')[0]} · {c.puntos} pts
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: `${COLORS.gold}33`, background: 'white' }}>
                <h3 className={`${body.className} mb-3 font-bold`}>Premios disponibles</h3>
                <ul className="space-y-2 text-sm">
                  {REDEMPTION_OPTIONS.map((r) => (
                    <li key={r.id} className="flex justify-between">
                      <span>{r.emoji} {r.label}</span>
                      <span className="font-bold" style={{ color: COLORS.gold }}>{r.puntos} pts</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h3 className={`${display.className} mb-4 text-2xl font-semibold`}>Historial de visitas</h3>
              <VisitHistory visitas={selected.visitas} />
            </div>
          </div>
        )}

        {view === 'panel' && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Clientes activos', value: stats.clientesActivos, sub: 'últimos 30 días' },
                { label: 'Puntos emitidos', value: stats.puntosEmitidos, sub: 'este mes' },
                { label: 'Canjes del mes', value: stats.canjesMes, sub: 'premios canjeados' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border p-5"
                  style={{ borderColor: `${COLORS.gold}33`, background: 'white' }}
                >
                  <p className={`${body.className} text-xs font-bold uppercase tracking-wider text-[#8a7568]`}>{s.label}</p>
                  <p className={`${display.className} mt-2 text-4xl font-bold`} style={{ color: COLORS.gold }}>{s.value}</p>
                  <p className="text-xs text-[#8a7568]">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModal('consumo')}
                className={`${body.className} rounded-full px-5 py-2.5 text-sm font-bold text-white`}
                style={{ background: COLORS.dark }}
              >
                + Registrar consumo
              </button>
              <button
                type="button"
                onClick={() => setModal('canje')}
                className={`${body.className} rounded-full border px-5 py-2.5 text-sm font-bold`}
                style={{ borderColor: COLORS.gold, color: COLORS.dark }}
              >
                Canjear puntos
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border" style={{ borderColor: `${COLORS.gold}33` }}>
              <table className={`${body.className} w-full text-sm`}>
                <thead style={{ background: COLORS.dark, color: COLORS.cream }}>
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Cliente</th>
                    <th className="px-4 py-3 text-left font-bold">Teléfono</th>
                    <th className="px-4 py-3 text-right font-bold">Puntos</th>
                    <th className="px-4 py-3 text-right font-bold">Visitas</th>
                    <th className="px-4 py-3 text-right font-bold">Último consumo</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer border-t transition hover:bg-white/80"
                      style={{ borderColor: `${COLORS.gold}22`, background: i % 2 ? 'white' : COLORS.cream }}
                      onClick={() => { setSelectedId(c.id); setView('cliente'); }}
                    >
                      <td className="px-4 py-3 font-bold">{c.nombre}</td>
                      <td className="px-4 py-3 text-[#7a6558]">{c.telefono}</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: COLORS.gold }}>{c.puntos}</td>
                      <td className="px-4 py-3 text-right">{c.visitas.filter((v) => v.tipo === 'consumo').length}</td>
                      <td className="px-4 py-3 text-right text-[#7a6558]">
                        {c.ultimo_consumo ? fmtDate(c.ultimo_consumo) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'whatsapp' && (
          <div className="mx-auto max-w-md">
            <div className="mb-4">
              <label className={`${body.className} mb-1 block text-xs font-bold text-[#8a7568]`}>
                Teléfono del cliente demo
              </label>
              <select
                value={chatPhone}
                onChange={(e) => setChatPhone(e.target.value)}
                className={`${body.className} w-full rounded-xl border px-4 py-2.5 text-sm`}
                style={{ borderColor: `${COLORS.gold}55` }}
              >
                {customers.map((c) => (
                  <option key={c.telefono} value={c.telefono}>{c.nombre} — {c.telefono}</option>
                ))}
                <option value="9999999999">Número nuevo (registro)</option>
              </select>
            </div>

            <div
              className="flex h-[420px] flex-col overflow-hidden rounded-3xl shadow-xl"
              style={{ background: '#e5ddd5' }}
            >
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: COLORS.dark }}>
                <span className="text-xl">🥐</span>
                <div>
                  <p className={`${body.className} text-sm font-bold text-white`}>Masa Madre</p>
                  <p className="text-[10px] text-white/50">Bot de lealtad · en línea</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`${body.className} max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm`}
                      style={{
                        background: m.role === 'user' ? '#dcf8c6' : 'white',
                        borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t bg-white p-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendWhatsApp()}
                  placeholder="Escribe PUNTOS, CANJEAR..."
                  className={`${body.className} flex-1 rounded-full border px-4 py-2 text-sm outline-none`}
                  style={{ borderColor: `${COLORS.gold}44` }}
                />
                <button
                  type="button"
                  onClick={sendWhatsApp}
                  className="rounded-full px-4 py-2 text-sm font-bold text-white"
                  style={{ background: '#25D366' }}
                >
                  →
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['PUNTOS', 'CANJEAR', 'HISTORIAL'].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => { setChatInput(cmd); }}
                  className={`${body.className} rounded-full border px-3 py-1 text-xs font-bold`}
                  style={{ borderColor: COLORS.gold }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModal(null)}>
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
            style={{ background: COLORS.cream }}
            onClick={(e) => e.stopPropagation()}
          >
            {modal === 'consumo' ? (
              <>
                <h3 className={`${display.className} text-2xl font-semibold`}>Registrar consumo</h3>
                <p className={`${body.className} mt-1 text-sm text-[#7a6558]`}>Cada $10 MXN = 1 punto automático</p>
                <div className="mt-4 space-y-3">
                  <select
                    value={consumoCustomerId}
                    onChange={(e) => setConsumoCustomerId(e.target.value)}
                    className={`${body.className} w-full rounded-xl border px-4 py-2.5 text-sm`}
                    style={{ borderColor: `${COLORS.gold}55` }}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={consumoMonto}
                    onChange={(e) => setConsumoMonto(e.target.value)}
                    placeholder="Monto en MXN"
                    className={`${body.className} w-full rounded-xl border px-4 py-2.5 text-sm`}
                    style={{ borderColor: `${COLORS.gold}55` }}
                  />
                  {consumoMonto && Number(consumoMonto) > 0 && (
                    <p className="text-sm" style={{ color: COLORS.gold }}>
                      +{puntosPorMonto(Number(consumoMonto))} puntos
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={registerConsumo}
                  className={`${body.className} mt-5 w-full rounded-full py-3 text-sm font-bold text-white`}
                  style={{ background: COLORS.dark }}
                >
                  Confirmar y notificar WhatsApp
                </button>
              </>
            ) : (
              <>
                <h3 className={`${display.className} text-2xl font-semibold`}>Canjear puntos</h3>
                <div className="mt-4 space-y-3">
                  <select
                    value={canjeCustomerId}
                    onChange={(e) => setCanjeCustomerId(e.target.value)}
                    className={`${body.className} w-full rounded-xl border px-4 py-2.5 text-sm`}
                    style={{ borderColor: `${COLORS.gold}55` }}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.puntos} pts</option>
                    ))}
                  </select>
                  <select
                    value={canjeId}
                    onChange={(e) => setCanjeId(e.target.value as RedemptionId)}
                    className={`${body.className} w-full rounded-xl border px-4 py-2.5 text-sm`}
                    style={{ borderColor: `${COLORS.gold}55` }}
                  >
                    {REDEMPTION_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.emoji} {r.label} — {r.puntos} pts</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={redeemCanje}
                  className={`${body.className} mt-5 w-full rounded-full py-3 text-sm font-bold text-white`}
                  style={{ background: COLORS.gold, color: COLORS.dark }}
                >
                  Confirmar canje
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`${body.className} fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 whitespace-pre-wrap rounded-2xl px-5 py-3 text-center text-sm font-bold text-white shadow-xl`}
          style={{ background: COLORS.dark }}
        >
          {toast}
        </div>
      )}

      <footer className={`${body.className} border-t px-4 py-6 text-center text-xs text-[#8a7568]`} style={{ borderColor: `${COLORS.gold}33` }}>
        Demo por{' '}
        <a href="https://agentia.software" className="font-bold hover:underline" style={{ color: COLORS.gold }}>
          Agentia
        </a>
        {' · '}
        Colección MongoDB: <code>loyalty_customers</code>
      </footer>
    </div>
  );
}
