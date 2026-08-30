'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import LoyaltyCard from '@/app/demo/barber/LoyaltyCard';
import type { LoyaltyCardData, LoyaltyGiro } from '@/app/demo/barber/LoyaltyCard';

const DEMO_PROFILES: Record<string, LoyaltyCardData> = {
  'C-0042': {
    clienteNombre: 'Carlos Mendoza',
    clienteId: 'C-0042',
    negocio: 'Barbería El Estilo',
    giro: 'barberia',
    visitas: 3,
    meta: 5,
    ultimoServicio: 'Corte y barba',
    recompensaNombre: 'corte de cabello',
  },
  'N-0018': {
    clienteNombre: 'Ana García',
    clienteId: 'N-0018',
    negocio: 'Nail Studio Demo',
    giro: 'nail',
    visitas: 2,
    meta: 5,
    ultimoServicio: 'Uñas acrílicas',
    recompensaNombre: 'manicure',
  },
  'S-0033': {
    clienteNombre: 'Sofía Ramírez',
    clienteId: 'S-0033',
    negocio: 'Lumina Spa',
    giro: 'spa',
    visitas: 350,
    meta: 500,
    ultimoServicio: 'Masaje de tejido profundo',
    recompensaNombre: 'tratamiento facial',
  },
  'R-0077': {
    clienteNombre: 'Juan Torres',
    clienteId: 'R-0077',
    negocio: 'La Séptima',
    giro: 'restaurante',
    visitas: 7,
    meta: 10,
    ultimoServicio: 'Costillas BBQ + margarita',
    recompensaNombre: 'platillo de temporada',
  },
  'Nu-0055': {
    clienteNombre: 'Lucía Flores',
    clienteId: 'Nu-0055',
    negocio: 'NutriVida',
    giro: 'nutricion',
    visitas: 2,
    meta: 4,
    ultimoServicio: 'Consulta de seguimiento',
    recompensaNombre: 'consulta nutricional',
  },
};

const GIRO_DARK: Record<LoyaltyGiro, boolean> = {
  barberia: true,
  nail: false,
  spa: true,
  restaurante: true,
  nutricion: false,
};

const GIRO_BG: Record<LoyaltyGiro, string> = {
  barberia: 'linear-gradient(135deg, #0a0f1a 0%, #0f2020 100%)',
  nail: 'linear-gradient(135deg, #fff0f7 0%, #fce7f3 100%)',
  spa: 'linear-gradient(135deg, #1a0a2e 0%, #1e0e3a 100%)',
  restaurante: 'linear-gradient(135deg, #1a0600 0%, #2d0f00 100%)',
  nutricion: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
};

const GIRO_ACCENT: Record<LoyaltyGiro, string> = {
  barberia: '#0d9488',
  nail: '#ec4899',
  spa: '#8b5cf6',
  restaurante: '#f97316',
  nutricion: '#16a34a',
};

const GIRO_HEADING: Record<LoyaltyGiro, string> = {
  barberia: '#ffffff',
  nail: '#831843',
  spa: '#ffffff',
  restaurante: '#ffffff',
  nutricion: '#14532d',
};

const GIRO_LABEL: Record<LoyaltyGiro, string> = {
  barberia: '✂️ Barbería',
  nail: '💅 Nail Studio',
  spa: '🌸 Spa',
  restaurante: '🍽️ Restaurante',
  nutricion: '🥗 Nutrición',
};

type HistoryRow = { label: string; value: string };

function buildHistory(profile: LoyaltyCardData): HistoryRow[] {
  const cycle = profile.visitas % profile.meta;
  const remaining = profile.meta - cycle;

  const unitLabel =
    profile.giro === 'spa'
      ? `$${remaining} pesos más`
      : profile.giro === 'nutricion'
      ? `${remaining} consulta${remaining !== 1 ? 's' : ''} más`
      : `${remaining} visita${remaining !== 1 ? 's' : ''} más`;

  const progressLabel =
    profile.giro === 'spa'
      ? `$${cycle} / $${profile.meta}`
      : `${cycle} / ${profile.meta}`;

  return [
    { label: 'Último servicio', value: profile.ultimoServicio },
    {
      label: profile.giro === 'spa' ? 'Total acumulado' : 'Visitas totales',
      value: profile.giro === 'spa' ? `$${profile.visitas}` : String(profile.visitas),
    },
    { label: 'Ciclo actual', value: progressLabel },
    {
      label: 'Siguiente recompensa',
      value: `${unitLabel} = ${profile.recompensaNombre} gratis`,
    },
  ];
}

function LoyaltyProfile() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = decodeURIComponent((params?.clientId as string) ?? '');

  // Try hardcoded profile first; fall back to QR-embedded JSON data
  let profile = DEMO_PROFILES[clientId];
  if (!profile) {
    try {
      const raw = searchParams.get('d');
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw)) as {
          clientId?: string;
          nombre?: string;
          puntos?: number;
          negocio?: string;
        };
        if (parsed.clientId && parsed.nombre) {
          profile = {
            clienteNombre: parsed.nombre,
            clienteId: parsed.clientId,
            negocio: parsed.negocio ?? 'Demo',
            giro: 'barberia',
            visitas: parsed.puntos ?? 0,
            meta: 5,
            ultimoServicio: '—',
            recompensaNombre: 'servicio gratis',
          };
        }
      }
    } catch {
      // malformed QR data
    }
  }

  const giro: LoyaltyGiro = profile?.giro ?? 'barberia';
  const isDark = GIRO_DARK[giro];
  const accentColor = GIRO_ACCENT[giro];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: GIRO_BG[giro] }}
    >
      {!profile ? (
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold mb-2" style={{ color: isDark ? '#ffffff' : '#1f2937' }}>
            Perfil no encontrado
          </h1>
          <p style={{ color: isDark ? '#64748b' : '#6b7280' }}>ID: {clientId || '(vacío)'}</p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-6">
          {/* Page header */}
          <div className="text-center">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-1"
              style={{ color: accentColor }}
            >
              {GIRO_LABEL[giro]} — Tarjeta de Lealtad
            </p>
            <h1 className="text-2xl font-bold" style={{ color: GIRO_HEADING[giro] }}>
              {profile.negocio}
            </h1>
          </div>

          {/* The card */}
          <LoyaltyCard data={profile} compact={false} />

          {/* History panel */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : `${accentColor}33`}`,
            }}
          >
            <h2
              className="font-semibold text-sm"
              style={{ color: isDark ? '#94a3b8' : accentColor }}
            >
              Historial del cliente
            </h2>
            <div className="space-y-2 text-sm">
              {buildHistory(profile).map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-2">
                  <span style={{ color: isDark ? '#64748b' : `${accentColor}bb` }}>{label}</span>
                  <span
                    className="font-medium text-right"
                    style={{ color: isDark ? '#e2e8f0' : GIRO_HEADING[giro] }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p
            className="text-center text-xs"
            style={{ color: isDark ? '#334155' : `${accentColor}99` }}
          >
            Muestra este perfil en {profile.negocio} para canjear tu recompensa
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoyaltyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Cargando…
        </div>
      }
    >
      <LoyaltyProfile />
    </Suspense>
  );
}
