'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Phone, Send, Video } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Message = {
  role: 'bot' | 'user';
  text: string;
  time: string;
};

export type PhoneMockupProps = {
  businessName: string;
  businessEmoji: string;
  accentColor: string;
  apiRoute: string;
  initialMessage: string;
  suggestedChips: string[];
};

type ApiMessage = { role: 'user' | 'assistant'; content: string };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PhoneMockup({
  businessName,
  businessEmoji: _emoji,
  accentColor,
  apiRoute,
  initialMessage,
  suggestedChips,
}: PhoneMockupProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: initialMessage, time: getCurrentTime() },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = { role: 'user', text: text.trim(), time: getCurrentTime() };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      // Build conversation history for API (last 8 messages, excluding the one we just sent)
      const history: ApiMessage[] = messages.slice(-7).map((m) => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      }));

      try {
        const response = await fetch(apiRoute, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            mode: 'cliente',
            messages: history,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botText = '';

        // Add streaming placeholder
        setMessages((prev) => [
          ...prev,
          { role: 'bot', text: '', time: getCurrentTime() },
        ]);
        setIsLoading(false); // hide typing dots once streaming starts

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          botText += decoder.decode(value, { stream: true });
          const snapshot = botText;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'bot',
              text: snapshot,
              time: getCurrentTime(),
            };
            return updated;
          });
        }
      } catch {
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'bot',
            text: 'Disculpa, ocurrió un error. Intenta de nuevo 🙏',
            time: getCurrentTime(),
          },
        ]);
      }
    },
    [messages, isLoading, apiRoute]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage(input);
  };

  const initials = getInitials(businessName);
  const showChips = messages.length <= 1 && !isLoading;
  // Show typing dots when loading and last message is from user (streaming hasn't started yet)
  const showTyping = isLoading;

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
          scale:   { type: 'spring', stiffness: 300, damping: 28 },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Side buttons */}
        <div className="absolute -left-[5px] top-24 w-[3px] h-7 bg-slate-600 rounded-l-full" />
        <div className="absolute -left-[5px] top-36 w-[3px] h-11 bg-slate-600 rounded-l-full" />
        <div className="absolute -left-[5px] top-52 w-[3px] h-11 bg-slate-600 rounded-l-full" />
        <div className="absolute -right-[5px] top-32 w-[3px] h-16 bg-slate-600 rounded-r-full" />

        {/* Screen */}
        <div className="absolute inset-[3px] rounded-[2.5rem] overflow-hidden flex flex-col bg-[#0b141a]">

          {/* Notch */}
          <div className="flex items-center justify-center gap-2 pt-2 pb-1 bg-[#0b141a] shrink-0">
            <div className="w-14 h-[3px] bg-slate-700 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          {/* WhatsApp header */}
          <div
            className="flex items-center gap-2 px-3 py-2 shrink-0"
            style={{ background: '#1f2c34' }}
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: accentColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[11px] font-semibold truncate leading-tight">
                {businessName}
              </p>
              <p className="text-green-400 text-[9px] leading-tight">● En línea</p>
            </div>
            <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 flex flex-col min-h-0">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] text-white text-[11px] leading-relaxed px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-[#005c4b] rounded-2xl rounded-tr-sm'
                      : 'bg-[#1f2c34] rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {/* Show ellipsis while streaming an empty message */}
                  {m.text === '' && m.role === 'bot' ? (
                    <span className="text-slate-500 italic text-[10px]">...</span>
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  )}
                  <div
                    className={`flex items-center gap-1 mt-0.5 ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="text-[9px] text-slate-500">{m.time}</span>
                    {m.role === 'user' && (
                      <span className="text-[9px] text-blue-400">✓✓</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {showTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-[#1f2c34] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggested chips */}
          {showChips && (
            <div className="px-3 pb-1 shrink-0">
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' }}
              >
                {suggestedChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    className="flex-shrink-0 text-white text-[10px] rounded-full px-3 py-1 whitespace-nowrap transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget).style.borderColor = accentColor;
                      (e.currentTarget).style.background = `${accentColor}22`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.12)';
                      (e.currentTarget).style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div
            className="flex gap-2 items-center p-2 shrink-0"
            style={{ background: '#1f2c34' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              disabled={isLoading}
              className="flex-1 rounded-full px-4 py-2 text-white text-[11px] placeholder-slate-500 outline-none disabled:opacity-60"
              style={{ background: '#2a3942' }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: accentColor }}
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Home bar */}
          <div
            className="flex justify-center py-2 shrink-0"
            style={{ background: '#0b141a' }}
          >
            <div className="w-20 h-[3px] bg-slate-600 rounded-full" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
