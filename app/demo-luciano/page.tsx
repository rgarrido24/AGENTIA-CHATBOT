'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Estado = 'nuevo' | 'contactado' | 'en_seguimiento';

type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  utm_campaign: string;
  estado: Estado;
  createdAt: Date;
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

const CAMPAIGNS = {
  'Emprendedores Córdoba 2026': { color: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  'Inmuebles Centro':           { color: '#2563eb', bg: '#dbeafe', text: '#1d4ed8' },
  'Servicios Profesionales':    { color: '#ea580c', bg: '#ffedd5', text: '#c2410c' },
} as const;

type Campaign = keyof typeof CAMPAIGNS;

// ─── Initial 6 leads (hardcoded, no DB) ──────────────────────────────────────

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3_600_000);
}

const INITIAL_LEADS: Lead[] = [
  { id: 'i1', nombre: 'Nicolás Romero',     telefono: '5493515491823', correo: 'nico.romero@gmail.com',    utm_campaign: 'Inmuebles Centro',             estado: 'en_seguimiento', createdAt: hoursAgo(58) },
  { id: 'i2', nombre: 'Agustina López',     telefono: '5493516845201', correo: 'agus.lopez@hotmail.com',   utm_campaign: 'Servicios Profesionales',       estado: 'contactado',     createdAt: hoursAgo(44) },
  { id: 'i3', nombre: 'Camila Pereyra',     telefono: '5493515103678', correo: 'cami.pereyra@gmail.com',   utm_campaign: 'Emprendedores Córdoba 2026',    estado: 'contactado',     createdAt: hoursAgo(26) },
  { id: 'i4', nombre: 'Tomás Álvarez',      telefono: '5493513278934', correo: 'tomas.alvarez@gmail.com',  utm_campaign: 'Inmuebles Centro',             estado: 'en_seguimiento', createdAt: hoursAgo(19) },
  { id: 'i5', nombre: 'Valentina Ferreyra', telefono: '5493513901456', correo: 'vale.ferreyra@gmail.com',  utm_campaign: 'Emprendedores Córdoba 2026',    estado: 'nuevo',          createdAt: hoursAgo(3)  },
  { id: 'i6', nombre: 'Matías Herrera',     telefono: '5493516582047', correo: 'mati.herrera@outlook.com', utm_campaign: 'Servicios Profesionales',       estado: 'nuevo',          createdAt: hoursAgo(1)  },
];

// ─── Lead generator pool ──────────────────────────────────────────────────────

const NAME_POOL = [
  'Facundo González',  'Julieta Martínez',  'Lucas Rossi',       'Sofía Díaz',
  'Rodrigo Fernández', 'Micaela Castro',    'Ignacio Pérez',     'Florencia Gómez',
  'Santiago Molina',   'Luciana Torres',    'Franco Ramírez',    'Daniela Medina',
  'Ezequiel Silva',    'Carolina Morales',  'Maximiliano Ruiz',  'Aldana Vega',
  'Leandro Suárez',    'Natalia Bustos',    'Pablo Cisneros',    'Abril Herrera',
];

const CAMPAIGN_KEYS = Object.keys(CAMPAIGNS) as Campaign[];
const DOMAINS       = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar'];

let _idCounter = 100;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
}

