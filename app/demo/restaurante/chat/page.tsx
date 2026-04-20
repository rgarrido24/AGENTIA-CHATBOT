'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import LoyaltyCard from '@/app/demo/barber/LoyaltyCard';
import type { LoyaltyCardData } from '@/app/demo/barber/LoyaltyCard';

type ChatMsg = { role: 'user' | 'assistant'; content: string; loyaltyCard?: LoyaltyCardData };
type Mode = 'staff' | 'cliente';

const DEMO_LOYALTY_REST: LoyaltyCardData = {
  clienteNombre: 'Juan Torres',
  clienteId: 'R-0077',
  negocio: 'La Séptima',
  giro: 'restaurante',
  visitas: 7,
  meta: 10,
  ultimoServicio: 'Costillas BBQ + margarita',
  recompensaNombre: 'platillo de temporada',
};

const CHIPS_STAFF = [
  '¿Cuáles son los productos más vendidos hoy?',
  '¿Qué ingredientes están por agotarse?',
  '¿Cuánto llevamos de ventas?',
  'Dame una promo para los clientes inactivos',
  '¿Cuántas órdenes de delivery hay activas?',
];

const CHIPS_CLIENTE = [
  '⭐ Mis puntos de lealtad',
  '¿Cuál es el menú?',
  '¿Hacen entregas a domicilio?',
  'Quiero hacer un pedido',
  '¿Tienen promociones hoy?',
];

function ChatInner() {
  const [mode, setMode] = useState<Mode>('staff');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (text: string, history: ChatMsg[]) => {
      if (!text.trim()) return;

      // Local intercept: loyalty card
      if (/mis\s*puntos?|mi\s*tarjeta|lealtad|puntos/i.test(text)) {
        setMessages((m) => [
          ...m,
          { role: 'user', content: text.trim() },
          { role: 'assistant', content: '', loyaltyCard: DEMO_LOYALTY_REST },
        ]);
        return;
      }

      setLoading(true);
      setMessages((m) => [...m, { role: 'user', content: text.trim() }, { role: 'assistant', content: '' }]);
      try {
        const res = await fetch('/api/demo/restaurante/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            messages: history.map((x) => ({ role: x.role, content: x.content })),
            mode,
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
    [mode]
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const history = messages.filter(
      (m) => m.role === 'user' || (m.role === 'assistant' && m.content.trim())
    ) as ChatMsg[];
    await sendMessage(text, history);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isWa = mode === 'cliente';

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[420px]">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setMode('staff'); setMessages([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === 'staff' ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-400'}`}
        >
          👨‍💼 Modo Staff
        </button>
        <button
          type="button"
          onClick={() => { setMode('cliente'); setMessages([]); }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${mode === 'cliente' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'}`}
        >
          👤 Modo Cliente
        </button>
      </div>

      {isWa && (
        <div className="mb-3 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-100">
          En producción este chat vive en WhatsApp Business. El cliente escribe al número del restaurante y el bot toma
          su orden automáticamente.
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto rounded-xl border p-4 space-y-3 ${
          isWa ? 'bg-[#0b141a] border-emerald-900/40' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(mode === 'staff' ? CHIPS_STAFF : CHIPS_CLIENTE).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const history = messages.filter(
                    (m) => m.role === 'user' || (m.role === 'assistant' && m.content.trim())
                  ) as ChatMsg[];
                  void sendMessage(s, history);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  isWa
                    ? 'border-emerald-700 text-emerald-200 hover:bg-emerald-900/40'
                    : 'border-red-500/40 text-red-200 hover:bg-red-900/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => {
          if (m.loyaltyCard && m.role === 'assistant') {
            return (
              <div key={`${i}-loyalty`} className="flex justify-start">
                <div className="w-full max-w-[85%]">
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
                    ? isWa
                      ? 'bg-emerald-700 text-white rounded-tr-sm'
                      : 'bg-red-600 text-white'
                    : isWa
                      ? 'bg-[#202c33] text-slate-100 border border-white/5 rounded-tl-sm'
                      : 'bg-slate-800/90 text-slate-100 border border-white/10'
                }`}
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
            isWa ? 'bg-[#2a3942] border-white/10 text-white placeholder-slate-500' : 'bg-slate-900 border-white/10 text-white'
          }`}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSend()}
          className={`px-4 rounded-xl flex items-center gap-2 font-semibold ${
            isWa ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
          } disabled:opacity-50`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function RestauranteChatPage() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400 text-sm max-w-3xl mx-auto">
        <MessageCircle className="w-5 h-5 text-red-400" />
        <span>Chat IA — La Séptima (demo)</span>
      </div>
      <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
        <ChatInner />
      </Suspense>
    </div>
  );
}
