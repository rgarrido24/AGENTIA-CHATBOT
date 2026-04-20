'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Send } from 'lucide-react';
import { MOCK_PACIENTES } from '@/lib/mock-data-nutricion';
import { useNutricionTheme } from '../nutricion-theme-context';
import LoyaltyCard from '@/app/demo/barber/LoyaltyCard';
import type { LoyaltyCardData } from '@/app/demo/barber/LoyaltyCard';

type ChatMsg = { role: 'user' | 'assistant'; content: string; loyaltyCard?: LoyaltyCardData };

const DEMO_LOYALTY_NUTRI: LoyaltyCardData = {
  clienteNombre: 'Lucía Flores',
  clienteId: 'Nu-0055',
  negocio: 'NutriVida',
  giro: 'nutricion',
  visitas: 2,
  meta: 4,
  ultimoServicio: 'Consulta de seguimiento',
  recompensaNombre: 'consulta nutricional',
};
type Mode = 'nutriologa' | 'paciente';

const ACCENT = '#16a34a';
const AMBER = '#f59e0b';

const CHIPS_NUTRI = [
  '¿Quién lleva más tiempo sin registrar?',
  'Dame un plan de 1,400 cal para paciente con diabetes',
  '¿Cómo va el progreso general del consultorio?',
  'Genera mensaje motivacional para María',
  '¿Qué pacientes están cerca de su meta?',
];

const CHIPS_PAC = [
  '⭐ Mis puntos de lealtad',
  '¿Puedo sustituir el pollo por atún?',
  '¿Qué pasa si me como una tortilla?',
  'Tengo hambre, ¿qué puedo comer?',
  '¿El aguacate está permitido en mi dieta?',
  'Me antojé una pizza, ¿qué hago?',
  '¿Cuánto he bajado desde que empecé?',
];

function ChatInner() {
  const { colors, theme } = useNutricionTheme();
  const isLight = theme === 'light';
  const sp = useSearchParams();
  const preP = sp.get('paciente') ?? 'p01';
  const [mode, setMode] = useState<Mode>('nutriologa');
  const [pacienteId, setPacienteId] = useState<string>(preP);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPacienteId(preP);
  }, [preP]);

  const sendMessage = useCallback(
    async (text: string, history: ChatMsg[]) => {
      if (!text.trim()) return;

      // Local intercept: loyalty card
      if (/mis\s*puntos?|mi\s*tarjeta|lealtad|puntos/i.test(text)) {
        setMessages((m) => [
          ...m,
          { role: 'user', content: text.trim() },
          { role: 'assistant', content: '', loyaltyCard: DEMO_LOYALTY_NUTRI },
        ]);
        return;
      }

      setLoading(true);
      setMessages((m) => [...m, { role: 'user', content: text.trim() }, { role: 'assistant', content: '' }]);
      try {
        const res = await fetch('/api/demo/nutricion/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            messages: history.map((x) => ({ role: x.role, content: x.content })),
            mode,
            pacienteId: mode === 'paciente' ? pacienteId : undefined,
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
    [mode, pacienteId]
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

  const isPac = mode === 'paciente';

  // The chat area keeps WhatsApp-style dark bg when in patient mode (by design)
  const chatAreaStyle = isPac
    ? { background: '#0b141a', border: '1px solid rgba(245,158,11,0.25)' }
    : { background: colors.cardBg, border: `1px solid ${colors.border}` };

  const assistantBubbleStyle = isPac
    ? { background: '#202c33', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.06)' }
    : { background: isLight ? '#f3f4f6' : '#1e293b', color: colors.textPrimary, border: `1px solid ${colors.border}` };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[420px]">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          type="button"
          onClick={() => {
            setMode('nutriologa');
            setMessages([]);
          }}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={
            mode === 'nutriologa'
              ? { background: ACCENT, color: '#fff' }
              : { background: colors.cardBgAlt, color: colors.textSecondary }
          }
        >
          👩‍⚕️ Nutrióloga
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('paciente');
            setMessages([]);
          }}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={
            mode === 'paciente'
              ? { background: AMBER, color: '#fff' }
              : { background: colors.cardBgAlt, color: colors.textSecondary }
          }
        >
          🥗 Paciente
        </button>
        {isPac && (
          <label className="text-xs flex items-center gap-2 ml-auto" style={{ color: colors.textSecondary }}>
            Simulando como:
            <select
              value={pacienteId}
              onChange={(e) => {
                setPacienteId(e.target.value);
                setMessages([]);
              }}
              className="rounded-lg px-2 py-1 text-xs"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            >
              {MOCK_PACIENTES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {isPac && (
        <div
          className="mb-3 rounded-lg border p-3 text-xs text-amber-700"
          style={{ borderColor: `${AMBER}55`, background: isLight ? '#fef3c7' : 'rgba(245,158,11,0.12)', color: isLight ? '#b45309' : '#fcd34d' }}
        >
          Vista tipo WhatsApp: la IA usa la dieta del paciente seleccionado.
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-xl p-4 space-y-3" style={chatAreaStyle}>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(mode === 'nutriologa' ? CHIPS_NUTRI : CHIPS_PAC).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const history = messages.filter(
                    (m) => m.role === 'user' || (m.role === 'assistant' && m.content.trim())
                  ) as ChatMsg[];
                  void sendMessage(s, history);
                }}
                className="text-xs px-3 py-1.5 rounded-full border"
                style={
                  isPac
                    ? { borderColor: 'rgba(245,158,11,0.5)', color: '#fcd34d' }
                    : { borderColor: isLight ? '#bbf7d0' : 'rgba(22,163,74,0.4)', color: isLight ? '#15803d' : '#86efac' }
                }
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
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                style={
                  m.role === 'user'
                    ? { background: isPac ? AMBER : ACCENT, color: '#fff', borderRadius: '1rem 1rem 0.25rem 1rem' }
                    : { ...assistantBubbleStyle, borderRadius: '1rem 1rem 1rem 0.25rem' }
                }
              >
                {m.content ||
                  (loading && i === messages.length - 1 && m.role === 'assistant' && !m.content ? (
                    <span style={{ color: colors.textMuted }} className="italic">Escribiendo…</span>
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
          className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none"
          style={
            isPac
              ? { background: '#2a3942', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }
              : { background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.textPrimary }
          }
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSend()}
          className="px-4 rounded-xl flex items-center gap-2 font-semibold text-white disabled:opacity-50"
          style={{ background: isPac ? AMBER : ACCENT }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function NutricionChatPage() {
  const { colors } = useNutricionTheme();
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm max-w-3xl mx-auto" style={{ color: colors.textSecondary }}>
        <MessageCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
        <span>Asistente IA — NutriVida (demo)</span>
      </div>
      <Suspense fallback={<div className="text-center py-12" style={{ color: '#6b7280' }}>Cargando…</div>}>
        <ChatInner />
      </Suspense>
    </div>
  );
}
