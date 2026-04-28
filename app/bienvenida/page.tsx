import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { stripe } from '@/lib/stripe';

async function BienvenidaContent({ sessionId }: { sessionId: string }) {
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
  } catch {
    redirect('/precios');
  }

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    redirect('/precios');
  }

  const meta = (session.metadata ?? {}) as Record<string, string>;
  const { plan, negocio, nombre, giro } = meta;
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Agentia';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#000' }}>
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <Image src="/logo-agentia-2026.png" alt="Agentia" width={64} height={64} className="rounded-2xl" />
        </div>

        <div>
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-extrabold text-white mb-2">
            ¡Bienvenido a Agentia!
          </h1>
          <p className="text-sm" style={{ color: '#666' }}>
            Tu plan <span style={{ color: '#22c55e' }}>{planLabel}</span> está activo
          </p>
        </div>

        <div className="rounded-2xl border p-5 text-left space-y-3" style={{ background: '#0d0d0d', borderColor: '#1e1e1e' }}>
          <p className="text-xs font-semibold" style={{ color: '#555' }}>RESUMEN</p>
          {negocio && <p className="text-sm text-white font-semibold">{negocio}</p>}
          {giro    && <p className="text-xs" style={{ color: '#666' }}>{giro}</p>}
          {nombre  && <p className="text-xs" style={{ color: '#555' }}>Cliente: {nombre}</p>}
        </div>

        <div className="rounded-2xl border p-5 text-left space-y-2.5" style={{ background: '#0a1a00', borderColor: '#22c55e33' }}>
          <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>PRÓXIMOS PASOS</p>
          {[
            'En las próximas horas recibirás un mensaje de WhatsApp de nuestro equipo para iniciar la configuración de tu chatbot.',
            'Te solicitaremos la información de tu negocio: servicios, precios y horarios.',
            'En 48–72 horas tu agente IA estará activo y listo para atender a tus clientes.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5" style={{ background: '#22c55e', color: '#000' }}>
                {i + 1}
              </span>
              <p className="text-xs" style={{ color: '#aaa' }}>{step}</p>
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="block py-3 rounded-xl text-sm font-bold"
          style={{ background: '#111', color: '#555', border: '1px solid #222' }}
        >
          Ir al inicio
        </Link>

        <p className="text-[11px]" style={{ color: '#333' }}>
          ¿Preguntas? Escríbenos a{' '}
          <a href="https://wa.me/529998080265" style={{ color: '#444' }} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}

export default async function BienvenidaPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  if (!sessionId) redirect('/precios');

  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#000' }} />}>
      <BienvenidaContent sessionId={sessionId} />
    </Suspense>
  );
}
