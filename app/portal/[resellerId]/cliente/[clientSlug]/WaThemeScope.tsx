'use client';

import { useEffect, useState } from 'react';
import { isLucianoReseller, readLucianoTheme, type LucianoThemeMode } from '@/lib/portal-luciano-ui';

/**
 * Las pantallas de WhatsApp (campañas, bandeja, formularios) están hechas en tonos oscuros.
 * En el panel de Luciano todo es claro por defecto, así que este contenedor reasigna esos colores
 * cuando el tema claro está activo (mismo criterio y misma preferencia guardada que el resto del panel).
 */
const LIGHT_CSS = `
.wa-light .bg-zinc-950{background-color:#f1f5f9}
.wa-light .bg-zinc-900{background-color:#ffffff}
.wa-light .bg-zinc-800{background-color:#e2e8f0}
.wa-light .border-zinc-900,.wa-light .border-zinc-800{border-color:#e2e8f0}
.wa-light .border-zinc-700{border-color:#cbd5e1}
.wa-light .text-zinc-100{color:#0f172a}
.wa-light .text-zinc-200{color:#1e293b}
.wa-light .text-zinc-300{color:#334155}
.wa-light .text-zinc-400,.wa-light .text-zinc-500{color:#64748b}
.wa-light .text-zinc-600{color:#94a3b8}
.wa-light .text-green-400{color:#15803d}
.wa-light .text-red-400{color:#b91c1c}
.wa-light .text-yellow-400,.wa-light .text-yellow-300{color:#a16207}
.wa-light .bg-yellow-500\\/15{background-color:#fef3c7}
.wa-light .bg-green-600,.wa-light .bg-green-700{color:#ffffff}
.wa-light input,.wa-light textarea,.wa-light select{color:#0f172a}
`;

export default function WaThemeScope({ resellerId, children }: { resellerId: string; children: React.ReactNode }) {
  const isLuc = isLucianoReseller(resellerId);
  // Luciano arranca en claro (igual que su panel); el resto de revendedores se queda en oscuro.
  const [theme, setTheme] = useState<LucianoThemeMode>(isLuc ? 'light' : 'dark');

  useEffect(() => {
    if (!isLuc) return;
    setTheme(readLucianoTheme());
    const on = (e: Event) => {
      const d = (e as CustomEvent<LucianoThemeMode>).detail;
      if (d === 'light' || d === 'dark') setTheme(d);
    };
    window.addEventListener('agentia-luciano-theme', on as EventListener);
    return () => window.removeEventListener('agentia-luciano-theme', on as EventListener);
  }, [isLuc]);

  const light = isLuc && theme === 'light';
  return (
    <div className={light ? 'wa-light' : undefined}>
      {light ? <style>{LIGHT_CSS}</style> : null}
      {children}
    </div>
  );
}
