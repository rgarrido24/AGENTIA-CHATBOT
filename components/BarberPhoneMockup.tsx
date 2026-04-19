'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import styles from '@/app/demo/barber/demo-barber.module.css';
import type { ChatMessage } from '@/app/demo/barber/barber-chat-types';
import {
  ChatHeaderWhatsApp,
  CheckoutSeguro,
  DoubleCheckBlue,
  GalleryPlaceholder,
  MapPreviewBlock,
  TicketReservacion,
  formatMessageTime,
} from '@/app/demo/barber/barber-chat-blocks';
import LoyaltyCard from '@/app/demo/barber/LoyaltyCard';

const bubbleVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28 },
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export type BarberPhoneMockupProps = {
  businessName: string;
  businessEmoji: string;
  accentColor: string;
  initialMessage: string;
  suggestedChips: string[];
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  showPagarButton?: boolean;
  payPhone?: string;
  onPayPhoneChange?: (value: string) => void;
  onPagarAnticipo?: () => void;
};

export default function BarberPhoneMockup({
  businessName,
  businessEmoji: _businessEmoji,
  accentColor,
  initialMessage,
  suggestedChips,
  messages,
  input,
  loading,
  onInputChange,
  onSend,
  showPagarButton = false,
  payPhone = '',
  onPayPhoneChange,
  onPagarAnticipo,
}: BarberPhoneMockupProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(businessName);
  const showChips = messages.length <= 1 && !loading;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [showPagarButton, payPhone]);

  return (
    <div style={{ perspective: '1200px' }}>
      <motion.div
        className="relative w-[300px] h-[620px] rounded-[3rem] border-4 border-slate-700 bg-slate-900 cursor-pointer"
        animate={{
          boxShadow: [
            `0 0 60px rgba(0,0,0,0.7), 0 0 30px ${accentColor}33`,
            `0 0 60px rgba(0,0,0,0.7), 0 0 55px ${accentColor}99`,
            `0 0 60px rgba(0,0,0,0.7), 0 0 30px ${accentColor}33`,
          ],
        }}
        whileHover={{ rotateY: -8, rotateX: 4, scale: 1.02 }}
        transition={{
          boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          rotateY: { type: 'spring', stiffness: 300, damping: 28 },
          rotateX: { type: 'spring', stiffness: 300, damping: 28 },
          scale: { type: 'spring', stiffness: 300, damping: 28 },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute -left-[5px] top-24 w-[3px] h-7 bg-slate-600 rounded-l-full" />
        <div className="absolute -left-[5px] top-36 w-[3px] h-11 bg-slate-600 rounded-l-full" />
        <div className="absolute -left-[5px] top-52 w-[3px] h-11 bg-slate-600 rounded-l-full" />
        <div className="absolute -right-[5px] top-32 w-[3px] h-16 bg-slate-600 rounded-r-full" />

        <div className="absolute inset-[3px] rounded-[2.5rem] overflow-hidden flex flex-col bg-[#0b141a]">
          <div className="flex items-center justify-center gap-2 pt-2 pb-1 bg-[#0b141a] shrink-0">
            <div className="w-14 h-[3px] bg-slate-700 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          <ChatHeaderWhatsApp loading={loading} />

          <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col min-h-0">
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-500 text-center py-2">{initialMessage}</p>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <motion.div
                    key={`${i}-${m.content.slice(0, 12)}-${m.cita ? 't' : ''}-${m.isLocation ? 'l' : ''}`}
                    variants={bubbleVariants}
                    initial="initial"
                    animate="animate"
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[82%] text-white text-[11px] leading-relaxed px-3 py-2 rounded-2xl shadow-sm break-words"
                      style={
                        isUser
                          ? { background: '#005c4b', borderRadius: '1rem 1rem 0.25rem 1rem' }
                          : {
                              background: '#1f2c34',
                              borderRadius: '1rem 1rem 1rem 0.25rem',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }
                      }
                    >
                      {m.content ? <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span> : null}
                      {m.cita ? <TicketReservacion cita={m.cita} /> : null}
                      {m.showGallery ? <GalleryPlaceholder /> : null}
                      {m.isLocation ? <MapPreviewBlock /> : null}
                      {m.loyaltyCard ? <LoyaltyCard data={m.loyaltyCard} compact /> : null}
                      {!isUser && (m.content || m.cita || m.showGallery || m.isLocation || m.loyaltyCard) && (
                        <div className={`flex items-center gap-1 mt-1 ${styles.bubbleMeta}`}>
                          <span className={styles.bubbleTime}>{formatMessageTime(m.createdAt)}</span>
                          <DoubleCheckBlue />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-[#1f2c34] rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
                  <span className="text-slate-500 text-[10px]">Escribiendo</span>
                  <span className={styles.typingDots}>
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </motion.div>
            )}

            {showPagarButton && onPagarAnticipo && (
              <div className="pt-1 space-y-2">
                <p className="text-[10px] text-slate-400">WhatsApp (opcional):</p>
                <input
                  type="tel"
                  value={payPhone}
                  onChange={(e) => onPayPhoneChange?.(e.target.value)}
                  placeholder="Ej: 52 55 1234 5678"
                  className="w-full rounded-lg px-2 py-1.5 text-[11px] bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <CheckoutSeguro onPagar={onPagarAnticipo} />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {showChips && (
            <div className="px-3 pb-1 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {suggestedChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onSend(chip)}
                    className="flex-shrink-0 text-white text-[10px] rounded-full px-3 py-1 whitespace-nowrap transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = accentColor;
                      e.currentTarget.style.background = `${accentColor}22`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 items-center p-2 shrink-0" style={{ background: '#1f2c34' }}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ background: accentColor }}
              aria-hidden
            >
              {initials}
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
              placeholder="Escribe un mensaje..."
              disabled={loading}
              className="flex-1 rounded-full px-3 py-2 text-white text-[11px] placeholder-slate-500 outline-none disabled:opacity-60"
              style={{ background: '#2a3942' }}
            />
            <button
              type="button"
              onClick={() => onSend()}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: accentColor }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          <div className="flex justify-center py-2 shrink-0" style={{ background: '#0b141a' }}>
            <div className="w-20 h-[3px] bg-slate-600 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
