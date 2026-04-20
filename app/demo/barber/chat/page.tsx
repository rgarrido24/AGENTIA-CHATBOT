'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useBarber } from '../barber-context';
import { GIRO_CONFIGS } from '../giro-config';
import LoyaltyCard from '../LoyaltyCard';
import type { LoyaltyCardData } from '../LoyaltyCard';

type ChatMsg = {
  role: 'user' | 'assistant';
  content: string;
  loyaltyCard?: LoyaltyCardData;
};
type Mode = 'staff' | 'cliente';

// Demo loyalty data (same as main page)
const DEMO_LOYALTY: Record<string, { visitas: number; clienteId: string }> = {
  barberia: { visitas: 3, clienteId: 'C-0042' },
  nail: { visitas: 2, clienteId: 'N-0018' },
};

function ChatInner() {
  const { giro } = useBarber();
  const giroCfg = giro ? GIRO_CONFIGS[giro] : null;
  const isNail = giro === 'nail';

  const ACCENT = giroCfg?.acento ?? '#0d9488';
  const PINK = isNail ? '#ec4899' : '#f472b6';

  const CHIPS_STAFF = giroCfg?.chipsStaff ?? [
    '¿Quién tiene cita hoy?',
    'Generar recordatorio para mañana',
    '¿Cuánto llevamos de ingresos hoy?',
    'Cliente sin visitar hace más de 30 días',
  ];

  const CHIPS_CLIENTE = giroCfg
    ? [
        `⭐ Mis puntos de lealtad`,
        ...giroCfg.chipsCliente.slice(0, 3),
      ]
    : [
        '⭐ Mis puntos de lealtad',
        'Quiero un fade para el sábado',
        '¿Cuánto cuesta corte + barba?',
        '¿Abren los domingos?',
      ];

  const [mode, setMode] = useState<Mode>('staff');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (text: string, history: ChatMsg[]) => {
      if (!text.trim()) return;

      // Local intercept: loyalty card
      if (/mis\s*puntos?|mi\s*tarjeta|lealtad|puntos/i.test(text) && giroCfg) {
        const demo = DEMO_LOYALTY[giro ?? 'barberia'] ?? { visitas: 3, clienteId: 'C-0042' };
        const cardData: LoyaltyCardData = {
          clienteNombre: giroCfg.clienteRegreso.nombre,
          clienteId: demo.clienteId,
          negocio: giroCfg.nombre,
          giro: giroCfg.id,
          visitas: demo.visitas,
          meta: giroCfg.metaVisitas,
          ultimoServicio: giroCfg.clienteRegreso.ultimoServicio,
          recompensaNombre: giroCfg.recompensaNombre,
        };
        setMessages((m) => [
          ...m,
          { role: 'user', content: text.trim() },
          { role: 'assistant', content: '', loyaltyCard: cardData },
        ]);
        return;
      }

      setLoading(true);
      setMessages((m) => [
        ...m,
        { role: 'user', content: text.trim() },
        { role: 'assistant', content: '' },
      ]);
      try {
        const res = await fetch('/api/demo/barber/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            messages: history.map((x) => ({ role: x.role, content: x.content })),
            mode,
            giro: giro ?? 'barberia',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const em = typeof err?.error === 'string' ? err.error : `Error ${res.status}`;
          setMessages((m) => {
            const c = [...m];
            const last = c[c.length - 1];
            if (last?.role === 'assistant') last.content = em;
            return c;
          });
          return;
        }
        const reader = res.body?.getReader();
        const dec = new TextDecoder();
        let acc = '';
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += dec.decode(value, { stream: true });
            setMessages((m) => {
              const c = [...m];
              const last = c[c.length - 1];
              if (last?.role === 'assistant') last.content = acc;
              return [...c];
            });
          }
        }
      } catch {
        setMessages((m) => {
          const c = [...m];
          const last = c[c.length - 1];
          if (last?.role === 'assistant') last.content = 'No pudimos conectar. Intenta de nuevo.';
          return c;
        });
      } finally {
        setLoading(false);
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [mode, giro, giroCfg]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const history = messages.filter(
      (m) => m.role === 'user' || (m.role === 'assistant' && m.content.trim())
    );
    await sendMessage(text, history);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isCliente = mode === 'cliente';

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[420px]">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          type="button"
          onClick={() => { setMode('staff'); setMessages([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            mode === 'staff' ? 'text-white' : 'bg-white/10 text-slate-400'
          }`}
          style={mode === 'staff' ? { background: ACCENT } : undefined}
        >
          👨 Staff
        </button>
        <button
          type="button"
          onClick={() => { setMode('cliente'); setMessages([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            mode === 'cliente' ? 'text-white' : 'bg-white/10 text-slate-400'
          }`}
          style={mode === 'cliente' ? { background: PINK } : undefined}
        >
          {isNail ? '💅' : '✂️'} Cliente
        </button>
        {giroCfg && (
          <span className="ml-auto text-xs px-2 py-1 rounded-full" style={{ background: `${ACCENT}22`, color: ACCENT }}>
            {giroCfg.emoji} {giroCfg.nombre}
          </span>
        )}
      </div>

      {isCliente && (
        <div
          className="mb-3 rounded-lg border p-3 text-xs"
          style={{ borderColor: `${PINK}55`, background: isNail ? 'rgba(236,72,153,0.08)' : 'rgba(244,114,182,0.12)', color: isNail ? '#f9a8d4' : '#fce7f3' }}
        >
          En producción este chat puede vivir en WhatsApp o la web del negocio; aquí simulas la experiencia del cliente.
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto rounded-xl border p-4 space-y-3 ${
          isCliente ? 'bg-[#0b141a] border-white/10' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(mode === 'staff' ? CHIPS_STAFF : CHIPS_CLIENTE).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="text-xs px-3 py-1.5 rounded-full border"
                style={
                  isCliente
                    ? { borderColor: `${PINK}88`, color: PINK }
                    : { borderColor: `${ACCENT}66`, color: ACCENT }
                }
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          // Loyalty card: render as a standalone card, not inside a bubble
          if (m.loyaltyCard && m.role === 'assistant') {
            return (
              <div key={`loyalty-${i}`} className="flex justify-start">
                <div className="w-full max-w-xs">
                  <LoyaltyCard data={m.loyaltyCard} compact={false} />
                </div>
              </div>
            );
          }

          return (
            <div key={`${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? isCliente
                      ? 'text-white rounded-tr-sm'
                      : 'text-white'
                    : isCliente
                      ? 'bg-[#202c33] text-slate-100 border border-white/5 rounded-tl-sm'
                      : 'bg-slate-800/90 text-slate-100 border border-white/10'
                }`}
                style={m.role === 'user' ? { background: isCliente ? PINK : ACCENT } : undefined}
              >
                {m.content ||
                  (loading && i === messages.length - 1 && m.role === 'assistant' && !m.content ? (
                    <span className="text-slate-400 italic">Escribiendo…</span>
                  ) : null)}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
          placeholder="Escribe un mensaje…"
          className={`flex-1 rounded-xl px-4 py-3 text-sm border ${
            isCliente
              ? 'bg-[#2a3942] border-white/10 text-white placeholder-slate-500'
              : 'bg-slate-900 border-white/10 text-white'
          }`}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSend()}
          className="px-4 rounded-xl flex items-center gap-2 font-semibold text-white disabled:opacity-50"
          style={{ background: isCliente ? PINK : ACCENT }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function BarberChatPage() {
  const { giro } = useBarber();
  const giroCfg = giro ? GIRO_CONFIGS[giro] : null;
  const ACCENT = giroCfg?.acento ?? '#0d9488';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400 text-sm max-w-3xl mx-auto">
        <MessageCircle className="w-5 h-5" style={{ color: ACCENT }} />
        <span>Chat IA — {giroCfg?.nombre ?? 'Barbería'} (demo)</span>
      </div>
      <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
        <ChatInner />
      </Suspense>
    </div>
  );
}
