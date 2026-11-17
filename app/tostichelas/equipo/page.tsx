'use client';

import { useEffect, useRef } from 'react';
import { initTostichelas } from '../app';

export default function TostichelasEquipoPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initTostichelas(ref.current, { staff: true });
  }, []);

  return (
    <div ref={ref} className="tos-root">
      <div className="wrap" id="wrap">
        <header className="top">
          <div className="brand">
            <div className="logo">
              TOSTICHELAS<small>Equipo</small>
            </div>
            <div className="row">
              <button className="btn ghost sm" data-a="sound" id="soundBtn">Sonido: no</button>
              <button className="btn ghost sm" data-a="reset">Reiniciar demo</button>
            </div>
          </div>
          <nav className="nav" id="nav" aria-label="Perfiles" />
        </header>
        <main id="app" />
        <p className="demo-note" id="demoNote">Demo con datos de ejemplo.</p>
      </div>
      <div id="modal" />
      <div id="toast" aria-live="polite" />
    </div>
  );
}
