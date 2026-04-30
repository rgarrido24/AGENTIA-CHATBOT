import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DecoHouseBridgePanels } from './deco-house-bridge-panels';

export const dynamic = 'force-dynamic';

const DECOHOUSE_CLIENT_ID = 'decohouse';

export default async function DecoHouseBridgePage() {
  const token = cookies().get('decohouse_auth')?.value;
  if (token !== '1') redirect('/demo/deco-house');

  return (
    <div className="min-h-screen bg-[#071414] text-white px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-white/60">Deco House</p>
            <h1 className="text-2xl font-bold tracking-tight">WhatsApp Bridge</h1>
            <p className="text-sm text-white/60 mt-1">Solo para esta cuenta. No muestra tu dashboard.</p>
          </div>
          <Link
            href="/demo/deco-house"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80 hover:text-white transition"
          >
            ← Volver al pipeline
          </Link>
        </div>

        <DecoHouseBridgePanels clientId={DECOHOUSE_CLIENT_ID} />
      </div>
    </div>
  );
}

