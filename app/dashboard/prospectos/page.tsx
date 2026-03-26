'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Upload, Send, Search, RefreshCw, X, Check,
  Phone, MapPin, User, MessageSquare, Eye, Trash2, Edit3,
  Download, Plus,
} from 'lucide-react';
import {
  GIRO_OPTIONS,
  CANAL_ORIGEN_OPTIONS,
  PIPELINE_DEFAULT,
  coercePipeline,
  coerceGiro,
  coerceCanalOrigen,
  type ProspectoPipeline,
  type ProspectoGiro,
  type ProspectoCanalOrigen,
} from '@/lib/prospectos-constants';

// ─── Types ───────────────────────────────────────────────────────────────────

type Prospecto = {
  id: string;
  nombre: string;
  propietario: string;
  ubicacion: string;
  telefono: string;
  correo: string;
  demo: string;
  lote: string;
  pipeline: ProspectoPipeline;
  giro: ProspectoGiro | string;
  canalOrigen: ProspectoCanalOrigen | string;
  status: string;
  asignadoA: string;
  contactadoAt: string | null;
  contactadoPor: string;
  plantillaEnviada: string;
  mensajesEnviados: number;
  demoAbierta: boolean;
  demoAbiertaAt: string | null;
  notas: string;
  trackToken: string;
  createdAt: string | null;
};

