'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Send } from 'lucide-react';
import { MOCK_PACIENTES } from '@/lib/mock-data-nutricion';

type ChatMsg = { role: 'user' | 'assistant'; content: string };
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
  '¿Puedo sustituir el pollo por atún?',
  '¿Qué pasa si me como una tortilla?',
  'Tengo hambre, ¿qué puedo comer?',
  '¿El aguacate está permitido en mi dieta?',
  'Me antojé una pizza, ¿qué hago?',
  '¿Cuánto he bajado desde que empecé?',
];

function ChatInner() {
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

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[420px]">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          type="button"
          onClick={() => {
            setMode('nutriologa');
            setMessages([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            mode === 'nutriologa' ? 'text-white' : 'bg-white/10 text-slate-400'
          }`}
          style={mode === 'nutriologa' ? { background: ACCENT } : undefined}
        >
          👩‍⚕️ Nutrióloga
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('paciente');
            setMessages([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            mode === 'paciente' ? 'text-white' : 'bg-white/10 text-slate-400'
          }`}
          style={mode === 'paciente' ? { background: AMBER } : undefined}
        >
          🥗 Paciente
        </button>
        {isPac && (
          <label className="text-xs text-slate-400 flex items-center gap-2 ml-auto">
            Simulando como:
            <select
              value={pacienteId}
              onChange={(e) => {
                setPacienteId(e.target.value);
                setMessages([]);
              }}
              className="bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-white text-xs"
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
          className="mb-3 rounded-lg border p-3 text-xs text-amber-100"
          style={{ borderColor: `${AMBER}55`, background: 'rgba(245,158,11,0.12)' }}
        >
          Vista tipo WhatsApp: la IA usa la dieta del paciente seleccionado.
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto rounded-xl border p-4 space-y-3 ${
          isPac ? 'bg-[#0b141a] border-amber-900/40' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(mode === 'nutriologa' ? CHIPS_NUTRI : CHIPS_PAC).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  isPac
                    ? 'border-amber-700 text-amber-200 hover:bg-amber-900/40'
                    : 'border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={`${i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? isPac
                    ? 'text-white rounded-tr-sm'
                    : 'text-white'
                  : isPac
                    ? 'bg-[#202c33] text-slate-100 border border-white/5 rounded-tl-sm'
                    : 'bg-slate-800/90 text-slate-100 border border-white/10'
              }`}
              style={m.role === 'user' ? { background: isPac ? AMBER : ACCENT } : undefined}
            >
              {m.content ||
                (loading && i === messages.length - 1 && m.role === 'assistant' && !m.content ? (
                  <span className="text-slate-400 italic">Escribiendo…</span>
                ) : null)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
          placeholder="Escribe un mensaje…"
          className={`flex-1 rounded-xl px-4 py-3 text-sm border ${
            isPac ? 'bg-[#2a3942] border-white/10 text-white placeholder-slate-500' : 'bg-slate-900 border-white/10 text-white'
          }`}
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
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400 text-sm max-w-3xl mx-auto">
        <MessageCircle className="w-5 h-5" style={{ color: '#16a34a' }} />
        <span>Asistente IA — NutriVida (demo)</span>
      </div>
      <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
        <ChatInner />
      </Suspense>
    </div>
  );
}
