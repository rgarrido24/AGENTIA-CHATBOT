'use client';

import { getPaycesaImages } from '@/lib/paycesa-images';
import { AGENTIA_WHATSAPP_DISPLAY, AGENTIA_WHATSAPP_URL } from '@/lib/agentia-contact';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Globe,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAnalytics } from '@/src/lib/analytics-client';

const MAHOGANY = '#3C201B';
const AMBER = '#E67E22';
const CREAM = '#fffaf1';
const BROWN = '#5D4037';
const BORDER = '#eed3c2';

const TOTAL_SLIDES = 12;

export function PaycesaPresentation() {
  useAnalytics('paycesa');
  const images = useMemo(() => getPaycesaImages(), []);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  indexRef.current = index;

  const go = useCallback((next: number) => {
    const clamped = ((next % TOTAL_SLIDES) + TOTAL_SLIDES) % TOTAL_SLIDES;
    setIndex(clamped);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(indexRef.current + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(indexRef.current - 1);
      }
      if (e.key === 'Home') go(0);
      if (e.key === 'End') go(TOTAL_SLIDES - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const touchStartX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const d = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(d) > 56) go(d < 0 ? indexRef.current + 1 : indexRef.current - 1);
  };

  return (
    <div
      className="flex min-h-dvh flex-col bg-[#f3f4f6] text-[color:var(--mahogany)]"
      style={
        {
          ['--mahogany' as string]: MAHOGANY,
          ['--amber' as string]: AMBER,
          ['--cream' as string]: CREAM,
          ['--brown' as string]: BROWN,
          ['--border' as string]: BORDER,
          fontFamily: 'var(--font-paycesa-arimo), ui-sans-serif, system-ui, sans-serif',
        } as React.CSSProperties
      }
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barra de progreso */}
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-black/10">
        <div
          className="h-full bg-[color:var(--amber)] transition-[width] duration-500 ease-out"
          style={{ width: `${((index + 1) / TOTAL_SLIDES) * 100}%` }}
        />
      </div>

      <main className="relative flex flex-1 flex-col items-center justify-center px-3 py-6 sm:px-6">
        <div className="relative w-full max-w-[1280px]">
          {SLIDE_KEYS.map((key, i) => (
            <article
              key={key}
              aria-hidden={i !== index}
              className={[
                'aspect-video w-full overflow-hidden rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                i === index
                  ? 'relative z-10 translate-x-0 opacity-100'
                  : 'pointer-events-none absolute inset-0 z-0 opacity-0',
                i !== index && i < index && '-translate-x-6 sm:-translate-x-10',
                i !== index && i > index && 'translate-x-6 sm:translate-x-10',
              ].join(' ')}
            >
              {renderSlide(key, images)}
            </article>
          ))}
        </div>

        <nav
          className="mt-6 flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-4 px-1"
          aria-label="Navegación de diapositivas"
        >
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-[color:var(--mahogany)] shadow-sm transition hover:bg-[color:var(--cream)]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Anterior
          </button>

          <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
            {SLIDE_KEYS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a diapositiva ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={[
                  'h-2.5 rounded-full transition-all duration-300',
                  i === index ? 'w-8 bg-[color:var(--amber)]' : 'w-2.5 bg-black/20 hover:bg-black/35',
                ].join(' ')}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-[color:var(--mahogany)] shadow-sm transition hover:bg-[color:var(--cream)]"
          >
            Siguiente
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </nav>

        <p className="mt-3 text-center text-xs text-black/45">
          Flechas o espacio · {index + 1} / {TOTAL_SLIDES}
        </p>
      </main>
    </div>
  );
}

const SLIDE_KEYS = [
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's7',
  's8',
  's9',
  's10',
  's11',
  's12',
] as const;

type SlideKey = (typeof SLIDE_KEYS)[number];

function renderSlide(key: SlideKey, images: ReturnType<typeof getPaycesaImages>) {
  switch (key) {
    case 's1':
      return <Slide1 hero={images.hero} />;
    case 's2':
      return <Slide2 />;
    case 's3':
      return <Slide3 />;
    case 's4':
      return <Slide4 artisan={images.artisan} />;
    case 's5':
      return <Slide5 logistics={images.logistics} />;
    case 's6':
      return <Slide6 />;
    case 's7':
      return <Slide7 />;
    case 's8':
      return <Slide8 />;
    case 's9':
      return <Slide9 />;
    case 's10':
      return <Slide10 />;
    case 's11':
      return <Slide11 />;
    case 's12':
      return <Slide12 />;
  }
}

function slideShell(children: React.ReactNode, className = '') {
  return (
    <div
      className={`relative flex h-full min-h-[360px] flex-col bg-[color:var(--cream)] p-8 text-[color:var(--brown)] sm:p-10 md:p-14 ${className}`}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-[min(50%,400px)] w-[min(50%,400px)] bg-[radial-gradient(circle_at_top_right,rgba(230,126,34,0.12),transparent_70%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex h-full flex-1 flex-col">{children}</div>
    </div>
  );
}

function Slide1({ hero }: { hero: string }) {
  return (
    <div
      className="relative flex h-full min-h-[360px] flex-col items-center justify-center overflow-hidden bg-cover bg-center p-8 text-center sm:p-12"
      style={{ backgroundImage: `url('${hero}')` }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#3c201bcc] via-[#3c201b99] to-[#e67e2266]"
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
          Evolución Digital
        </h1>
        <p
          className="text-base uppercase tracking-[0.2em] text-[color:var(--amber)] sm:text-xl md:text-2xl"
          style={{ fontFamily: 'var(--font-paycesa-azeret), ui-monospace, monospace' }}
        >
          Estrategia de Crecimiento 2026
        </p>
        <p className="mt-4 max-w-xl text-lg text-white/90 sm:text-xl md:text-2xl">
          La Rueda Veladoras & Agentia AI
        </p>
      </div>
    </div>
  );
}

function Slide2() {
  return slideShell(
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <hr className="mb-6 h-1.5 w-24 border-0 bg-[color:var(--amber)]" />
      <h2 className="text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Del Espacio Físico al Éxito Virtual
      </h2>
      <p className="mt-6 max-w-3xl text-base leading-snug sm:text-lg md:text-xl">
        Una transición inteligente diseñada para maximizar la rentabilidad y automatizar la esencia de su
        marca.
      </p>
    </div>,
  );
}

function Slide3() {
  return slideShell(
    <>
      <h2 className="mb-6 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Retos de la Migración Digital
      </h2>
      <div className="flex flex-1 flex-col justify-center">
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-md sm:p-8">
            <h3 className="mb-3 text-xl font-bold text-[color:var(--amber)] sm:text-2xl">Logística de Entrega</h3>
            <p className="text-sm leading-snug sm:text-base md:text-lg">
              El desafío de concentrar entregas físicas en solo 3 días sin generar caos ni tiempos de espera
              innecesarios para el cliente.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-md sm:p-8">
            <h3 className="mb-3 text-xl font-bold text-[color:var(--amber)] sm:text-2xl">Escalabilidad Nacional</h3>
            <p className="text-sm leading-snug sm:text-base md:text-lg">
              La necesidad de una infraestructura que gestione envíos remotos de forma automática, permitiendo
              vender en todo México.
            </p>
          </div>
        </div>
      </div>
    </>,
  );
}

function Slide4({ artisan }: { artisan: string }) {
  return slideShell(
    <>
      <h2 className="mb-6 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Fase 1: Agendamiento Inteligente
      </h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 md:flex-row md:gap-12">
        <div className="w-full max-w-[280px] shrink-0 sm:max-w-[320px]">
          <div className="aspect-square overflow-hidden rounded-full border border-[color:var(--border)] shadow-md">
            <img src={artisan} alt="Producción artesanal de veladoras" className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-3 text-xl font-bold text-[color:var(--amber)] sm:text-2xl">Control de Citas Presenciales</h3>
          <p className="mb-4 text-sm leading-snug sm:text-base md:text-lg">
            Implementamos un sistema de IA que gestiona el calendario de sus 3 días presenciales de forma
            autónoma.
          </p>
          <p className="text-sm leading-snug sm:text-base md:text-lg">
            El cliente selecciona su horario ideal vía WhatsApp, recibiendo confirmaciones y recordatorios
            automáticos, garantizando una atención impecable y fluida.
          </p>
        </div>
      </div>
    </>,
  );
}

function Slide5({ logistics }: { logistics: string }) {
  return (
    <div className="grid h-full min-h-[360px] grid-cols-1 overflow-hidden rounded-[inherit] bg-[color:var(--cream)] md:grid-cols-2">
      <div className="flex flex-col justify-center p-8 text-[color:var(--brown)] sm:p-10 md:p-14">
        <h2 className="mb-4 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl">
          Fase 2: Logística Automatizada
        </h2>
        <p className="mb-4 text-sm leading-snug sm:text-base md:text-lg">
          Conectamos su Tiendanube directamente con <strong className="text-[color:var(--mahogany)]">WeShip</strong>{' '}
          para gestionar los pedidos de los 2 días remotos.
        </p>
        <p className="text-sm leading-snug sm:text-base md:text-lg">
          El sistema cotiza la guía más económica, genera la etiqueta y envía el número de rastreo al cliente por
          WhatsApp sin intervención manual.
        </p>
      </div>
      <div className="relative min-h-[200px] md:min-h-0">
        <img src={logistics} alt="Logística y envíos" className="h-full min-h-[220px] w-full object-cover md:min-h-full" />
      </div>
    </div>
  );
}

function iconTile(icon: React.ReactNode, title: string, body: string) {
  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-md sm:p-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3dd] text-[color:var(--amber)] sm:h-20 sm:w-20">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-[color:var(--amber)] sm:text-xl">{title}</h3>
      <p className="text-xs leading-snug text-[color:var(--brown)] sm:text-sm md:text-base">{body}</p>
    </div>
  );
}

function Slide6() {
  return slideShell(
    <>
      <h2 className="mb-6 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Infraestructura Agentia AI
      </h2>
      <div className="flex flex-1 flex-col justify-center gap-4 md:flex-row md:gap-6">
        {iconTile(
          <MessageCircle className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2} />,
          'WhatsApp Business',
          'Atención 24/7 con lenguaje humano, resolución de dudas sobre aromas y existencias.',
        )}
        {iconTile(
          <Instagram className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2} />,
          'Instagram Sales',
          'Automatización de comentarios y DMs para capturar el impulso de compra visual.',
        )}
        {iconTile(
          <CreditCard className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={2} />,
          'Pago Fluido',
          'Sincronización con sus terminales de Clip para facilitar cobros remotos y seguros.',
        )}
      </div>
    </>,
  );
}

