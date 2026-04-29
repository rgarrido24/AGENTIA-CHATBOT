import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

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

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold">Estado</p>
            <p className="text-xs text-white/60 mt-1">Si el bridge está activo, aquí verás si está conectado.</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <iframe
                title="Status bridge"
                src="/api/whatsapp/status?clientId=decohouse"
                className="w-full h-56 rounded-lg bg-black/30"
              />
              <p className="text-[11px] text-white/50 mt-3">
                Nota: si no aparece “decohouse”, necesitas levantar un worker con <code className="text-white/70">AGENTIA_WHATSAPP_CLIENT_ID=decohouse</code>.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold">Vincular (QR)</p>
            <p className="text-xs text-white/60 mt-1">Escanea con WhatsApp → Dispositivos vinculados.</p>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 overflow-hidden">
              <iframe
                title="QR bridge"
                src="/api/whatsapp/qr?clientId=decohouse&format=html"
                className="w-full h-[420px] rounded-lg bg-black/30"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

