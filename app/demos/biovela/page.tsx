import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'La Rueda Veladoras / BIOVELA — Demo | Agentia',
  robots: { index: false, follow: false },
};

/**
 * Demo de chat (clientId biovela). Misma idea que /demos/chowak: el iframe carga
 * `public/demos/biovela/index.html` para que el chat y estilos sean un documento completo.
 */
export default function BiovelaDemoPage() {
  return (
    <iframe
      src="/demos/biovela/index.html"
      title="La Rueda Veladoras — Velas artesanales · CDMX (demo)"
      className="fixed inset-0 z-[100] block h-[100dvh] w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
    />
  );
}
