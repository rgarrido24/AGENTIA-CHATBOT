'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { GiroId } from './giro-config';

export type LoyaltyCardData = {
  clienteNombre: string;
  clienteId: string;
  negocio: string;
  giro: GiroId;
  visitas: number;
  meta: number;
  ultimoServicio: string;
  recompensaNombre: string; // "corte de cabello" | "manicure"
};

type Props = {
  data: LoyaltyCardData;
  compact?: boolean; // compact=true for phone mockup (smaller)
};

function buildVisitBar(visitas: number, meta: number): { filled: number; empty: number; cycle: number } {
  const cycle = visitas % meta;
  return { filled: cycle, empty: meta - cycle, cycle };
}

export default function LoyaltyCard({ data, compact = false }: Props) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const isBarberia = data.giro === 'barberia';

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      try {
        const QRCode = await import('qrcode');
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/loyalty/${encodeURIComponent(data.clienteId)}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: compact ? 72 : 100,
          margin: 1,
          color: isBarberia
            ? { dark: '#0d9488', light: '#0a0f1a' }
            : { dark: '#be185d', light: '#fce7f3' },
        });
        if (!cancelled) setQrUrl(dataUrl);
      } catch {
        // qrcode unavailable in SSR — silently skip
      }
    }
    void gen();
    return () => { cancelled = true; };
  }, [data.clienteId, data.giro, compact, isBarberia]);

  const { filled, empty, cycle } = buildVisitBar(data.visitas, data.meta);
  const remaining = data.meta - cycle;
  const completedCycles = Math.floor(data.visitas / data.meta);

  // ── Barbería: dark elegant card ──────────────────────────────
  if (isBarberia) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`rounded-2xl overflow-hidden ${compact ? 'text-[10px]' : 'text-xs'}`}
        style={{
          background: 'linear-gradient(135deg, #0a0f1a 0%, #0f2020 60%, #0d9488 200%)',
          border: '1px solid rgba(13,148,136,0.4)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(13,148,136,0.2)',
          width: compact ? '100%' : '280px',
        }}
      >
        {/* Top stripe */}
        <div
          className="h-1.5 w-full"
          style={{ background: 'linear-gradient(90deg, #0d9488, #5eead4, #0d9488)' }}
        />

        <div className={`${compact ? 'p-3' : 'p-4'}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-teal-400 font-bold tracking-wide uppercase" style={{ fontSize: compact ? 9 : 11 }}>
                ✂️ {data.negocio}
              </p>
              <p className="text-white font-bold mt-0.5" style={{ fontSize: compact ? 13 : 16 }}>
                {data.clienteNombre}
              </p>
              <p className="text-slate-500 font-mono" style={{ fontSize: compact ? 8 : 10 }}>
                ID: {data.clienteId}
              </p>
            </div>
            {qrUrl && (
              <img
                src={qrUrl}
                alt="QR código de lealtad"
                className="rounded"
                style={{ width: compact ? 44 : 60, height: compact ? 44 : 60 }}
              />
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400">Visitas</span>
              <span className="text-teal-300 font-bold">{data.visitas} totales · {cycle}/{data.meta} ciclo</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: data.meta }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all"
                  style={{
                    height: compact ? 5 : 6,
                    background: i < filled ? '#0d9488' : 'rgba(255,255,255,0.1)',
                    boxShadow: i < filled ? '0 0 6px rgba(13,148,136,0.7)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Reward info */}
          <div
            className="rounded-xl px-3 py-2 mb-2"
            style={{ background: 'rgba(13,148,136,0.15)', border: '1px solid rgba(13,148,136,0.3)' }}
          >
            {cycle === 0 && completedCycles > 0 ? (
              <p className="text-teal-300 font-bold">
                🏆 ¡Tienes {completedCycles} {data.recompensaNombre} gratis pendiente{completedCycles > 1 ? 's' : ''}!
              </p>
            ) : remaining === 1 ? (
              <p className="text-teal-200 font-semibold">
                🔥 ¡Solo {remaining} visita más para tu {data.recompensaNombre} gratis!
              </p>
            ) : (
              <p className="text-slate-300">
                🎁 {remaining} visitas más = <span className="text-teal-300 font-bold">{data.recompensaNombre} gratis</span>
              </p>
            )}
          </div>

          <p className="text-slate-600" style={{ fontSize: compact ? 8 : 9 }}>
            Último servicio: {data.ultimoServicio}
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Nail Studio: light colorful card ─────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl overflow-hidden ${compact ? 'text-[10px]' : 'text-xs'}`}
      style={{
        background: 'linear-gradient(135deg, #fff0f7 0%, #fce7f3 60%, #fbcfe8 100%)',
        border: '1px solid rgba(236,72,153,0.3)',
        boxShadow: '0 8px 24px rgba(236,72,153,0.18)',
        width: compact ? '100%' : '280px',
      }}
    >
      {/* Top stripe */}
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, #ec4899, #f9a8d4, #ec4899)' }}
      />

      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-pink-600 font-bold tracking-wide uppercase" style={{ fontSize: compact ? 9 : 11 }}>
              💅 {data.negocio}
            </p>
            <p className="text-pink-900 font-bold mt-0.5" style={{ fontSize: compact ? 13 : 16 }}>
              {data.clienteNombre}
            </p>
            <p className="text-pink-400 font-mono" style={{ fontSize: compact ? 8 : 10 }}>
              ID: {data.clienteId}
            </p>
          </div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt="QR código de lealtad"
              className="rounded"
              style={{ width: compact ? 44 : 60, height: compact ? 44 : 60 }}
            />
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-pink-500">Visitas</span>
            <span className="text-pink-700 font-bold">{data.visitas} totales · {cycle}/{data.meta} ciclo</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: data.meta }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  height: compact ? 5 : 6,
                  background: i < filled ? '#ec4899' : 'rgba(236,72,153,0.15)',
                  boxShadow: i < filled ? '0 0 6px rgba(236,72,153,0.5)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Reward */}
        <div
          className="rounded-xl px-3 py-2 mb-2"
          style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)' }}
        >
          {cycle === 0 && completedCycles > 0 ? (
            <p className="text-pink-600 font-bold">
              🏆 ¡Tienes {completedCycles} {data.recompensaNombre} gratis!
            </p>
          ) : remaining === 1 ? (
            <p className="text-pink-700 font-semibold">
              💖 ¡Solo {remaining} visita más para tu {data.recompensaNombre} gratis!
            </p>
          ) : (
            <p className="text-pink-700">
              🎀 {remaining} visitas más = <span className="text-pink-600 font-bold">{data.recompensaNombre} gratis</span>
            </p>
          )}
        </div>

        <p className="text-pink-400" style={{ fontSize: compact ? 8 : 9 }}>
          Último servicio: {data.ultimoServicio}
        </p>
      </div>
    </motion.div>
  );
}
