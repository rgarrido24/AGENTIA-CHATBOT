import Link from 'next/link';
import Image from 'next/image';
import { Building2, UtensilsCrossed, ArrowRight, Scissors } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-luxury text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <header className="flex items-center justify-between mb-20">
            <div className="flex items-center justify-center">
              <Image
                src="/logo-agentia-2026.png"
                alt="Agentia"
                width={72}
                height={72}
                className="rounded-lg object-contain w-[72px] h-[72px] mix-blend-multiply"
              />
            </div>
          </header>

          <section className="mb-24">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 title-tracking font-heading">
              Automatización inteligente
              <br />
              <span className="text-sage">para tu negocio</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mb-12 font-sans">
              Chatbots con IA, CRM integrado y flujos de venta automatizados.
              Atención 24/7 sin aumentar tu equipo.
            </p>
            <Link
              href="/login?from=/dashboard"
              className="inline-flex items-center gap-2 btn-cta px-6 py-3 text-base"
            >
              Acceso Clientes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </section>

          {/* Portafolio de Demos */}
          <section className="mb-24">
            <h2 className="text-2xl font-bold mb-8 title-tracking font-heading">
              Portafolio de Demos
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <article className="rounded-xl border border-forest bg-black p-8 transition-colors hover:border-sage">
                <div className="w-14 h-14 rounded-xl bg-forest/30 border border-forest flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7 text-sage" />
                </div>
                <h3 className="text-xl font-semibold mb-3 title-tracking">
                  Inmobiliaria
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-sans">
                  Catálogo de propiedades, calificación de leads, agendamiento de visitas.
                  Integración con Century 21 y agencias locales.
                </p>
              </article>

              <article className="rounded-xl border border-forest bg-black p-8 transition-colors hover:border-sage">
                <div className="w-14 h-14 rounded-xl bg-forest/30 border border-forest flex items-center justify-center mb-6">
                  <UtensilsCrossed className="w-7 h-7 text-sage" />
                </div>
                <h3 className="text-xl font-semibold mb-3 title-tracking">
                  Restaurantes
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-sans">
                  Reservas, menú digital, pedidos y recordatorios. Reduce no-shows
                  y aumenta la ocupación.
                </p>
              </article>

              <Link href="/demo/barber" className="block">
                <article className="rounded-xl border border-forest bg-black p-8 transition-colors hover:border-sage h-full">
                  <div className="w-14 h-14 rounded-xl bg-forest/30 border border-forest flex items-center justify-center mb-6">
                    <Scissors className="w-7 h-7 text-sage" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 title-tracking">
                    Barbería
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-sans">
                    Reservas con IA, calendario en vivo y conflicto de horarios. Demo
                    Agentia Lite con Gemini.
                  </p>
                  <span className="inline-flex items-center gap-1 text-sage text-sm font-medium mt-4">
                    Ver demo <ArrowRight className="w-4 h-4" />
                  </span>
                </article>
              </Link>
            </div>
          </section>

          {/* Propuesta de valor */}
          <section className="border-t border-forest pt-16">
            <h2 className="text-2xl font-bold mb-8 title-tracking font-heading">
              ¿Por qué Agentia?
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="border border-forest rounded-xl p-6">
                <p className="text-sage font-bold text-2xl mb-2">24/7</p>
                <p className="text-slate-400 text-sm font-sans">Atención automática sin horarios</p>
              </div>
              <div className="border border-forest rounded-xl p-6">
                <p className="text-sage font-bold text-2xl mb-2">IA</p>
                <p className="text-slate-400 text-sm font-sans">Respuestas inteligentes con Gemini</p>
              </div>
              <div className="border border-forest rounded-xl p-6">
                <p className="text-sage font-bold text-2xl mb-2">CRM</p>
                <p className="text-slate-400 text-sm font-sans">Pipeline y seguimiento integrado</p>
              </div>
            </div>
          </section>

          <footer className="mt-24 pt-8 border-t border-forest text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} Agentia. CRM & Chatbot.
          </footer>
        </div>
      </div>
    </main>
  );
}
