'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Calendar, MessageCircle, Send, X } from 'lucide-react';

const EMERALD = '#50C878';

type Role = 'user' | 'assistant';

type Msg = { id: string; role: Role; text: string };

/** Globo (3s): corto para móvil + gancho de conversión */
const BUBBLE_LINE1 = '¡Hola! Soy la IA de Agentia.';
const BUBBLE_LINE2 =
  '¿Quieres que analice tu negocio ahora mismo? Abre el chat y te paso el diagnóstico de 2 minutos.';

/** Panel vacío: un poco más de contexto sin repetir todo el globo */
const PANEL_INTRO =
  '¿Quieres que analice tu negocio ahora mismo para ver cuánto tiempo podemos ahorrarte? Inicia el diagnóstico o cuéntame qué buscas y te guío.';

function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return `widget_${Date.now()}`;
  const k = 'agentia_widget_session';
  let v = window.localStorage.getItem(k);
  if (!v) {
    v = `wgt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(k, v);
  }
  return v;
}

function wantsCommercialCta(text: string) {
  const t = text.toLowerCase();
  return (
    /\b(precio|precios|costo|costos|cotiz|cotización|demo|demos|personaliz|personalizada|a la medida|plan|planes|mensual|anual|agendar|cita|calendario|videollamada|paquete|inversión|negocio|giro|industria|ciudad)\b/i.test(
      t
    )
  );
}

const QUICK_REPLIES: { label: string; message: string }[] = [
  {
    label: 'Quiero automatizar mi negocio',
    message:
      'Hola, tengo un negocio local y quiero automatizar WhatsApp (citas, recordatorios y seguimiento). ¿Qué necesitan saber para orientarme?',
  },
  {
    label: 'No veo mi industria en la web',
    message:
      'Hola, no encuentro mi industria en la página, pero necesito algo hecho a la medida. Mi giro es: ____. Ciudad: ____. ¿Pueden ayudarme?',
  },
  {
    label: 'Quiero precios / planes',
    message: 'Hola, quiero saber precios y planes de Agentia para mi negocio. ¿Me comparten opciones?',
  },
  {
    label: 'Agendar demo en vivo',
    message: 'Hola, quiero agendar una demo en vivo de 15–20 minutos para ver Agentia funcionando con mi caso.',
  },
];

function buildWhatsAppUrl(digits: string, text: string) {
  const d = digits.replace(/\D/g, '');
  if (d.length < 10) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function AgentiaChatWidget() {
  const pathname = usePathname() || '';
  const reduceMotion = useReducedMotion();

  const hidden = useMemo(() => {
    const p = pathname.toLowerCase();
    return (
      p.startsWith('/dashboard') ||
      p.startsWith('/admin') ||
      p.startsWith('/portal') ||
      p.startsWith('/login')
    );
  }, [pathname]);

  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const bookUrl = process.env.NEXT_PUBLIC_AGENTIA_BOOK_URL?.trim() || '';
  const waDigits =
    process.env.NEXT_PUBLIC_WIDGET_WHATSAPP_DIGITS?.trim() ||
    process.env.NEXT_PUBLIC_READY_WHATSAPP_NUMBER?.trim() ||
    '';

  const waPrefill =
    'Hola Rodolfo, vengo del chat de agentia.software. Quiero una demo personalizada / hablar de precios.';

  const waUrl = useMemo(() => buildWhatsAppUrl(waDigits, waPrefill), [waDigits]);

  useEffect(() => {
    if (hidden) return;
    const t = window.setTimeout(() => setShowBubble(true), 3000);
    return () => window.clearTimeout(t);
  }, [hidden]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing, open]);

  const sendMessage = useCallback(async (rawText: string, options?: { clearInput?: boolean }) => {
    const text = rawText.trim();
    if (!text || typing) return;
    if (options?.clearInput) setInput('');

    setMsgs((m) => [...m, { id: newId(), role: 'user', text }]);
    setTyping(true);
    setShowCta(false);

    try {
      const sessionId = getOrCreateSessionId();
      const res = await fetch('/api/chat/widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        mensaje?: string;
        error?: string;
      };
      const raw =
        (typeof data.reply === 'string' ? data.reply.trim() : '') ||
        (typeof data.mensaje === 'string' ? data.mensaje.trim() : '');
      const reply = raw
        ? raw
        : typeof data.error === 'string'
          ? `Ups: ${data.error}`
          : 'No pude obtener respuesta. Intenta de nuevo en un momento.';

      setMsgs((m) => [...m, { id: newId(), role: 'assistant', text: reply }]);
      if (wantsCommercialCta(`${text}\n${reply}`)) setShowCta(true);
    } catch {
      setMsgs((m) => [
        ...m,
        { id: newId(), role: 'assistant', text: 'Error de red. Verifica tu conexión e intenta otra vez.' },
      ]);
    } finally {
      setTyping(false);
    }
  }, [typing]);

  const send = useCallback(() => {
    void sendMessage(input, { clearInput: true });
  }, [input, sendMessage]);

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {showBubble && !open && (
          <motion.button
            type="button"
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            onClick={() => {
              setOpen(true);
              setShowBubble(false);
            }}
            className="pointer-events-auto max-w-[min(92vw,340px)] rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm leading-snug text-zinc-100 shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_18px_60px_-30px_rgba(80,200,120,0.35)] backdrop-blur-2xl"
            style={{ boxShadow: `0 18px 60px -30px ${EMERALD}55` }}
          >
            <span className="block font-semibold text-white">{BUBBLE_LINE1}</span>
            <span className="mt-1.5 block text-[13px] leading-snug text-zinc-200">{BUBBLE_LINE2}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="pointer-events-auto flex h-[min(72vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#070a0d]/75 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_30px_90px_-40px_rgba(80,200,120,0.35)] backdrop-blur-2xl"
          >
            <div
              className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"
              style={{
                background: `linear-gradient(135deg, rgba(80,200,120,0.18), rgba(7,10,13,0.2))`,
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-sm font-black"
                  style={{ color: EMERALD }}
                >
                  A
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Agentia</p>
                  <p className="truncate text-xs text-zinc-400">IA • respuestas al instante</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-zinc-300 hover:bg-white/[0.08]"
                aria-label="Cerrar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {msgs.length === 0 && (
                <div className="space-y-3 px-1">
                  <p className="text-xs leading-relaxed text-zinc-400">{PANEL_INTRO}</p>
                  <a
                    href="/brief"
                    className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/15 px-3 py-2 text-[13px] font-semibold text-emerald-100 hover:bg-emerald-400/20"
                  >
                    Iniciar diagnóstico (2 min)
                  </a>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Empieza en 1 clic
                  </p>
                  <div className="flex flex-col gap-2">
                    {QUICK_REPLIES.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        disabled={typing}
                        onClick={() => void sendMessage(q.message)}
                        className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-left text-[13px] font-medium leading-snug text-emerald-50 hover:bg-emerald-400/15 disabled:opacity-40"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m) => {
                const mine = m.role === 'user';
                return (
                  <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className={
                        mine
                          ? 'max-w-[88%] whitespace-pre-wrap rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[13px] leading-relaxed text-white'
                          : 'max-w-[92%] whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-[13px] leading-relaxed text-zinc-100'
                      }
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.075s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showCta && (
              <div className="border-t border-white/10 bg-black/20 px-3 py-3">
                <p className="mb-2 text-xs font-semibold text-zinc-300">¿Siguiente paso?</p>
                <div className="flex flex-col gap-2">
                  {bookUrl ? (
                    <a
                      href={bookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20"
                    >
                      <Calendar className="h-4 w-4" />
                      Agendar en calendario
                    </a>
                  ) : null}
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.10]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp con Rodolfo
                    </a>
                  ) : (
                    <a
                      href="/ready"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white hover:bg-white/[0.10]"
                    >
                      Ver demo rápida
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-white/10 p-3">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder="Escribe tu mensaje…"
                  className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={typing || !input.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25 disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setShowBubble(false);
        }}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/35 bg-[#070a0d]/70 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_18px_60px_-25px_rgba(80,200,120,0.45)] backdrop-blur-2xl hover:border-emerald-400/55"
        aria-label={open ? 'Cerrar chat Agentia' : 'Abrir chat Agentia'}
      >
        <MessageCircle className="h-7 w-7" style={{ color: EMERALD }} />
      </motion.button>
    </div>
  );
}
