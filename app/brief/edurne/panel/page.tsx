'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

type BriefData = Record<string, unknown> & {
  nombre?: string;
  telefono?: string;
  email?: string;
  redes?: string;
  objetivos?: string[];
  publicoEdad?: string;
  publicoSexo?: string;
  publicoUbicacion?: string;
  publicoNecesidades?: string;
  productoQueEs?: string;
  productoPrecio?: string;
  productoIncluye?: string;
  diferenciador?: string;
  testimonios?: string;
  material?: string[];
  estructura?: string[];
  cta?: string;
  estiloVisual?: string;
  colores?: string;
  referenciasVisuales?: string;
  competencia?: string;
  paginasGusto?: string;
  dominio?: string;
  hosting?: string;
  integraciones?: string;
  objetivoFinal?: string;
};

type BriefRow = {
  id: string;
  createdAt: string | null;
  completedAt: string | null;
  objetivosLabels: string;
  data: BriefData;
};

const MATERIAL_LABELS: Record<string, string> = {
  logo: 'Logo',
  fotos: 'Fotos',
  videos: 'Videos',
  textos: 'Textos',
};

const STRUCTURE_LABELS: Record<string, string> = {
  hero: 'Hero',
  beneficios: 'Beneficios',
  servicios: 'Servicios',
  precios: 'Precios',
  testimonios: 'Testimonios',
  galeria: 'Galería',
  faq: 'FAQ',
  contacto: 'Contacto',
  mapa: 'Mapa',
  whatsapp_flotante: 'WhatsApp flotante',
};

const STYLE_LABELS: Record<string, string> = {
  elegante: 'Elegante',
  minimalista: 'Minimalista',
  premium: 'Premium',
  calida: 'Cálida',
};

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function asList(v: unknown, labels?: Record<string, string>): string {
  if (!Array.isArray(v) || v.length === 0) return '—';
  return v.map((x) => labels?.[String(x)] || String(x)).join(', ');
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value || !String(value).trim()) return null;
  return (
    <div className="border-b border-white/5 py-2.5 last:border-0">
      <p className="text-[11px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-white/90">{value}</p>
    </div>
  );
}

export default function EdurneBriefPanelPage() {
  const [briefs, setBriefs] = useState<BriefRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/brief/edurne', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((json as { error?: string }).error || 'No se pudieron cargar los briefs');
        return;
      }
      const items = ((json as { briefs?: BriefRow[] }).briefs ?? []) as BriefRow[];
      setBriefs(items);
      setSelectedId((prev) => {
        if (prev && items.some((b) => b.id === prev)) return prev;
        return items[0]?.id ?? null;
      });
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => briefs.find((b) => b.id === selectedId) ?? null,
    [briefs, selectedId]
  );
  const d = selected?.data;

  return (
    <main
      className="min-h-[100dvh] text-white"
      style={{
        background:
          'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(0,212,255,0.12), transparent 50%), #050508',
      }}
    >
      <header className="border-b border-white/10 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
              Agentia × Edurne
            </p>
            <h1 className="text-xl font-bold">Panel de briefs</h1>
            <p className="text-xs text-white/45">{briefs.length} brief(s) recibidos</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/brief/edurne"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              <ExternalLink className="h-4 w-4" />
              Formulario público
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-white/40">
            Lista
          </div>
          {loading && briefs.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : briefs.length === 0 ? (
            <p className="p-4 text-sm text-white/50">Aún no hay briefs guardados.</p>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto">
              {briefs.map((b) => {
                const active = b.id === selectedId;
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(b.id)}
                      className={`w-full border-b border-white/5 px-4 py-3 text-left transition ${
                        active ? 'bg-cyan-500/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <p className="truncate font-medium text-white">
                        {b.data.nombre || 'Sin nombre'}
                      </p>
                      <p className="truncate text-xs text-white/45">
                        {b.data.telefono || b.data.email || '—'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-cyan-200/70">
                        {b.objetivosLabels || 'Sin objetivos'}
                      </p>
                      <p className="mt-1 text-[11px] text-white/30">{fmtWhen(b.createdAt)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          {!selected || !d ? (
            <div className="flex h-40 items-center justify-center text-sm text-white/45">
              Selecciona un brief
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-bold">{d.nombre}</h2>
                  <p className="text-sm text-white/50">{fmtWhen(selected.createdAt)}</p>
                </div>
                <a
                  href={`https://wa.me/${String(d.telefono || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  WhatsApp cliente
                </a>
              </div>

              <div className="space-y-0">
                <Row label="Teléfono" value={d.telefono} />
                <Row label="Email" value={d.email} />
                <Row label="Redes" value={d.redes} />
                <Row label="Objetivos" value={selected.objetivosLabels} />
                <Row
                  label="Público"
                  value={[d.publicoEdad, d.publicoSexo, d.publicoUbicacion]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <Row label="Necesidades" value={d.publicoNecesidades} />
                <Row label="Producto / servicio" value={d.productoQueEs} />
                <Row label="Precio" value={d.productoPrecio} />
                <Row label="Incluye" value={d.productoIncluye} />
                <Row label="Diferenciador" value={d.diferenciador} />
                <Row label="Testimonios" value={d.testimonios} />
                <Row label="Material" value={asList(d.material, MATERIAL_LABELS)} />
                <Row label="Estructura" value={asList(d.estructura, STRUCTURE_LABELS)} />
                <Row label="CTA" value={d.cta} />
                <Row
                  label="Estilo visual"
                  value={STYLE_LABELS[String(d.estiloVisual || '')] || d.estiloVisual}
                />
                <Row label="Colores" value={d.colores} />
                <Row label="Referencias visuales" value={d.referenciasVisuales} />
                <Row label="Competencia" value={d.competencia} />
                <Row label="Páginas que le gustan" value={d.paginasGusto} />
                <Row label="Dominio" value={d.dominio} />
                <Row label="Hosting" value={d.hosting} />
                <Row label="Integraciones" value={d.integraciones} />
                <Row label="Objetivo final" value={d.objetivoFinal} />
                <Row label="ID" value={selected.id} />
              </div>

              <Link
                href="/brief/edurne"
                className="mt-6 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al formulario
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
