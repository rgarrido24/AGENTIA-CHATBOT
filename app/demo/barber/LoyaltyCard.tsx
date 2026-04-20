'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export type LoyaltyGiro = 'barberia' | 'nail' | 'spa' | 'restaurante' | 'nutricion';

export type LoyaltyCardData = {
  clienteNombre: string;
  clienteId: string;
  negocio: string;
  giro: LoyaltyGiro;
  /** Visitas/consultas (o monto gastado en el ciclo para spa) */
  visitas: number;
  /** Meta del ciclo: visitas/consultas necesarias o monto ($) */
  meta: number;
  ultimoServicio: string;
  recompensaNombre: string;
};

type Props = {
  data: LoyaltyCardData;
  compact?: boolean;
};

const THEMES = {
  barberia: {
    bg: 'linear-gradient(135deg, #0a0f1a 0%, #0f2020 60%, #0d9488 200%)',
    border: 'rgba(13,148,136,0.4)',
    shadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(13,148,136,0.2)',
    stripe: 'linear-gradient(90deg, #0d9488, #5eead4, #0d9488)',
    accent: '#0d9488',
    accentSoft: 'rgba(13,148,136,0.15)',
    accentSoftBorder: 'rgba(13,148,136,0.3)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textAccentLight: '#5eead4',
    textMeta: '#475569',
    qrDark: '#0d9488',
    qrLight: '#0a0f1a',
    emoji: '✂️',
    rewardEmoji: '🎁',
    fillColor: '#0d9488',
    emptyColor: 'rgba(255,255,255,0.1)',
    isDark: true,
    progressType: 'dots' as const,
  },
  nail: {
    bg: 'linear-gradient(135deg, #fff0f7 0%, #fce7f3 60%, #fbcfe8 100%)',
    border: 'rgba(236,72,153,0.3)',
    shadow: '0 8px 24px rgba(236,72,153,0.18)',
    stripe: 'linear-gradient(90deg, #ec4899, #f9a8d4, #ec4899)',
    accent: '#ec4899',
    accentSoft: 'rgba(236,72,153,0.1)',
    accentSoftBorder: 'rgba(236,72,153,0.25)',
    textPrimary: '#831843',
    textSecondary: '#be185d',
    textAccentLight: '#be185d',
    textMeta: '#f9a8d4',
    qrDark: '#be185d',
    qrLight: '#fce7f3',
    emoji: '💅',
    rewardEmoji: '🎀',
    fillColor: '#ec4899',
    emptyColor: 'rgba(236,72,153,0.15)',
    isDark: false,
    progressType: 'dots' as const,
  },
  spa: {
    bg: 'linear-gradient(135deg, #1a0a2e 0%, #1e0e3a 60%, #7c3aed 200%)',
    border: 'rgba(124,58,237,0.45)',
    shadow: '0 8px 32px rgba(0,0,0,0.65), 0 0 28px rgba(124,58,237,0.3)',
    stripe: 'linear-gradient(90deg, #7c3aed, #c4b5fd, #7c3aed)',
    accent: '#7c3aed',
    accentSoft: 'rgba(124,58,237,0.18)',
    accentSoftBorder: 'rgba(124,58,237,0.4)',
    textPrimary: '#ffffff',
    textSecondary: '#a78bfa',
    textAccentLight: '#c4b5fd',
    textMeta: '#4c1d95',
    qrDark: '#a78bfa',
    qrLight: '#1a0a2e',
    emoji: '🌸',
    rewardEmoji: '✨',
    fillColor: '#8b5cf6',
    emptyColor: 'rgba(139,92,246,0.2)',
    isDark: true,
    progressType: 'bar' as const,
  },
  restaurante: {
    bg: 'linear-gradient(135deg, #1a0600 0%, #2d0f00 60%, #ea580c 200%)',
    border: 'rgba(234,88,12,0.4)',
    shadow: '0 8px 32px rgba(0,0,0,0.65), 0 0 24px rgba(234,88,12,0.25)',
    stripe: 'linear-gradient(90deg, #ea580c, #fbbf24, #ea580c)',
    accent: '#ea580c',
    accentSoft: 'rgba(234,88,12,0.15)',
    accentSoftBorder: 'rgba(234,88,12,0.35)',
    textPrimary: '#ffffff',
    textSecondary: '#fb923c',
    textAccentLight: '#fdba74',
    textMeta: '#7c2d12',
    qrDark: '#f97316',
    qrLight: '#1a0600',
    emoji: '🍽️',
    rewardEmoji: '🎁',
    fillColor: '#f97316',
    emptyColor: 'rgba(249,115,22,0.15)',
    isDark: true,
    progressType: 'dots' as const,
  },
  nutricion: {
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
    border: 'rgba(22,163,74,0.3)',
    shadow: '0 8px 24px rgba(22,163,74,0.18)',
    stripe: 'linear-gradient(90deg, #16a34a, #86efac, #16a34a)',
    accent: '#16a34a',
    accentSoft: 'rgba(22,163,74,0.12)',
    accentSoftBorder: 'rgba(22,163,74,0.3)',
    textPrimary: '#14532d',
    textSecondary: '#166534',
    textAccentLight: '#15803d',
    textMeta: '#86efac',
    qrDark: '#16a34a',
    qrLight: '#dcfce7',
    emoji: '🥗',
    rewardEmoji: '🌱',
    fillColor: '#22c55e',
    emptyColor: 'rgba(34,197,94,0.18)',
    isDark: false,
    progressType: 'dots' as const,
  },
} satisfies Record<LoyaltyGiro, {
  bg: string; border: string; shadow: string; stripe: string; accent: string;
  accentSoft: string; accentSoftBorder: string; textPrimary: string; textSecondary: string;
  textAccentLight: string; textMeta: string; qrDark: string; qrLight: string;
  emoji: string; rewardEmoji: string; fillColor: string; emptyColor: string;
  isDark: boolean; progressType: 'dots' | 'bar';
}>;

