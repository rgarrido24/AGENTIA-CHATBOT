import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-slate-900 text-white">
      <h1 className="text-2xl font-bold">Agentia</h1>
      <Link
        href="/demo/barber"
        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
      >
        Ir a Demo Barber
      </Link>
    </main>
  );
}
