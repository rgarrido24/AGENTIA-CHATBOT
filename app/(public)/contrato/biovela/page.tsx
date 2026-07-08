import type { Metadata } from 'next';
import { BiovelaContratoForm } from './BiovelaContratoForm';

export const metadata: Metadata = {
  title: 'Contrato de servicio — Biovela × Agentia',
  description: 'Contrato de chatbot WhatsApp y panel CRM para La Rueda Veladoras (Biovela).',
  robots: { index: false, follow: false },
};

const PROVIDER = {
  nombre: 'Rodolfo Saturnino Garrido Gómez',
  rfc: 'GAGR880814AS1',
  actividad: 'Servicios de tecnología y marketing digital',
  marca: 'Agentia Software',
  sitio: 'agentia.software',
};

const CLIENT = {
  nombre: 'La Rueda Veladoras',
  marca: 'Biovela',
  sitio: 'biovela2.mitiendanube.com',
};

const FEATURES = [
  'Chatbot IA para WhatsApp (catálogo y ventas)',
  'Panel CRM de conversaciones y leads',
  'Flujo de citas para recolección en tienda',
  'Integración con Google Calendar',
  'Soporte técnico incluido',
];

export default function BiovelaContratoPage() {
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + 1);

  return (
    <main
      className="flex min-h-screen items-start justify-center px-4 py-12"
      style={{ background: '#0E0B07', color: '#F2EDE4', fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=DM+Sans:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/biovela.png"
            alt="Biovela"
            className="mx-auto h-14 w-14 rounded-full object-cover"
          />
          <div>
            <h1
              className="text-2xl font-light tracking-wide"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Contrato de servicio
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#8A7660' }}>
              {CLIENT.marca} × Agentia Software
            </p>
          </div>
        </div>

        <div
          className="space-y-3 rounded-2xl border p-5"
          style={{ background: '#1A1410', borderColor: '#2E2520' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
            PROVEEDOR
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Nombre</dt>
              <dd>{PROVIDER.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>RFC</dt>
              <dd>{PROVIDER.rfc}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Actividad</dt>
              <dd>{PROVIDER.actividad}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Marca comercial</dt>
              <dd>{PROVIDER.marca}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Sitio</dt>
              <dd>
                <a
                  href={`https://${PROVIDER.sitio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#E8962A]/50 underline-offset-2"
                  style={{ color: '#E8962A' }}
                >
                  {PROVIDER.sitio}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div
          className="space-y-3 rounded-2xl border p-5"
          style={{ background: '#1A1410', borderColor: '#2E2520' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
            CLIENTE
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Razón social / nombre comercial</dt>
              <dd>{CLIENT.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Marca</dt>
              <dd>{CLIENT.marca}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: '#8A7660' }}>Tienda</dt>
              <dd>
                <a
                  href={`https://${CLIENT.sitio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#E8962A]/50 underline-offset-2"
                  style={{ color: '#E8962A' }}
                >
                  {CLIENT.sitio}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div
          className="space-y-4 rounded-2xl border p-5"
          style={{ background: '#1A1410', borderColor: '#2E2520' }}
        >
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
              PLAN CONTRATADO
            </p>
            <p className="text-lg font-medium">Plan Biovela</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: '#E8962A' }}>
              $999 MXN / mes
            </p>
            <p className="mt-1 text-xs" style={{ color: '#8A7660' }}>
              Suscripción recurrente mensual vía Stripe
            </p>
          </div>
          <ul className="space-y-1.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: '#8A7660' }}>
                <span style={{ color: '#E8962A' }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="rounded-2xl border p-5"
          style={{ background: '#1A1410', borderColor: '#2E2520' }}
        >
          <p className="text-xs font-semibold tracking-widest" style={{ color: '#8A7660' }}>
            COBRO
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm">Primer cobro (hoy)</span>
            <span className="text-lg font-semibold" style={{ color: '#E8962A' }}>
              $999 MXN
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: '#2E2520' }}>
            <span className="text-sm" style={{ color: '#8A7660' }}>
              Renovación automática
            </span>
            <span className="text-sm">
              {renewal.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <BiovelaContratoForm />
      </div>
    </main>
  );
}
