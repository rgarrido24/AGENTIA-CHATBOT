'use client';

/* ═══════════════════════════════════════════════
   AGENTIA · PANEL DE LEADS · Muse Edition
   Redirige al HTML estático de Muse para preservar
   animaciones, scroll y todos los links.
   ═══════════════════════════════════════════════ */

import { useEffect } from 'react';

export default function PanelLeadsContent() {
  useEffect(() => {
    // Redirigir al HTML estático de Muse (preserva todos los links y animaciones)
    window.location.replace('/panel-leads.html');
  }, []);

  // Pantalla de carga mientras redirige
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0B1230',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ color: '#C6FF3E', fontFamily: 'sans-serif', fontSize: 14, opacity: 0.6 }}>
        Cargando…
      </div>
    </div>
  );
}
