'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function WhatsAppLinkPage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/whatsapp/qr?format=json')
      .then((res) => res.json())
      .then((data) => {
        if (data.qr) {
          setQrUrl(data.qr);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#0a1209]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-emerald-400 mb-6 inline-block transition"
          >
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold mb-2 title-tracking text-white font-heading">
            Vincular WhatsApp
          </h1>
          <p className="text-slate-400 mb-6 subtitle-tracking">
            Escanea el QR con el escáner interno de WhatsApp (Dispositivos vinculados → Vincular dispositivo).
          </p>

          <div className="card-glass p-6 text-center">
            {loading ? (
              <p className="text-slate-400">Cargando QR…</p>
            ) : qrUrl ? (
              <>
                <div className="mb-4 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-200">
                  <strong>⚠️ Usa el escáner de WhatsApp</strong>, no la cámara del celular.
                </div>
                <img
                  src={qrUrl}
                  alt="QR para vincular WhatsApp"
                  className="mx-auto w-64 h-64 rounded-lg bg-white p-2"
                />
                <p className="mt-4 text-slate-400 text-sm">
                  1. WhatsApp → Menú → Dispositivos vinculados<br />
                  2. Vincular dispositivo<br />
                  3. Escanea este QR
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 btn-cta text-sm"
                >
                  Actualizar QR
                </button>
              </>
            ) : (
              <div className="text-left space-y-4">
                <p className="text-slate-400">
                  El QR aún no está disponible. Ejecuta el puente de WhatsApp:
                </p>
                <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                  <li>Abre una terminal nueva (aparte de la que corre la app).</li>
                  <li>Ejecuta: <code className="bg-black/40 px-1.5 py-0.5 rounded">npm run whatsapp</code></li>
                  <li>Espera a que aparezca &quot;QR enviado al API&quot; en la terminal.</li>
                  <li>Haz clic en &quot;Actualizar QR&quot; abajo.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn-cta text-sm"
                >
                  Actualizar QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
