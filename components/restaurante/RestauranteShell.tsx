'use client';

import { useEffect, useRef } from 'react';
import type { RestauranteConfig } from '@/lib/restaurantes/config';
import { initRestaurante } from './engine';

/**
 * Carcasa de la app de un restaurante. Monta el motor con la config del restaurante.
 * `staff` = pantalla del equipo (mesero, cocina, barra, caja y dueño).
 */
export default function RestauranteShell({ cfg, staff }: { cfg: RestauranteConfig; staff?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initRestaurante(ref.current, cfg, staff ? { staff: true } : undefined);
  }, [cfg, staff]);

  return (
    <div ref={ref} className="tos-root">
      <div className="wrap" id="wrap">
        <header className="top">
          <div className="brand">
            <div className="logo">
              {cfg.marca.nombreMayus}
              <small>{staff ? 'Equipo' : cfg.marca.tagline}</small>
            </div>
            <div className="row">
              <button className="btn ghost sm" data-a="install" id="installBtn" style={{ display: 'none' }}>Instalar app</button>
              <button className="btn ghost sm" data-a="sound" id="soundBtn">Sonido: no</button>
              <button className="btn ghost sm" data-a="reset">Reiniciar demo</button>
            </div>
          </div>
          <nav className="nav" id="nav" aria-label="Perfiles" />
        </header>
        <main id="app" />
        {cfg.demo ? (
          <p className="demo-note" id="demoNote">
            {staff
              ? 'Demo con datos de ejemplo.'
              : 'Demo de Agentia con datos de ejemplo. El pedido que haces como cliente aparece en Cocina, Barra, Mesero y Caja.'}
          </p>
        ) : null}
      </div>
      <div id="modal" />
      <div id="toast" aria-live="polite" />
    </div>
  );
}
