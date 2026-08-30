import Link from 'next/link';
import { DecoHouseCrmMock } from '@/components/landing/case-mocks/DecoHouseCrmMock';

export const metadata = {
  title: 'Deco House — Panel CRM | Agentia',
  description: 'Simulación del pipeline CRM de Deco House con datos ficticios.',
};

export default function ProyectoDecoHousePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] font-[family-name:var(--font-inter)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/#casos"
          className="text-sm text-white/55 transition hover:text-[#00D4FF]"
        >
          ← Volver a casos de éxito
        </Link>
        <header className="mt-6 mb-8">
          <p className="text-xs uppercase tracking-wider text-[#00B4D8]">Caso de éxito</p>
          <h1 className="mt-1 font-[family-name:var(--font-space)] text-3xl font-bold">
            Deco House
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Pipeline + presupuestos · simulación interactiva con datos ficticios
          </p>
        </header>
        <DecoHouseCrmMock />
      </div>
    </main>
  );
}