function progressLabel(giro: LoyaltyGiro, visitas: number, meta: number): string {
  const cycle = visitas % meta;
  if (giro === 'spa') return `$${visitas} acumulados · $${cycle}/$${meta}`;
  if (giro === 'nutricion') return `${visitas} consultas · ${cycle}/${meta} ciclo`;
  return `${visitas} visitas · ${cycle}/${meta} ciclo`;
}

function progressUnit(giro: LoyaltyGiro): string {
  if (giro === 'spa') return ' pesos más';
  if (giro === 'nutricion') return ' consulta más';
  return ' visita más';
}

export default function LoyaltyCard({ data, compact = false }: Props) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const theme = THEMES[data.giro] ?? THEMES.barberia;

  const cycle = data.visitas % data.meta;
  const filled = cycle;
  const remaining = data.meta - cycle;
  const completedCycles = Math.floor(data.visitas / data.meta);
  const pct = Math.round((cycle / data.meta) * 100);

  useEffect(() => {
    let cancelled = false;
    async function gen() {
      try {
        const QRCode = await import('qrcode');
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const payload = encodeURIComponent(
          JSON.stringify({
            clientId: data.clienteId,
            nombre: data.clienteNombre,
            puntos: data.visitas,
            negocio: data.negocio,
          })
        );
        const url = `${origin}/loyalty/${encodeURIComponent(data.clienteId)}?d=${payload}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: compact ? 72 : 100,
          margin: 1,
          color: { dark: theme.qrDark, light: theme.qrLight },
        });
        if (!cancelled) setQrUrl(dataUrl);
      } catch {
        // SSR silent skip
      }
    }
    void gen();
    return () => { cancelled = true; };
  }, [data, compact, theme]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl overflow-hidden ${compact ? 'text-[10px]' : 'text-xs'}`}
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
        width: compact ? '100%' : '280px',
      }}
    >
      {/* Accent stripe */}
      <div className="h-1.5 w-full" style={{ background: theme.stripe }} />

      <div className={compact ? 'p-3' : 'p-4'}>
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p
              className="font-bold tracking-wide uppercase truncate"
              style={{ fontSize: compact ? 9 : 11, color: theme.accent }}
            >
              {theme.emoji} {data.negocio}
            </p>
            <p
              className="font-bold mt-0.5"
              style={{ fontSize: compact ? 13 : 16, color: theme.textPrimary }}
            >
              {data.clienteNombre}
            </p>
            <p
              className="font-mono"
              style={{
                fontSize: compact ? 8 : 10,
                color: theme.isDark ? '#475569' : theme.textMeta,
              }}
            >
              ID: {data.clienteId}
            </p>
          </div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt="QR lealtad"
              className="rounded ml-2 shrink-0"
              style={{ width: compact ? 44 : 60, height: compact ? 44 : 60 }}
            />
          )}
        </div>

        {/* Progress section */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: theme.textSecondary }}>
              {data.giro === 'spa' ? 'Gasto ciclo' : data.giro === 'nutricion' ? 'Consultas' : 'Visitas'}
            </span>
            <span className="font-bold" style={{ color: theme.textAccentLight, fontSize: compact ? 8 : 10 }}>
              {progressLabel(data.giro, data.visitas, data.meta)}
            </span>
          </div>

          {theme.progressType === 'bar' ? (
            // Continuous bar for spa (money-based)
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: compact ? 6 : 8, background: theme.emptyColor }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${theme.fillColor}, ${theme.textAccentLight})`,
                  boxShadow: `0 0 8px ${theme.fillColor}99`,
                }}
              />
            </div>
          ) : (
            // Discrete dots for visit-based giros
            <div className="flex gap-1">
              {Array.from({ length: data.meta }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all"
                  style={{
                    height: compact ? 5 : 6,
                    background: i < filled ? theme.fillColor : theme.emptyColor,
                    boxShadow: i < filled ? `0 0 6px ${theme.fillColor}99` : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reward banner */}
        <div
          className="rounded-xl px-3 py-2 mb-2"
          style={{ background: theme.accentSoft, border: `1px solid ${theme.accentSoftBorder}` }}
        >
          {cycle === 0 && completedCycles > 0 ? (
            <p className="font-bold" style={{ color: theme.textAccentLight }}>
              🏆 ¡Tienes {completedCycles} {data.recompensaNombre} gratis{completedCycles > 1 ? ' pendientes' : ''}!
            </p>
          ) : remaining === 1 ? (
            <p className="font-semibold" style={{ color: theme.textAccentLight }}>
              {theme.rewardEmoji} ¡Solo {remaining}{progressUnit(data.giro)} para tu {data.recompensaNombre} gratis!
            </p>
          ) : (
            <p style={{ color: theme.isDark ? '#cbd5e1' : theme.textSecondary }}>
              {theme.rewardEmoji} {remaining}{progressUnit(data.giro)} ={' '}
              <span className="font-bold" style={{ color: theme.textAccentLight }}>
                {data.recompensaNombre} gratis
              </span>
            </p>
          )}
        </div>

        <p style={{ fontSize: compact ? 8 : 9, color: theme.isDark ? '#475569' : theme.textMeta }}>
          Último servicio: {data.ultimoServicio}
        </p>
      </div>
    </motion.div>
  );
}
