'use client';

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { Playfair_Display, Inter } from 'next/font/google';
import { motion } from 'framer-motion';
import { ScrollReveal, StaggerItem, StaggerReveal } from '@/components/landing/ScrollReveal';
import { LoyaltyCard3D } from './LoyaltyCard3D';
import { fireConfetti, playPointSound, PointFloaters, type PointFloater } from './lealtad-effects';
import {
  COLORS,
  DEMO_CUSTOMERS,
  DEMO_STORAGE_KEY,
  REDEMPTION_OPTIONS,
  computeStats,
  formatWhatsAppEarned,
  handleWhatsAppCommand,
  puntosPorMonto,
  type LoyaltyCustomer,
  type RedemptionId,
} from '@/lib/loyalty-restaurant';
import { useAnalytics } from '@/src/lib/analytics-client';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

const HEADER_IMG =
  'https://images.unsplash.com/photo-1608198093002-47d5578147d1?w=1600&q=80';

const BTN =
  'transition-[transform,box-shadow,background-color,border-color] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 active:scale-[0.97]';

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

function VisitHistory({ visitas }: { visitas: LoyaltyCustomer['visitas'] }) {
  if (visitas.length === 0) {
    return <p className={`${inter.className} text-sm text-white/45`}>Sin visitas registradas.</p>;
  }
  return (
    <ul className="space-y-3">
      {visitas.slice(0, 6).map((v, i) => (
        <motion.li
          key={`${v.fecha}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
        >
          <div>
            <p className={`${inter.className} text-sm font-semibold text-[#FAF7F2]`}>
              {v.tipo === 'canje' ? `Canje: ${v.nota ?? 'premio'}` : `Consumo ${fmt(v.monto)}`}
            </p>
            <p className="text-xs text-white/40">{fmtDate(v.fecha)}</p>
          </div>
          <span
            className={`${inter.className} shrink-0 text-sm font-bold`}
            style={{ color: v.tipo === 'canje' ? '#e57373' : COLORS.gold }}
          >
            {v.tipo === 'canje' ? `−${v.puntos}` : `+${v.puntos}`} pts
          </span>
        </motion.li>
      ))}
    </ul>
  );
}

function RewardCard({ emoji, label, pts }: { emoji: string; label: string; pts: number }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
    >
      <span className="text-2xl">{emoji}</span>
      <p className={`${inter.className} mt-2 text-sm font-medium text-[#FAF7F2]`}>{label}</p>
      <p className={`${playfair.className} mt-1 text-xl font-semibold`} style={{ color: COLORS.gold }}>
        {pts} pts
      </p>
    </motion.div>
  );
}

export default function LealtadDemo() {
  useAnalytics('lealtad');
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>(DEMO_CUSTOMERS);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>('cliente');
  const [selectedId, setSelectedId] = useState(DEMO_CUSTOMERS[0]!.id);
  const [consumoMonto, setConsumoMonto] = useState('');
  const [consumoCustomerId, setConsumoCustomerId] = useState(DEMO_CUSTOMERS[0]!.id);
  const [canjeCustomerId, setCanjeCustomerId] = useState(DEMO_CUSTOMERS[0]!.id);
  const [canjeId, setCanjeId] = useState<RedemptionId>('descuento-50');
  const [toast, setToast] = useState<string | null>(null);
  const [floaters, setFloaters] = useState<PointFloater[]>([]);
  const [chatPhone, setChatPhone] = useState('9991234567');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: '¡Hola! Soy el bot de lealtad de Masa Madre.\nEscribe PUNTOS, CANJEAR o HISTORIAL.' },
  ]);
  const [modal, setModal] = useState<'consumo' | 'canje' | null>(null);
  const [logoOk, setLogoOk] = useState(true);

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

  const addFloater = (amount: number) => {
    const id = Date.now() + Math.random();
    const x = 35 + Math.random() * 30;
    setFloaters((f) => [...f, { id, amount, x }]);
    setTimeout(() => setFloaters((f) => f.filter((item) => item.id !== id)), 900);
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
    addFloater(earned);
    playPointSound();
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
    fireConfetti();
    showToast(`Canje registrado: ${option.label}`);
  };

  const sendWhatsApp = () => {
    const text = chatInput.trim();
    if (!text) return;
    const customer = customers.find((c) => c.telefono === chatPhone);
    const result = handleWhatsAppCommand(text, customer, chatPhone);

    if (result.customer && result.isNew) {
      setCustomers((prev) => [...prev, result.customer!]);
    }

    setChatMessages((m) => [...m, { role: 'user', text }, { role: 'bot', text: result.reply }]);
    setChatInput('');
  };

  return (
    <div
      className={`${playfair.variable} ${inter.variable} loyalty-noise-bg min-h-screen text-[#FAF7F2]`}
      style={{ color: COLORS.cream }}
    >
      <PointFloaters items={floaters} />

      <header className="relative overflow-hidden border-b border-white/10">
        <div className="relative h-44 sm:h-52">
          <Image src={HEADER_IMG} alt="" fill unoptimized className="object-cover opacity-50" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-4xl items-end justify-between gap-4 px-4 py-6 sm:px-6">
            <div>
              <p className={`${inter.className} text-[10px] font-bold uppercase tracking-[0.3em] text-white/45`}>
                Programa de lealtad
              </p>
              {logoOk ? (
                <Image
                  src="/logos/masa-madre-logo.jpg"
                  alt="Masa Madre"
                  width={200}
                  height={56}
                  className="mt-2 h-12 w-auto object-contain brightness-110"
                  onError={() => setLogoOk(false)}
                  priority
                />
              ) : (
                <h1 className={`${playfair.className} mt-2 text-4xl font-light tracking-[0.15em]`}>MASA MADRE</h1>
              )}
            </div>
            <a
              href="/demos/masa-madre"
              className={`${inter.className} ${BTN} rounded-full border border-[#C9A84C]/50 px-4 py-2 text-sm font-semibold text-[#FAF7F2] hover:border-[#C9A84C] hover:shadow-[0_0_24px_rgba(201,168,76,0.2)]`}
            >
              Ver menú →
            </a>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b border-white/10 bg-[#0A0A0A]/85 backdrop-blur-xl">
        <div className={`${inter.className} mx-auto flex max-w-4xl gap-2 overflow-x-auto px-4 py-3`}>
          {([
            ['cliente', 'Tarjeta cliente'],
            ['panel', 'Panel restaurante'],
            ['whatsapp', 'Simulador WhatsApp'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`${BTN} shrink-0 rounded-full px-4 py-2 text-sm font-semibold`}
              style={{
                background: view === id ? COLORS.gold : 'transparent',
                color: view === id ? COLORS.black : COLORS.cream,
                border: view === id ? 'none' : '1px solid rgba(201,168,76,0.35)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {view === 'cliente' && (
          <div className="grid gap-10 lg:grid-cols-2">
            <ScrollReveal className="space-y-8">
              <LoyaltyCard3D customer={selected} />
              <div>
                <h3 className={`${inter.className} mb-3 text-xs font-bold uppercase tracking-wider text-white/40`}>
                  Cliente demo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`${inter.className} ${BTN} rounded-full px-3 py-1.5 text-xs font-semibold`}
                      style={{
                        background: selectedId === c.id ? COLORS.gold : 'rgba(255,255,255,0.06)',
                        color: selectedId === c.id ? COLORS.black : COLORS.cream,
                        border: `1px solid ${selectedId === c.id ? COLORS.gold : 'rgba(255,255,255,0.12)'}`,
                      }}
                    >
                      {c.nombre.split(' ')[0]} · {c.puntos} pts
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className={`${playfair.className} mb-4 text-xl font-semibold`}>Premios disponibles</h3>
                <StaggerReveal className="grid gap-3 sm:grid-cols-3">
                  {REDEMPTION_OPTIONS.map((r) => (
                    <StaggerItem key={r.id}>
                      <RewardCard emoji={r.emoji} label={r.label} pts={r.puntos} />
                    </StaggerItem>
                  ))}
                </StaggerReveal>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <h3 className={`${playfair.className} mb-4 text-2xl font-semibold`}>Historial de visitas</h3>
              <VisitHistory visitas={selected.visitas} />
            </ScrollReveal>
          </div>
        )}

        {view === 'panel' && (
          <ScrollReveal className="space-y-8">
            <StaggerReveal className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Clientes activos', value: stats.clientesActivos, sub: 'últimos 30 días' },
                { label: 'Puntos emitidos', value: stats.puntosEmitidos, sub: 'este mes' },
                { label: 'Canjes del mes', value: stats.canjesMes, sub: 'premios canjeados' },
              ].map((s) => (
                <StaggerItem key={s.label}>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                    <p className={`${inter.className} text-xs font-bold uppercase tracking-wider text-white/40`}>{s.label}</p>
                    <p className={`${playfair.className} mt-2 text-4xl font-semibold`} style={{ color: COLORS.gold }}>{s.value}</p>
                    <p className="text-xs text-white/35">{s.sub}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerReveal>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModal('consumo')}
                className={`${inter.className} ${BTN} rounded-full px-5 py-2.5 text-sm font-bold text-[#FAF7F2]`}
                style={{ background: COLORS.gold, color: COLORS.black }}
              >
                + Registrar consumo
              </button>
              <button
                type="button"
                onClick={() => setModal('canje')}
                className={`${inter.className} ${BTN} rounded-full border border-[#C9A84C]/50 px-5 py-2.5 text-sm font-bold text-[#FAF7F2]`}
              >
                Canjear puntos
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className={`${inter.className} w-full text-sm`}>
                <thead className="bg-[#2C1810] text-[#FAF7F2]">
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
                      className={`${BTN} cursor-pointer border-t border-white/5`}
                      style={{ background: i % 2 ? 'rgba(255,255,255,0.03)' : 'transparent' }}
                      onClick={() => { setSelectedId(c.id); setView('cliente'); }}
                    >
                      <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                      <td className="px-4 py-3 text-white/45">{c.telefono}</td>
                      <td className="px-4 py-3 text-right font-bold" style={{ color: COLORS.gold }}>{c.puntos}</td>
                      <td className="px-4 py-3 text-right">{c.visitas.filter((v) => v.tipo === 'consumo').length}</td>
                      <td className="px-4 py-3 text-right text-white/45">
                        {c.ultimo_consumo ? fmtDate(c.ultimo_consumo) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}

        {view === 'whatsapp' && (
          <ScrollReveal className="mx-auto max-w-md">
            <label className={`${inter.className} mb-1 block text-xs font-bold text-white/40`}>
              Teléfono del cliente demo
            </label>
            <select
              value={chatPhone}
              onChange={(e) => setChatPhone(e.target.value)}
              className={`${inter.className} mb-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-[#FAF7F2]`}
            >
              {customers.map((c) => (
                <option key={c.telefono} value={c.telefono}>{c.nombre} — {c.telefono}</option>
              ))}
              <option value="9999999999">Número nuevo (registro)</option>
            </select>

            <div className="flex h-[420px] flex-col overflow-hidden rounded-3xl shadow-2xl">
              <div className="flex items-center gap-3 border-b border-white/10 bg-[#2C1810] px-4 py-3">
                {logoOk ? (
                  <Image src="/logos/masa-madre-logo.jpg" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" onError={() => setLogoOk(false)} />
                ) : (
                  <span className={`${playfair.className} text-sm font-semibold text-[#C9A84C]`}>MM</span>
                )}
                <div>
                  <p className={`${inter.className} text-sm font-bold`}>Masa Madre</p>
                  <p className="text-[10px] text-white/40">Bot de lealtad · en línea</p>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#111] p-4">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`${inter.className} max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm`}
                      style={{
                        background: m.role === 'user' ? '#1a3d2e' : 'rgba(255,255,255,0.08)',
                        color: '#FAF7F2',
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 bg-[#0A0A0A] p-3">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendWhatsApp()}
                  placeholder="PUNTOS, CANJEAR..."
                  className={`${inter.className} flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#FAF7F2] outline-none`}
                />
                <button type="button" onClick={sendWhatsApp} className={`${BTN} rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white`}>
                  →
                </button>
              </div>
            </div>
          </ScrollReveal>
        )}
      </main>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] p-6 shadow-2xl"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {modal === 'consumo' ? (
              <>
                <h3 className={`${playfair.className} text-2xl font-semibold`}>Registrar consumo</h3>
                <p className={`${inter.className} mt-1 text-sm text-white/45`}>Cada $10 MXN = 1 punto</p>
                <div className="mt-4 space-y-3">
                  <select
                    value={consumoCustomerId}
                    onChange={(e) => setConsumoCustomerId(e.target.value)}
                    className={`${inter.className} w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm`}
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
                    className={`${inter.className} w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-[#FAF7F2]`}
                  />
                </div>
                <button
                  type="button"
                  onClick={registerConsumo}
                  className={`${inter.className} ${BTN} mt-5 w-full rounded-full py-3 text-sm font-bold`}
                  style={{ background: COLORS.gold, color: COLORS.black }}
                >
                  Confirmar y notificar WhatsApp
                </button>
              </>
            ) : (
              <>
                <h3 className={`${playfair.className} text-2xl font-semibold`}>Canjear puntos</h3>
                <div className="mt-4 space-y-3">
                  <select
                    value={canjeCustomerId}
                    onChange={(e) => setCanjeCustomerId(e.target.value)}
                    className={`${inter.className} w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm`}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.puntos} pts</option>
                    ))}
                  </select>
                  <select
                    value={canjeId}
                    onChange={(e) => setCanjeId(e.target.value as RedemptionId)}
                    className={`${inter.className} w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm`}
                  >
                    {REDEMPTION_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>{r.emoji} {r.label} — {r.puntos} pts</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={redeemCanje}
                  className={`${inter.className} ${BTN} mt-5 w-full rounded-full py-3 text-sm font-bold`}
                  style={{ background: COLORS.gold, color: COLORS.black }}
                >
                  Confirmar canje
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`${inter.className} fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 whitespace-pre-wrap rounded-2xl border border-[#C9A84C]/30 bg-[#2C1810] px-5 py-3 text-center text-sm font-semibold text-[#FAF7F2] shadow-xl`}
        >
          {toast}
        </motion.div>
      )}

      <footer className={`${inter.className} border-t border-white/10 px-4 py-6 text-center text-xs text-white/35`}>
        Demo por{' '}
        <a href="https://agentia.software" className="font-semibold hover:text-[#C9A84C]" style={{ color: COLORS.gold }}>
          Agentia
        </a>
      </footer>
    </div>
  );
}
