import Link from 'next/link';
import { LucianoCrmMock } from '@/components/landing/case-mocks/LucianoCrmMock';

export const metadata = {
  title: 'Luciano Ads — Panel CRM | Agentia',
  description: 'Simulación del panel gestor de leads de Luciano Ads con datos ficticios.',
};

export default function ProyectoLucianoAdsPage() {
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
          <p className="text-xs uppercase tracking-wider text-[#7B2FBE]">Caso de éxito</p>
          <h1 className="mt-1 font-[family-name:var(--font-space)] text-3xl font-bold">
            Luciano Ads
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55">
            Panel gestor de leads · simulación interactiva con datos ficticios
          </p>
        </header>
        <LucianoCrmMock />
      </div>
    </main>
  );
}
