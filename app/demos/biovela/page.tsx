import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'La Rueda Veladoras / BIOVELA — Demo | Agentia',
  robots: { index: false, follow: false },
};

/**
 * Carga directa del demo estático (sin iframe).
 * Motivo: la cabecera CSP global (`/(.*)`) incluye `frame-ancestors 'none'` y la regla
 * específica de `/demos/biovela/*` añade otra CSP; el navegador las combina y la
 * intersección impide embeber el HTML en un iframe (pantalla en blanco / “cara triste”).
 * Chowak puede verse afectado igual si el navegador aplica la misma lógica.
 */
export default function BiovelaDemoPage() {
  redirect('/demos/biovela/index.html');
}
