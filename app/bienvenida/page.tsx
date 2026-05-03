import Image from 'next/image';
import Link from 'next/link';

export default function BienvenidaPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#000' }}
    >
      <div className="w-full max-w-md text-center space-y-6">

        <div className="flex justify-center">
          <Image
            src="/logo-agentia-2026.png"
            alt="Agentia"
            width={64}
            height={64}
            className="rounded-2xl"
          />
        </div>

        <div>
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-extrabold text-white mb-2">
            ¡Bienvenido a Agentia!
          </h1>
        </div>

        <div
          className="rounded-2xl border p-5 text-left space-y-3"
          style={{ background: '#0a1a00', borderColor: '#22c55e33' }}
        >
          <p className="text-sm text-white leading-relaxed">
            Tu cuenta está siendo activada.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#aaa' }}>
            En menos de 24 horas recibirás instrucciones por WhatsApp para comenzar.
          </p>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#555' }}>
            CONTACTO
          </p>
          <a
            href="https://wa.me/529998080265"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: '#0a1a00', border: '1px solid #22c55e33' }}
            >
              💬
            </span>
            <div className="text-left">
              <p className="text-xs" style={{ color: '#555' }}>WhatsApp</p>
              <p className="text-sm font-semibold text-white group-hover:underline">
                +52 999 808 0265
              </p>
            </div>
          </a>
        </div>

        <Link
          href="https://agentia.software"
          target="_blank"
          rel="noopener noreferrer"
          className="block py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80"
          style={{ background: '#22c55e', color: '#000' }}
        >
          Ir a agentia.software
        </Link>

      </div>
    </div>
  );
}
