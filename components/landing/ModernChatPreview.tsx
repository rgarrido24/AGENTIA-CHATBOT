'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type ChatLine = {
  from: 'user' | 'bot';
  text: string;
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[#1f2c34] px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-white/55"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

type Props = {
  businessName: string;
  accent?: string;
  messages: readonly ChatLine[];
  animate?: boolean;
  compact?: boolean;
};

export function ModernChatPreview({
  businessName,
  accent = '#00D4FF',
  messages,
  animate = true,
  compact = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(animate ? 0 : messages.length);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!animate || reduceMotion) {
      setVisible(messages.length);
      setTyping(false);
      return;
    }
    setVisible(0);
    setTyping(true);
    const timers: ReturnType<typeof setTimeout>[] = [];
    messages.forEach((msg, i) => {
      timers.push(
        setTimeout(() => {
          if (msg.from === 'bot') setTyping(true);
        }, i * 2200),
      );
      timers.push(
        setTimeout(() => {
          setTyping(false);
          setVisible(i + 1);
          if (i < messages.length - 1 && messages[i + 1]?.from === 'bot') setTyping(true);
        }, i * 2200 + (msg.from === 'bot' ? 900 : 400)),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [animate, messages, reduceMotion]);

  const chatHeight = compact ? 'min-h-[320px]' : 'min-h-[480px]';

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b141a] text-sm">
      <div className="flex items-center gap-3 border-b border-white/8 bg-[#111b21] px-4 py-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-[#0a0a0a]"
          style={{ background: accent }}
        >
          {businessName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{businessName}</p>
          <p className="flex items-center gap-1.5 text-sm text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            en línea
          </p>
        </div>
      </div>

      <div className={`relative flex-1 overflow-hidden ${chatHeight}`}>
        <div
          className="absolute inset-0 flex flex-col justify-end gap-3 overflow-y-auto p-4"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(0,212,255,0.05), transparent 40%), #0b141a',
          }}
        >
          {messages.slice(0, visible).map((m, i) => (
            <motion.div
              key={`${m.from}-${i}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed text-white ${
                  m.from === 'user' ? 'rounded-br-md' : 'rounded-bl-md bg-[#1f2c34]'
                }`}
                style={
                  m.from === 'user'
                    ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }
                    : undefined
                }
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && visible < messages.length ? (
            <div className="flex justify-start">
              <TypingDots />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/8 bg-[#111b21] px-4 py-3">
        <div className="h-10 flex-1 rounded-full bg-[#1f2c34] px-4 text-sm leading-10 text-white/35">
          Escribe un mensaje...
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#0a0a0a]"
          style={{ background: accent }}
        >
          →
        </div>
      </div>
    </div>
  );
}
