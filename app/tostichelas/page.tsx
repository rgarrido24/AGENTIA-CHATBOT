'use client';

import { useEffect, useRef } from 'react';
import { initTostichelas } from './app';

export default function TostichelasPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initTostichelas(ref.current);
  }, []);

  return (
    <div ref={ref} className="tos-root">
      <div className="wrap" id="wrap">
        <header className="top">
          <div className="brand">
            <div className="logo">
              TOSTICHELAS<small>Tostadas, mariscos y cervezas</small>
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
        <p className="demo-note" id="demoNote">
          Demo de Agentia con datos de ejemplo. El pedido que haces como cliente aparece en Cocina, Barra, Mesero y Caja.
        </p>
      </div>
      <div id="modal" />
      <div id="toast" aria-live="polite" />
    </div>
  );
}