function generateLead(): Lead {
  const nombre = rand(NAME_POOL);
  const suffix = Math.floor(1_000_000 + Math.random() * 9_000_000);
  return {
    id:           `g${++_idCounter}`,
    nombre,
    telefono:     `549351${suffix}`,
    correo:       `${slug(nombre)}@${rand(DOMAINS)}`,
    utm_campaign: rand(CAMPAIGN_KEYS),
    estado:       'nuevo',
    createdAt:    new Date(),
  };
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function waUrl(tel: string) {
  return `https://wa.me/${tel.replace(/\D/g, '')}`;
}

function formatPhone(tel: string) {
  const d = tel.replace(/\D/g, '');
  // 54 9 351 XXXXXXX → positions: 0-1=54, 2=9, 3-5=351, 6-12=local(7 digits)
  if (d.startsWith('5493') && d.length === 13) {
    return `+54 351 ${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return `+${d}`;
}

function timeAgo(date: Date) {
  const s = (Date.now() - date.getTime()) / 1000;
  if (s < 90)     return 'hace un momento';
  if (s < 3600)   return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400)  return `hace ${Math.floor(s / 3600)} h`;
  if (s < 172800) return 'ayer';
  return `hace ${Math.floor(s / 86400)} días`;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function playBeep() {
  try {
    type WA = typeof window & { webkitAudioContext?: typeof AudioContext };
    const AC = window.AudioContext || (window as WA).webkitAudioContext;
    if (!AC) return;
    const ctx  = new AC();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 820;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.22);
    ctx.close();
  } catch { /* silent */ }
}

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADO_NEXT: Record<Estado, Estado> = {
  nuevo: 'contactado', contactado: 'en_seguimiento', en_seguimiento: 'nuevo',
};
const ESTADO_LABEL: Record<Estado, string> = {
  nuevo: 'Nuevo', contactado: 'Contactado', en_seguimiento: 'En seguimiento',
};
const ESTADO_STYLE: Record<Estado, string> = {
  nuevo:          'bg-green-100 text-green-700',
  contactado:     'bg-blue-100  text-blue-700',
  en_seguimiento: 'bg-amber-100 text-amber-700',
};

// ─── KPI Box ──────────────────────────────────────────────────────────────────

function KpiBox({ label, value, bump }: { label: string; value: number; bump?: boolean }) {
  return (
    <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm px-2 py-3 text-center">
      <p
        key={bump ? value : 0}
        className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums"
        style={bump ? { animation: 'countBump 0.4s ease' } : undefined}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{label}</p>
    </div>
  );
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  isNew,
  onEstadoChange,
}: {
  lead: Lead;
  isNew: boolean;
  onEstadoChange: (id: string, next: Estado) => void;
}) {
  const [expanded, setExpanded]       = useState(false);
  const [estado, setEstado]           = useState<Estado>(lead.estado);
  const cs = CAMPAIGNS[lead.utm_campaign as Campaign] ?? { color: '#6b7280', bg: '#f3f4f6', text: '#374151' };

  const cycleEstado = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = ESTADO_NEXT[estado];
    setEstado(next);
    onEstadoChange(lead.id, next);
  };

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow duration-300 ${
        isNew
          ? 'border-green-300 shadow-[0_0_0_3px_rgba(22,163,74,0.12)]'
          : 'border-gray-100 shadow-sm'
      }`}
      style={isNew ? { animation: 'slideDown 0.4s cubic-bezier(0.34,1.5,0.64,1)' } : undefined}
    >
      <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded((p) => !p)}>
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
          style={{ background: cs.color }}
        >
          {initials(lead.nombre)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 font-bold text-[15px] leading-snug">{lead.nombre}</span>
            {isNew && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white animate-pulse">
                ● NUEVO
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-gray-500 text-xs">{formatPhone(lead.telefono)}</span>
            <a
              href={waUrl(lead.telefono)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: '#16a34a' }}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cs.bg, color: cs.text }}
            >
              {lead.utm_campaign}
            </span>
            <span className="text-gray-400 text-[10px]">{timeAgo(lead.createdAt)}</span>
          </div>
        </div>

        {/* Estado + chevron */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={cycleEstado}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLE[estado]}`}
          >
            {ESTADO_LABEL[estado]}
          </button>
          {expanded
            ? <ChevronUp   className="w-4 h-4 text-gray-300 mt-0.5" />
            : <ChevronDown className="w-4 h-4 text-gray-300 mt-0.5" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <dl className="mt-3 space-y-1.5">
            {([
              ['Email',   lead.correo],
              ['Anuncio', lead.utm_campaign],
              ['Llegó',   lead.createdAt.toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-xs">
                <dt className="text-gray-400 shrink-0">{k}</dt>
                <dd className="text-gray-700 font-medium text-right truncate max-w-[200px]" title={v}>{v}</dd>
              </div>
            ))}
          </dl>
          <a
            href={waUrl(lead.telefono)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: '#16a34a' }}
          >
            <MessageCircle className="w-4 h-4" />
            Abrir WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoLucianoPage() {
  const [leads, setLeads]       = useState<Lead[]>(INITIAL_LEADS);
  const [newIds, setNewIds]     = useState<Set<string>>(new Set());
  const [totalBump, setTotalBump] = useState(false);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-generate leads: first at 8s, then every 25-35s
  useEffect(() => {
    const fire = (delay: number) => {
      timerRef.current = setTimeout(() => {
        const lead = generateLead();

        setLeads((prev) => [lead, ...prev]);

        setNewIds((prev) => new Set([...prev, lead.id]));
        setTotalBump(true);
        setTimeout(() => setTotalBump(false), 400);
        setTimeout(() => setNewIds((prev) => { const n = new Set(prev); n.delete(lead.id); return n; }), 6000);

        playBeep();
        fire(25_000 + Math.random() * 10_000);
      }, delay);
    };

    fire(8_000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Estado change — local only (no DB)
  const handleEstadoChange = useCallback((_id: string, _next: Estado) => {
    // estado is managed inside each LeadCard via its own useState
  }, []);

  // KPIs
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week  = new Date(); week.setHours(0, 0, 0, 0); week.setDate(week.getDate() - week.getDay());
  const totalHoy    = leads.filter((l) => l.createdAt >= today).length;
  const totalSemana = leads.filter((l) => l.createdAt >= week).length;
  const contactados = leads.filter((l) => l.estado !== 'nuevo').length;

  // ── Time refresh: re-render every 60s so "hace X min" stays accurate
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes countBump {
          0%   { transform: scale(1.35); color: #16a34a; }
          100% { transform: scale(1);    color: inherit; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-gray-900 font-bold text-base leading-tight">Panel de Leads — Demo</h1>
              <p className="text-gray-400 text-xs">Córdoba, Argentina · actualización automática</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span
                key={totalBump ? leads.length : 0}
                className="text-green-700 text-xs font-semibold"
                style={totalBump ? { animation: 'countBump 0.4s ease' } : undefined}
              >
                {leads.length} leads
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-16 space-y-4">

          {/* KPIs */}
          <div className="flex gap-2">
            <KpiBox label="Total"       value={leads.length} bump={totalBump} />
            <KpiBox label="Hoy"         value={totalHoy} />
            <KpiBox label="Esta semana" value={totalSemana} />
            <KpiBox label="Contactados" value={contactados} />
          </div>

          {/* Lead cards */}
          <div className="space-y-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isNew={newIds.has(lead.id)}
                onEstadoChange={handleEstadoChange}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