function Slide7() {
  return slideShell(
    <>
      <h2 className="mb-4 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Comparativa de Operación
      </h2>
      <div className="flex flex-1 flex-col justify-center overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm md:text-base">
          <thead>
            <tr>
              <th className="bg-[color:var(--mahogany)] p-3 font-bold text-white sm:p-4">Proceso Operativo</th>
              <th className="bg-[color:var(--mahogany)] p-3 font-bold text-white sm:p-4">Estado Actual (Manual)</th>
              <th className="bg-[color:var(--mahogany)] p-3 font-bold text-white sm:p-4">Futuro con Agentia</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Agendamiento de citas', 'Mensajes manuales ida y vuelta', 'Auto-gestión 100% automatizada'],
              ['Generación de guías', 'Carga manual de datos en portal', 'Emisión automática vía API'],
              ['Seguimiento de pedidos', 'El cliente debe preguntar folio', 'Notificación activa al WhatsApp'],
              ['Atención en Redes', 'Depende de disponibilidad humana', 'Respuesta instantánea 24/7'],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-b border-[color:var(--border)]">
                <td className="p-3 font-semibold text-[color:var(--mahogany)] sm:p-4">{a}</td>
                <td className="p-3 sm:p-4">{b}</td>
                <td className="p-3 sm:p-4">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>,
  );
}

