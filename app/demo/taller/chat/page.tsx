'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

type ChatMsg = { role: 'user' | 'assistant'; content: string };
type Mode = 'staff' | 'cliente';

const ACCENT = '#475569';
const CLIENT = '#0ea5e9';

const CHIPS_CLIENTE = [
  '¿Cuánto cuesta el cambio de aceite?',
  'Mi carro hace un ruido extraño',
  'Quiero agendar un servicio',
  '¿Cuánto tiempo tarda una afinación?',
];

const CHIPS_STAFF = [
  'Tiempo estimado para cambio de clutch',
  'Cliente reporta testigo de motor encendido',
  'Cómo explicar un presupuesto de frenos',
  'Garantía: cliente regresa con misma falla',
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
      setLoading(true);
      setMessages((m) => [...m, { role: 'user', content: text.trim() }, { role: 'assistant', content: '' }]);
      try {
        const res = await fetch('/api/demo/taller/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            messages: history.map((x) => ({ role: x.role, content: x.content })),
            mode: mode === 'cliente' ? 'cliente' : 'staff',
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

  const isCliente = mode === 'cliente';

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-10rem)] min-h-[420px]">
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          type="button"
          onClick={() => {
            setMode('staff');
            setMessages([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            mode === 'staff' ? 'text-white' : 'bg-white/10 text-slate-400'
          }`}
          style={mode === 'staff' ? { background: ACCENT } : undefined}
        >
          🔧 Staff Taller
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('cliente');
            setMessages([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            mode === 'cliente' ? 'text-white' : 'bg-white/10 text-slate-400'
          }`}
          style={mode === 'cliente' ? { background: CLIENT } : undefined}
        >
          🚗 Cliente
        </button>
      </div>

      <div
        className={`flex-1 overflow-y-auto rounded-xl border p-4 space-y-3 ${
          isCliente ? 'bg-[#0b141a] border-sky-900/40' : 'bg-white/[0.03] border-white/10'
        }`}
      >
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {(isCliente ? CHIPS_CLIENTE : CHIPS_STAFF).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  isCliente
                    ? 'border-sky-700 text-sky-200 hover:bg-sky-900/40'
                    : 'border-slate-500/40 text-slate-200 hover:bg-slate-800/40'
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
                  ? 'text-white rounded-tr-sm'
                  : isCliente
                    ? 'bg-[#202c33] text-slate-100 border border-white/5 rounded-tl-sm'
                    : 'bg-slate-800/90 text-slate-100 border border-white/10'
              }`}
              style={m.role === 'user' ? { background: isCliente ? CLIENT : ACCENT } : undefined}
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
            isCliente ? 'bg-[#2a3942] border-white/10 text-white placeholder-slate-500' : 'bg-slate-900 border-white/10 text-white'
          }`}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSend()}
          className="px-4 rounded-xl flex items-center gap-2 font-semibold text-white disabled:opacity-50"
          style={{ background: isCliente ? CLIENT : ACCENT }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function TallerChatPage() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-slate-400 text-sm max-w-3xl mx-auto">
        <MessageCircle className="w-5 h-5" style={{ color: ACCENT }} />
        <span>Asistente IA — AutoPro (demo)</span>
      </div>
      <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
        <ChatInner />
      </Suspense>
    </div>
  );
}
