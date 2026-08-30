import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chowak Xikin — Demo | Agentia',
  robots: { index: false, follow: false },
};

/**
 * El HTML completo no puede inyectarse con dangerouslySetInnerHTML: el navegador no ejecuta
 * <script> y anidar <html> dentro del layout de Next rompe estilos (bloques negros).
 * El iframe carga `public/demos/chowak/index.html` como documento válido.
 */
export default function ChowakDemoPage() {
  return (
    <iframe
      src="/demos/chowak/index.html"
      title="Chowak Xikin — Cocina artesanal · Mérida (demo)"
      className="fixed inset-0 z-[100] block h-[100dvh] w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
    />
  );
}