function Slide8() {
  return slideShell(
    <>
      <h2 className="mb-6 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        El Valor del Tiempo
      </h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
        <div className="text-center">
          <div className="text-6xl font-bold leading-none text-[color:var(--amber)] sm:text-8xl md:text-[150px]">
            100%
          </div>
          <p
            className="mt-2 font-bold text-[color:var(--mahogany)]"
            style={{ fontFamily: 'var(--font-paycesa-azeret), ui-monospace, monospace' }}
          >
            Disponibilidad
          </p>
        </div>
        <div className="max-w-xl">
          <h3 className="mb-3 text-xl font-bold text-[color:var(--amber)] sm:text-2xl">Capture cada oportunidad</h3>
          <p className="mb-4 text-sm leading-snug sm:text-base md:text-lg">
            Un cliente interesado un domingo a medianoche es una venta cerrada el lunes a primera hora.
          </p>
          <p className="text-sm leading-snug sm:text-base md:text-lg">
            Agentia asegura que ninguna consulta quede &quot;en visto&quot;, incrementando la tasa de conversión al
            responder en el momento exacto del deseo de compra.
          </p>
        </div>
      </div>
    </>,
  );
}

function Slide9() {
  return slideShell(
    <>
      <h2 className="mb-8 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Ruta de Implementación
      </h2>
      <div className="relative flex flex-1 flex-col justify-center">
        <div className="absolute left-0 right-0 top-1/2 z-0 hidden h-1 -translate-y-1/2 bg-[color:var(--border)] md:block" />
        <div className="relative z-[1] grid gap-8 md:grid-cols-3 md:gap-4">
          {[
            { t: 'Semana 1', d: 'Configuración del cerebro de IA y motor de citas presenciales.' },
            { t: 'Semana 2', d: 'Integración con Tiendanube y automatización WeShip.' },
            { t: 'Semana 3', d: 'Lanzamiento Omnicanal y optimización de flujos de pago.' },
          ].map((item) => (
            <div key={item.t} className="text-center">
              <div className="mx-auto mb-3 h-6 w-6 rounded-full border-4 border-[color:var(--cream)] bg-[color:var(--amber)]" />
              <h3 className="mb-2 text-lg font-bold text-[color:var(--mahogany)] sm:text-xl">{item.t}</h3>
              <p className="text-xs leading-snug sm:text-sm md:text-base">{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </>,
  );
}

function Slide10() {
  return slideShell(
    <>
      <h2 className="mb-8 border-l-8 border-[color:var(--amber)] pl-4 text-left text-2xl font-bold text-[color:var(--mahogany)] sm:text-3xl md:text-4xl">
        Eficiencia en la Gestión
      </h2>
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="shrink-0 text-sm font-bold text-[color:var(--mahogany)] sm:w-52 sm:text-base">
            Gestión Tradicional
          </span>
          <div className="h-10 flex-1 overflow-hidden rounded-full bg-[color:var(--border)]">
            <div
              className="flex h-full items-center justify-end bg-gradient-to-r from-[color:var(--amber)] to-[#D35400] pr-3 text-xs font-bold text-white sm:text-sm"
              style={{ width: '90%' }}
            >
              120 min / día
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="shrink-0 text-sm font-bold text-[color:var(--mahogany)] sm:w-52 sm:text-base">
            Gestión Agentia AI
          </span>
          <div className="h-10 flex-1 overflow-hidden rounded-full bg-[color:var(--border)]">
            <div
              className="flex h-full items-center justify-end bg-[color:var(--mahogany)] pr-3 text-xs font-bold text-white sm:text-sm"
              style={{ width: '15%' }}
            >
              18 min / día
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm italic sm:text-base md:text-lg">
          Liberamos más de 100 minutos diarios para que usted se enfoque en la creación y estrategia de sus
          productos.
        </p>
      </div>
    </>,
  );
}

function Slide11() {
  return slideShell(
    <div className="flex flex-1 flex-col justify-center px-2">
      <blockquote className="relative text-center text-xl font-medium italic leading-snug text-[color:var(--mahogany)] sm:text-2xl md:text-4xl">
        <span className="pointer-events-none absolute -left-1 -top-8 text-7xl text-[color:var(--amber)] opacity-30 sm:-left-2 sm:text-9xl">
          “
        </span>
        La verdadera innovación no es cambiar lo que hacemos, sino potenciar cómo lo hacemos a través de la
        tecnología.
      </blockquote>
      <p className="mt-8 text-center text-lg font-bold text-[color:var(--amber)] sm:text-xl">
        — Alianza Estratégica 2026
      </p>
    </div>,
  );
}

function Slide12() {
  return slideShell(
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <h2 className="text-3xl font-bold text-[color:var(--mahogany)] sm:text-5xl md:text-6xl">¿Listos para brillar?</h2>
      <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl">
        Estamos listos para transformar la logística de <strong>La Rueda Veladoras</strong>.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4">
        <a
          href={AGENTIA_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-xl font-bold text-[color:var(--mahogany)] transition hover:text-[color:var(--amber)] sm:text-2xl"
        >
          <MessageCircle className="h-8 w-8 text-[color:var(--amber)]" />
          {AGENTIA_WHATSAPP_DISPLAY}
        </a>
        <a
          href="https://agentia.software"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-xl font-bold text-[color:var(--mahogany)] transition hover:text-[color:var(--amber)] sm:text-2xl"
        >
          <Globe className="h-8 w-8 text-[color:var(--amber)]" />
          agentia.software
        </a>
      </div>
    </div>,
  );
}
