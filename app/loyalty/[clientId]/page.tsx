'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import LoyaltyCard from '@/app/demo/barber/LoyaltyCard';
import type { LoyaltyCardData } from '@/app/demo/barber/LoyaltyCard';

// Hardcoded demo data — in production this would query MongoDB
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
};

function LoyaltyProfile() {
  const params = useParams();
  const clientId = decodeURIComponent((params?.clientId as string) ?? '');
  const profile = DEMO_PROFILES[clientId];
  const isBarberia = profile?.giro === 'barberia';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: isBarberia
          ? 'linear-gradient(135deg, #0a0f1a 0%, #0f2020 100%)'
          : 'linear-gradient(135deg, #fff0f7 0%, #fce7f3 100%)',
      }}
    >
      {!profile ? (
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className={`text-2xl font-bold mb-2 ${isBarberia ? 'text-white' : 'text-pink-800'}`}>
            Perfil no encontrado
          </h1>
          <p className={isBarberia ? 'text-slate-400' : 'text-pink-500'}>
            ID: {clientId || '(vacío)'}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-1"
              style={{ color: isBarberia ? '#0d9488' : '#ec4899' }}
            >
              Tarjeta de Lealtad
            </p>
            <h1
              className="text-2xl font-bold"
              style={{ color: isBarberia ? '#ffffff' : '#831843' }}
            >
              {profile.negocio}
            </h1>
          </div>

          <LoyaltyCard data={profile} compact={false} />

          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: isBarberia ? 'rgba(255,255,255,0.04)' : 'rgba(236,72,153,0.06)',
              border: isBarberia ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(236,72,153,0.2)',
            }}
          >
            <h2
              className="font-semibold text-sm"
              style={{ color: isBarberia ? '#94a3b8' : '#9d174d' }}
            >
              Historial del cliente
            </h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Último servicio', value: profile.ultimoServicio },
                { label: 'Visitas totales', value: String(profile.visitas) },
                {
                  label: 'Siguiente recompensa',
                  value: `${profile.meta - (profile.visitas % profile.meta)} visitas más = ${profile.recompensaNombre} gratis`,
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span style={{ color: isBarberia ? '#64748b' : '#be185d' }}>{label}</span>
                  <span
                    className="font-medium"
                    style={{ color: isBarberia ? '#e2e8f0' : '#831843' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p
            className="text-center text-xs"
            style={{ color: isBarberia ? '#334155' : '#f9a8d4' }}
          >
            Escanea este perfil en el negocio para canjear tu recompensa
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoyaltyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Cargando…</div>}>
      <LoyaltyProfile />
    </Suspense>
  );
}