type Stats = {
  total: number; pendiente: number; contactado: number; demo_vista: number;
  interesado: number; negociacion: number; cerrado: number; no_interesado: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const VENDEDORES = ['Rodolfo', 'Vendedor 2', 'Vendedor 3'];

const STATUS_OPTIONS = [
  { value: 'pendiente',      label: 'Pendiente',      color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { value: 'contactado',     label: 'Contactado',     color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'demo_vista',     label: 'Demo Vista',     color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { value: 'interesado',     label: 'Interesado',     color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'negociacion',    label: 'Negociación',    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { value: 'cerrado',        label: 'Cerrado ✓',      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'no_interesado',  label: 'No Interesado',  color: 'bg-red-500/20 text-red-300 border-red-500/30' },
];

const PLANTILLAS = [
  { value: 'intro_a',    label: '👋 Intro A — El Dolor (identifica el problema)' },
  { value: 'intro_b',    label: '🎣 Intro B — El Gancho (curiosidad + humor)' },
  { value: 'intro_c',    label: '🚀 Intro C — La Solución (valor directo)' },
  { value: 'seguimiento', label: '🔄 Seguimiento (no respondió)' },
  { value: 'cierre',     label: '🎯 Cierre (ya vio la demo)' },
];

// Preview de cada plantilla (con placeholders visibles)
const PLANTILLA_PREVIEW: Record<string, string> = {
  intro_a: `Hola [Negocio] 👋\n\n¿Cuántas veces se te quedan mensajes sin contestar cuando estás con un cliente o ya cerraste?\n\nEso son ventas que se van solas 😔\n\nNosotros lo resolvemos: un asistente de IA que agenda, cotiza y responde por WhatsApp las 24 hrs, aunque estés dormido.\n\nMira cómo funcionaría en tu negocio 👇\n[link de seguimiento]\n\n— [Vendedor], Agentia AI`,

  intro_b: `Hola [Negocio] 👋, soy [Vendedor].\n\nUna pregunta rápida — si tuvieras un empleado que:\n• Contesta WhatsApp a las 2am ✅\n• Agenda citas solo ✅\n• Nunca se enferma ni pide aumento 😄\n\n¿Lo contratarías?\n\nEso es exactamente lo que hacemos. Mira la demo:\n[link de seguimiento]\n\n¿Platicamos? 🚀`,

  intro_c: `Hola [Negocio] 🙌\n\n¿Ya viste lo que hacen los negocios que más crecen?\n\nEstán usando IA en WhatsApp para:\n✅ Agendar citas automático\n✅ Responder dudas a cualquier hora\n✅ No dejar a ningún cliente en visto\n\nTe armé una demo para que lo veas en acción:\n[link de seguimiento]\n\n— [Vendedor]`,

  seguimiento: `Hola [Negocio] 😊\n\n¿Tuviste oportunidad de ver la demo del chatbot que te compartí?\n\nSi tienes alguna duda o quieres que te explique cómo funcionaría específicamente en tu negocio, con gusto lo hacemos.\n\n— [Vendedor]`,

  cierre: `Hola [Negocio], soy [Vendedor] 👋\n\n¿Qué te pareció la demo del chatbot? 🤖\n\nEsta semana tenemos disponibilidad para hacer la instalación personalizada para tu negocio — sin compromisos, en menos de una hora queda funcionando.\n\n¿Platicamos esta semana? 📅`,
};

const statusInfo = (s: string) => STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];

const GIRO_EMOJI: Record<string, string> = {
  Barbería: '✂️',
  'Spa & Estética': '💆',
  Grooming: '🐾',
  'Clínica Dental': '🦷',
  Médico: '👨‍⚕️',
  Restaurante: '🍔',
  'Taller Mecánico': '🔧',
  Nutriólogo: '🥗',
  Inmobiliaria: '🏠',
  Telecomunicaciones: '📡',
  Otro: '📋',
};

function giroEmoji(giro: string): string {
  return GIRO_EMOJI[giro] ?? '📋';
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function normalizeHeader(h: string) {
  return h.trim().toLowerCase()
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i')
    .replace(/[óò]/g, 'o').replace(/[úù]/g, 'u')
    .replace(/\s*\([^)]*\)/g, '')   // quita "(WhatsApp)", "(Mérida)", etc.
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function normalizePhone(raw: string): string {
  // Extrae número de links wa.me/52XXXXXXXXXX
  const waMatch = raw.match(/wa\.me\/(\d+)/i);
  if (waMatch) return waMatch[1];
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(sep).map(normalizeHeader);
  return lines.slice(1).map((line) => {
    const vals = line.split(sep);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''); });
    return row;
  });
}

type MappedImportRow = {
  nombre: string;
  propietario: string;
  ubicacion: string;
  telefono: string;
  correo: string;
  pipeline: string;
  giro: string;
  canalOrigen: string;
};

function mapRow(row: Record<string, string>): MappedImportRow {
  const keys = Object.keys(row);
  const fuzzy = (...candidates: string[]) => {
    for (const c of candidates) {
      if (row[c]) return row[c];
    }
    for (const c of candidates) {
      const found = keys.find((k) => k.includes(c));
      if (found && row[found]) return row[found];
    }
    return '';
  };
  return {
    nombre: fuzzy('nombre', 'negocio', 'estetica', 'empresa', 'name'),
    propietario: fuzzy('propietario', 'dueno', 'owner', 'contacto'),
    ubicacion: fuzzy('ubicacion', 'direccion', 'location', 'ciudad', 'municipio'),
    telefono: normalizePhone(fuzzy('telefono', 'tel', 'phone', 'celular', 'movil', 'whatsapp')),
    correo: fuzzy('correo', 'email', 'mail'),
    pipeline: fuzzy('pipeline'),
    giro: fuzzy('giro', 'demo', 'tipo', 'categoria'),
    canalOrigen: fuzzy('canal_origen', 'canal', 'origen'),
  };
}

type AddFormState = {
  nombre: string;
  propietario: string;
  ubicacion: string;
  telefono: string;
  correo: string;
  demo: string;
  lote: string;
  pipeline: ProspectoPipeline;
  giro: ProspectoGiro;
  canalOrigen: ProspectoCanalOrigen;
};

const emptyAddForm = (): AddFormState => ({
  nombre: '',
  propietario: '',
  ubicacion: '',
  telefono: '',
  correo: '',
  demo: 'barberia',
  lote: '',
  pipeline: PIPELINE_DEFAULT,
  giro: 'Otro',
  canalOrigen: 'Manual',
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProspectosPage() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pendiente: 0,
    contactado: 0,
    demo_vista: 0,
    interesado: 0,
    negociacion: 0,
    cerrado: 0,
    no_interesado: 0,
  });
  const [lotes, setLotes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLote, setFilterLote] = useState<string>('');
  const [filterVendedor, setFilterVendedor] = useState<string>('');
  /** Pestaña inicial: Agentia (no Izzi). */
  const [pipelineSelected, setPipelineSelected] = useState<ProspectoPipeline>('Agentia');
  const [filterGiro, setFilterGiro] = useState<string>('');
  const [filterCanal, setFilterCanal] = useState<string>('');
  const [currentVendedor, setCurrentVendedor] = useState<string>(VENDEDORES[0]);

  // Modals
  const [importModal, setImportModal] = useState<boolean>(false);
  const [messageModal, setMessageModal] = useState<boolean>(false);
  const [editModal, setEditModal] = useState<Prospecto | null>(null);
  const [addModal, setAddModal] = useState<boolean>(false);

  // Import state
  const [importText, setImportText] = useState<string>('');
  const [importLote, setImportLote] = useState<string>('Lote 1');
  const [importDemo, setImportDemo] = useState<string>('barberia');
  const [importPreview, setImportPreview] = useState<MappedImportRow[]>([]);
  const [importing, setImporting] = useState<boolean>(false);

  // Message state
  const [plantilla, setPlantilla] = useState<string>('intro_a');
  const [batchSize, setBatchSize] = useState<number>(10);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sentResult, setSentResult] = useState<{ queued: number; minutes: number } | null>(null);

  // Edit state
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNotas, setEditNotas] = useState<string>('');
  const [editAsignado, setEditAsignado] = useState<string>('');
  const [editLote, setEditLote] = useState<string>('');
  const [editPipeline, setEditPipeline] = useState<ProspectoPipeline>(PIPELINE_DEFAULT);
  const [editGiro, setEditGiro] = useState<ProspectoGiro>('Otro');
  const [editCanal, setEditCanal] = useState<ProspectoCanalOrigen>('Manual');
  const [saving, setSaving] = useState<boolean>(false);

  const [addForm, setAddForm] = useState<AddFormState>(emptyAddForm);
  const [adding, setAdding] = useState<boolean>(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchProspectos = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('pipeline', pipelineSelected);
    if (filterStatus) params.set('status', filterStatus);
    if (filterLote) params.set('lote', filterLote);
    if (filterVendedor) params.set('vendedor', filterVendedor);
    if (filterGiro) params.set('giro', filterGiro);
    if (filterCanal) params.set('canalOrigen', filterCanal);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/prospectos?${params}`);
      const data = await res.json();
      if (data.ok) {
        setProspectos(data.prospectos as Prospecto[]);
        setStats(data.stats as Stats);
        setLotes(data.lotes as string[]);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterLote, filterVendedor, filterGiro, filterCanal, search, pipelineSelected]);

  useEffect(() => {
    fetchProspectos();
  }, [fetchProspectos]);

  useEffect(() => {
    setSelected(new Set());
  }, [pipelineSelected]);

  // ─── Import ───────────────────────────────────────────────────────────────

  const handleImportText = (text: string) => {
    setImportText(text);
    const rows = parseCSV(text);
    setImportPreview(rows.map(mapRow).filter((r) => r.nombre || r.telefono));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleImportText(ev.target?.result as string || '');
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (!importPreview.length) return;
    setImporting(true);
    try {
      const res = await fetch('/api/prospectos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: importPreview,
          lote: importLote,
          demo: importDemo,
          defaultPipeline: pipelineSelected,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const ins = typeof data.insertados === 'number' ? data.insertados : 0;
        const dup = typeof data.duplicados === 'number' ? data.duplicados : 0;
        const err = typeof data.errores === 'number' ? data.errores : 0;
        alert(`Importación lista: ${ins} insertados · ${dup} duplicados omitidos · ${err} filas con error`);
        setImportModal(false);
        setImportText('');
        setImportPreview([]);
        fetchProspectos();
      } else {
        const ins = typeof data.insertados === 'number' ? data.insertados : 0;
        const dup = typeof data.duplicados === 'number' ? data.duplicados : 0;
        const err = typeof data.errores === 'number' ? data.errores : 0;
        alert(data.error || `Error al importar (${ins}/${dup}/${err})`);
      }
    } finally {
      setImporting(false);
    }
  };

  // ─── Message ──────────────────────────────────────────────────────────────

  const handleSendMessages = async () => {
    if (!selected.size) return;
    setSending(true);
    setSentResult(null);
    try {
      const res = await fetch('/api/prospectos/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selected),
          plantilla,
          vendedor: currentVendedor,
          baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
          batchSize,
          mediaUrl: mediaUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSentResult({ queued: data.queued, minutes: data.minutesTotal ?? 0 });
        setSelected(new Set());
        fetchProspectos();
      } else { alert(data.error || 'Error al enviar'); }
    } finally { setSending(false); }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────────

  const openEdit = (p: Prospecto) => {
    setEditModal(p);
    setEditStatus(p.status);
    setEditNotas(p.notas);
    setEditAsignado(p.asignadoA);
    setEditLote(p.lote);
    setEditPipeline(coercePipeline(p.pipeline));
    setEditGiro(coerceGiro(p.giro));
    setEditCanal(coerceCanalOrigen(p.canalOrigen));
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await fetch('/api/prospectos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.id,
          status: editStatus,
          notas: editNotas,
          asignadoA: editAsignado,
          lote: editLote,
          pipeline: editPipeline,
          giro: editGiro,
          canalOrigen: editCanal,
        }),
      });
      setEditModal(null);
      fetchProspectos();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este prospecto?')) return;
    await fetch(`/api/prospectos/status?id=${id}`, { method: 'DELETE' });
    fetchProspectos();
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`¿Eliminar ${selected.size} prospecto(s) seleccionados? Esta acción no se puede deshacer.`)) return;
    await fetch('/api/prospectos/status', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    fetchProspectos();
  };

  const handleDeleteAll = async () => {
    const scope = filterLote
      ? `del lote "${filterLote}" (pipeline ${pipelineSelected})`
      : `del pipeline ${pipelineSelected} (${stats.total} visibles en filtros actuales)`;
    const confirmText = prompt(
      `⚠️ Esto borrará todos los prospectos ${scope}.\n\nEscribe BORRAR TODO para confirmar:`
    );
    if (confirmText !== 'BORRAR TODO') {
      alert('Cancelado.');
      return;
    }
    await fetch('/api/prospectos/status', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deleteAll: true,
        pipeline: pipelineSelected,
        ...(filterLote ? { lote: filterLote } : {}),
      }),
    });
    setSelected(new Set());
    fetchProspectos();
  };

  // ─── Add single ───────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!addForm.nombre || !addForm.telefono) return;
    setAdding(true);
    try {
      const res = await fetch('/api/prospectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          pipeline: addForm.pipeline || pipelineSelected,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddModal(false);
        setAddForm({
          ...emptyAddForm(),
          pipeline: pipelineSelected,
        });
        fetchProspectos();
      } else alert(data.error);
    } finally { setAdding(false); }
  };

  // ─── Export CSV ───────────────────────────────────────────────────────────

  const handleExport = () => {
    const headers =
      'Nombre,Propietario,Ubicacion,Telefono,Correo,Demo,Lote,Pipeline,Giro,CanalOrigen,Status,Asignado,Contactado,DemoVista,Notas';
    const rows = prospectos.map((p) =>
      [
        p.nombre,
        p.propietario,
        p.ubicacion,
        p.telefono,
        p.correo,
        p.demo,
        p.lote,
        p.pipeline,
        p.giro,
        p.canalOrigen,
        p.status,
        p.asignadoA,
        p.contactadoAt ? fmtDate(p.contactadoAt) : '',
        p.demoAbierta ? (p.demoAbiertaAt ? fmtDate(p.demoAbiertaAt) : 'Sí') : 'No',
        p.notas,
      ]
        .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'prospectos.csv'; a.click();
  };

  // ─── Selection ────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const toggleAll = () => {
    setSelected(selected.size === prospectos.length ? new Set() : new Set(prospectos.map((p) => p.id)));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-luxury p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Prospectos</h1>
          <p className="text-slate-400 text-sm mt-0.5">Seguimiento de ventas y campañas de outreach</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vendedor selector */}
          <select
            value={currentVendedor}
            onChange={(e) => setCurrentVendedor(e.target.value)}
            className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            {VENDEDORES.map((v) => <option key={v}>{v}</option>)}
          </select>
          <button
            type="button"
            onClick={() => {
              setAddForm((f) => ({ ...f, pipeline: pipelineSelected }));
              setAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
          <button onClick={() => setImportModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition">
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button onClick={() => fetchProspectos()} className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleDeleteAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-700/60 border border-red-700/40 text-red-400 hover:text-red-200 text-sm transition" title={filterLote ? `Borrar lote "${filterLote}"` : 'Borrar todos'}>
            <Trash2 className="w-4 h-4" /> {filterLote ? `Borrar lote` : 'Borrar todo'}
          </button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          type="button"
          onClick={() => setPipelineSelected('Agentia')}
          className={`flex-1 min-w-[200px] rounded-xl border-2 px-5 py-4 text-left font-semibold transition ${
            pipelineSelected === 'Agentia'
              ? 'border-teal-500/70 bg-teal-500/15 text-teal-100 shadow-lg shadow-teal-900/20'
              : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
          }`}
        >
          🏢 Pipeline: Agentia
        </button>
        <button
          type="button"
          onClick={() => setPipelineSelected('Izzi')}
          className={`flex-1 min-w-[200px] rounded-xl border-2 px-5 py-4 text-left font-semibold transition ${
            pipelineSelected === 'Izzi'
              ? 'border-blue-500/70 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-900/20'
              : 'border-slate-600 bg-slate-800/40 text-slate-400 hover:border-slate-500'
          }`}
        >
          📡 Pipeline: Izzi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-5">
        {[
          { key: 'total',          label: 'Total',          color: 'text-white' },
          { key: 'pendiente',      label: 'Pendientes',     color: 'text-slate-300' },
          { key: 'contactado',     label: 'Contactados',    color: 'text-blue-300' },
          { key: 'demo_vista',     label: 'Demo Vista',     color: 'text-purple-300' },
          { key: 'interesado',     label: 'Interesados',    color: 'text-amber-300' },
          { key: 'negociacion',    label: 'Negociación',    color: 'text-orange-300' },
          { key: 'cerrado',        label: 'Cerrados',       color: 'text-emerald-400' },
          { key: 'no_interesado',  label: 'No Interesado',  color: 'text-red-400' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key && key !== 'total' ? '' : key === 'total' ? '' : key)}
            className={`rounded-xl border p-3 text-center cursor-pointer transition ${
              filterStatus === key && key !== 'total'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className={`text-xl font-bold ${color}`}>{stats[key as keyof Stats]}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Mostrando pipeline: <span className="text-slate-300 font-medium">{pipelineSelected}</span> ·{' '}
        <span className="text-slate-400">{stats.total} prospectos totales</span>
        {filterGiro ? ` · giro: ${filterGiro}` : ''}
        {filterCanal ? ` · canal: ${filterCanal}` : ''}
      </p>

      {/* Filters + bulk action */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar negocio, teléfono..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los status</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterLote} onChange={(e) => setFilterLote(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los lotes</option>
          {lotes.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterVendedor} onChange={(e) => setFilterVendedor(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los vendedores</option>
          {VENDEDORES.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          value={filterGiro}
          onChange={(e) => setFilterGiro(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos los giros</option>
          {GIRO_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={filterCanal}
          onChange={(e) => setFilterCanal(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos los canales</option>
          {CANAL_ORIGEN_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {selected.size > 0 && (
          <>
            <button
              onClick={() => setMessageModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
            >
              <Send className="w-4 h-4" /> Enviar WhatsApp ({selected.size})
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/40 hover:bg-red-700/60 border border-red-700/40 text-red-400 hover:text-red-200 text-sm transition"
            >
              <Trash2 className="w-4 h-4" /> Borrar ({selected.size})
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/50">
              <th className="py-3 px-3 text-left">
                <input type="checkbox" checked={selected.size === prospectos.length && prospectos.length > 0}
                  onChange={toggleAll} className="rounded" />
              </th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium">Negocio</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden sm:table-cell">Giro</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden sm:table-cell">Pipeline</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden md:table-cell">Ubicación</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium">Teléfono</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium">Status</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden lg:table-cell">Lote</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden lg:table-cell">Vendedor</th>
              <th className="py-3 px-3 text-center text-slate-400 font-medium hidden md:table-cell">Demo</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden xl:table-cell">Contactado</th>
              <th className="py-3 px-3 text-left text-slate-400 font-medium hidden xl:table-cell">Notas</th>
              <th className="py-3 px-3 text-slate-400 font-medium">Acc.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="py-12 text-center text-slate-500">Cargando...</td></tr>
            ) : prospectos.length === 0 ? (
              <tr><td colSpan={13} className="py-12 text-center text-slate-500">
                No hay prospectos. Importa tu lista con el botón <strong>Importar CSV</strong>.
              </td></tr>
            ) : prospectos.map((p) => {
              const si = statusInfo(p.status);
              return (
                <tr key={p.id} className={`border-b border-slate-700/30 hover:bg-slate-800/50 transition ${selected.has(p.id) ? 'bg-blue-500/5' : ''}`}>
                  <td className="py-2.5 px-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-white">{p.nombre}</div>
                    {p.propietario && <div className="text-xs text-slate-500">{p.propietario}</div>}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 text-xs hidden sm:table-cell whitespace-nowrap">
                    <span className="mr-1">{giroEmoji(String(p.giro))}</span>
                    {p.giro || '—'}
                  </td>
                  <td className="py-2.5 px-3 hidden sm:table-cell">
                    <span
                      className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.pipeline === 'Izzi'
                          ? 'bg-blue-500/20 text-blue-200 border-blue-500/40'
                          : 'bg-teal-500/20 text-teal-200 border-teal-500/40'
                      }`}
                    >
                      {p.pipeline || PIPELINE_DEFAULT}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 hidden md:table-cell">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" />{p.ubicacion || '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">
                    <a href={`https://wa.me/${p.telefono.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-emerald-400 transition">
                      <Phone className="w-3 h-3 shrink-0" />{p.telefono}
                    </a>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${si.color}`}>{si.label}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 hidden lg:table-cell">{p.lote || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-400 hidden lg:table-cell">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.asignadoA || '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center hidden md:table-cell">
                    {p.demoAbierta ? (
                      <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                        <Eye className="w-3 h-3" />{p.demoAbiertaAt ? fmtDate(p.demoAbiertaAt) : 'Sí'}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs hidden xl:table-cell">{p.contactadoAt ? fmtDate(p.contactadoAt) : '—'}</td>
                  <td className="py-2.5 px-3 hidden xl:table-cell">
                    <p className="text-xs text-slate-500 max-w-[160px] truncate" title={p.notas}>{p.notas || '—'}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition" title="Editar">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setSelected(new Set([p.id])); setMessageModal(true); }}
                        className="p-1.5 rounded hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition" title="Enviar mensaje">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-600/20 text-slate-600 hover:text-red-400 transition" title="Eliminar">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {prospectos.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-700/30 text-xs text-slate-500">
            {prospectos.length} prospectos mostrados · {selected.size} seleccionados
          </div>
        )}
      </div>

      {/* ─── MODAL: Import ─────────────────────────────────────────────────── */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Importar Prospectos</h2>
              <button onClick={() => setImportModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lote / Batch</label>
                  <input value={importLote} onChange={(e) => setImportLote(e.target.value)} placeholder="ej: Lote 1 – Barberías Mar 2026"
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo de demo</label>
                  <select value={importDemo} onChange={(e) => setImportDemo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="barberia">Barbería / Estética</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  CSV/Excel: <code className="text-emerald-400">nombre, ubicacion, telefono</code>, opcionales{' '}
                  <code className="text-emerald-400">propietario, correo, pipeline, giro, canal_origen</code>. Si no hay{' '}
                  <code>pipeline</code> en el archivo, se usa el pipeline seleccionado arriba ({pipelineSelected}).
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => handleImportText(e.target.value)}
                  rows={8}
                  placeholder={"nombre\tubicacion\ttelefono\nEstética Lorena\tGuadalajara\t3312345678\nBarbería El Corte\tZapopan\t3398765432"}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>

              <div className="text-center text-slate-500 text-xs">— o —</div>

              <div>
                <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-slate-600 rounded-lg py-4 text-slate-400 hover:text-white hover:border-slate-500 transition text-sm">
                  <Upload className="w-5 h-5 mx-auto mb-1" />
                  Subir archivo CSV / Excel exportado como CSV
                </button>
              </div>

              {importPreview.length > 0 && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="text-emerald-400 text-sm font-medium mb-2">Vista previa: {importPreview.length} registros detectados</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importPreview.slice(0, 5).map((r, i) => (
                      <div key={i} className="text-xs text-slate-300 flex gap-3">
                        <span className="text-white font-medium">{r.nombre}</span>
                        <span className="text-slate-500">{r.ubicacion}</span>
                        <span className="text-emerald-400">{r.telefono}</span>
                      </div>
                    ))}
                    {importPreview.length > 5 && <p className="text-xs text-slate-500">... y {importPreview.length - 5} más</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700">
              <button onClick={() => setImportModal(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm">Cancelar</button>
              <button onClick={handleImport} disabled={importing || !importPreview.length}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition text-sm">
                {importing ? 'Importando...' : `Importar ${importPreview.length} prospectos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Send Message ───────────────────────────────────────────── */}
      {messageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Enviar WhatsApp</h2>
              <button onClick={() => { setMessageModal(false); setSentResult(null); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {sentResult ? (
              /* ── Resultado exitoso ── */
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{sentResult.queued} mensaje(s) en cola</h3>
                <p className="text-slate-400 text-sm">
                  El bridge los enviará escalonados cada ~45 segundos para evitar bloqueos.
                  {sentResult.minutes > 0 && <><br />Tiempo estimado: <strong className="text-white">~{sentResult.minutes} min</strong></>}
                </p>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-3 text-xs text-amber-300 text-left">
                  💡 <strong>Siguiente lote:</strong> espera al menos 30 min antes de enviar otro batch, y usa una plantilla diferente para variar el mensaje.
                </div>
                <button onClick={() => { setMessageModal(false); setSentResult(null); }}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition">
                  Listo
                </button>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-5">
                  {/* Info */}
                  <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-sm text-slate-300">
                    Enviando como <strong className="text-white">{currentVendedor}</strong> · {selected.size} seleccionado(s)
                  </div>

                  {/* Batch size */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">¿Cuántos enviar ahora? <span className="text-amber-400">(recomendado: 10-15 por sesión)</span></label>
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 15, 25, selected.size].filter((v, i, a) => a.indexOf(v) === i && v <= selected.size).map((n) => (
                        <button key={n} onClick={() => setBatchSize(n)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                            batchSize === n
                              ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                              : 'border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}>
                          {n === selected.size ? `Todos (${n})` : n}
                        </button>
                      ))}
                    </div>
                    {batchSize > 0 && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        Se enviarán {Math.min(batchSize, selected.size)} mensajes · tiempo estimado: ~{Math.ceil((Math.min(batchSize, selected.size) - 1) * 45 / 60)} min
                      </p>
                    )}
                  </div>

                  {/* Plantillas */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Selecciona la plantilla</label>
                    <div className="space-y-1.5">
                      {PLANTILLAS.map((pl) => (
                        <button key={pl.value} onClick={() => setPlantilla(pl.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                            plantilla === pl.value
                              ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                              : 'border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                          {pl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview del mensaje */}
                  {plantilla && PLANTILLA_PREVIEW[plantilla] && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Vista previa del mensaje</label>
                      <div className="rounded-xl bg-[#075e54]/20 border border-[#128c7e]/30 p-4">
                        <div className="bg-[#dcf8c6]/10 rounded-lg p-3 max-w-[85%] ml-auto">
                          <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                            {PLANTILLA_PREVIEW[plantilla]}
                          </pre>
                          <p className="text-[10px] text-slate-500 mt-1 text-right">✓✓</p>
                        </div>
                      </div>
                      {plantilla === 'intro_a' && (
                        <p className="text-[11px] text-sky-300/90 mt-2">
                          Al enviar, si el prospecto tiene <strong>giro</strong> definido (spa, dental, restaurante,
                          etc.), Intro A se sustituye automáticamente por la variante de ese giro.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Media URL opcional */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Video / GIF adjunto <span className="text-slate-600">(opcional — URL pública de tu video o GIF)</span>
                    </label>
                    <input
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="https://ejemplo.com/demo-agentia.mp4"
                      className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-600"
                    />
                    {mediaUrl && (
                      <p className="text-xs text-emerald-400 mt-1">✓ El video se enviará junto con el mensaje como adjunto</p>
                    )}
                  </div>

                  {/* Tip anti-bloqueo */}
                  <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-3 text-xs text-slate-400 space-y-1">
                    <p className="font-medium text-slate-300">🛡️ Anti-bloqueo activado</p>
                    <p>Los mensajes se envían con 45 seg de espacio entre cada uno. Usa plantillas diferentes en cada lote y espera 30 min entre sesiones.</p>
                  </div>
                </div>

                <div className="flex gap-3 p-5 border-t border-slate-700">
                  <button onClick={() => setMessageModal(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm">Cancelar</button>
                  <button onClick={handleSendMessages} disabled={sending}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition text-sm flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {sending ? 'Programando...' : `Enviar ${Math.min(batchSize, selected.size)} mensajes`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Prospecto ─────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-white">{editModal.nombre}</h2>
                <p className="text-xs text-slate-400">{editModal.telefono} · {editModal.ubicacion}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s.value} onClick={() => setEditStatus(s.value)}
                      className={`py-2 px-3 rounded-lg border text-xs text-left transition ${
                        editStatus === s.value ? `${s.color} ring-1 ring-current` : 'border-slate-700 text-slate-500 hover:border-slate-600'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Pipeline</label>
                <select
                  value={editPipeline}
                  onChange={(e) => setEditPipeline(e.target.value as ProspectoPipeline)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Agentia">Agentia</option>
                  <option value="Izzi">Izzi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Giro</label>
                <select
                  value={editGiro}
                  onChange={(e) => setEditGiro(e.target.value as ProspectoGiro)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {GIRO_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Canal de origen</label>
                <select
                  value={editCanal}
                  onChange={(e) => setEditCanal(e.target.value as ProspectoCanalOrigen)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {CANAL_ORIGEN_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Asignado a</label>
                <select value={editAsignado} onChange={(e) => setEditAsignado(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                  <option value="">— Sin asignar —</option>
                  {VENDEDORES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Lote</label>
                <input value={editLote} onChange={(e) => setEditLote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Notas de seguimiento</label>
                <textarea value={editNotas} onChange={(e) => setEditNotas(e.target.value)} rows={3}
                  placeholder="Ej: Le interesa pero espera hasta abril..."
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              {editModal.demoAbierta && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-500/20">
                  <Eye className="w-3.5 h-3.5" />
                  Demo vista el {fmtDate(editModal.demoAbiertaAt)}
                </div>
              )}
              {editModal.mensajesEnviados > 0 && (
                <p className="text-xs text-slate-500">
                  {editModal.mensajesEnviados} mensaje(s) enviado(s) · Última plantilla: {editModal.plantillaEnviada || '—'}
                </p>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add single ────────────────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Agregar Prospecto</h2>
              <button onClick={() => setAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {(['nombre', 'propietario', 'ubicacion', 'telefono', 'correo'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-slate-400 mb-1 capitalize">
                    {field}
                    {field === 'nombre' || field === 'telefono' ? ' *' : ''}
                  </label>
                  <input
                    value={addForm[field]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Pipeline</label>
                <select
                  value={addForm.pipeline}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, pipeline: e.target.value as ProspectoPipeline }))
                  }
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Agentia">Agentia</option>
                  <option value="Izzi">Izzi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Giro</label>
                <select
                  value={addForm.giro}
                  onChange={(e) => setAddForm((f) => ({ ...f, giro: e.target.value as ProspectoGiro }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {GIRO_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Canal de origen</label>
                <select
                  value={addForm.canalOrigen}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, canalOrigen: e.target.value as ProspectoCanalOrigen }))
                  }
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="Manual">Manual</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Instagram">Instagram</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Demo</label>
                  <select value={addForm.demo} onChange={(e) => setAddForm((f) => ({ ...f, demo: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                    <option value="barberia">Barbería</option><option value="restaurante">Restaurante</option><option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lote</label>
                  <input value={addForm.lote} onChange={(e) => setAddForm((f) => ({ ...f, lote: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700">
              <button onClick={() => setAddModal(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm">Cancelar</button>
              <button onClick={handleAdd} disabled={adding || !addForm.nombre || !addForm.telefono}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition text-sm">
                {adding ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
