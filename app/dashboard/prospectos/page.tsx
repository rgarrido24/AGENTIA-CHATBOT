'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Upload, Send, Search, Filter, RefreshCw, X, Check, ChevronDown,
  Phone, MapPin, User, MessageSquare, Eye, Trash2, Edit3,
  Download, Plus, FileText,
} from 'lucide-react';

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
  { value: 'intro',       label: '👋 Introducción (primer contacto)' },
  { value: 'seguimiento', label: '🔄 Seguimiento (no respondió)' },
  { value: 'cierre',      label: '🎯 Cierre (negociación)' },
];

const statusInfo = (s: string) => STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];

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

function mapRow(row: Record<string, string>) {
  const keys = Object.keys(row);
  // Busca coincidencia exacta primero, luego parcial (el header contiene la palabra clave)
  const fuzzy = (...candidates: string[]) => {
    for (const c of candidates) { if (row[c]) return row[c]; }
    for (const c of candidates) {
      const found = keys.find((k) => k.includes(c));
      if (found && row[found]) return row[found];
    }
    return '';
  };
  return {
    nombre:      fuzzy('nombre', 'negocio', 'estetica', 'empresa', 'name'),
    propietario: fuzzy('propietario', 'dueno', 'owner', 'contacto', 'giro'),
    ubicacion:   fuzzy('ubicacion', 'direccion', 'location', 'ciudad', 'municipio'),
    telefono:    normalizePhone(fuzzy('telefono', 'tel', 'phone', 'celular', 'movil', 'whatsapp')),
    correo:      fuzzy('correo', 'email', 'mail'),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProspectosPage() {
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [stats, setStats] = useState<Stats>({ total:0,pendiente:0,contactado:0,demo_vista:0,interesado:0,negociacion:0,cerrado:0,no_interesado:0 });
  const [lotes, setLotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLote, setFilterLote] = useState('');
  const [filterVendedor, setFilterVendedor] = useState('');
  const [currentVendedor, setCurrentVendedor] = useState(VENDEDORES[0]);

  // Modals
  const [importModal, setImportModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [editModal, setEditModal] = useState<Prospecto | null>(null);
  const [addModal, setAddModal] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importLote, setImportLote] = useState('Lote 1');
  const [importDemo, setImportDemo] = useState('barberia');
  const [importPreview, setImportPreview] = useState<ReturnType<typeof mapRow>[]>([]);
  const [importing, setImporting] = useState(false);

  // Message state
  const [plantilla, setPlantilla] = useState('intro');
  const [sending, setSending] = useState(false);

  // Edit state
  const [editStatus, setEditStatus] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [editAsignado, setEditAsignado] = useState('');
  const [editLote, setEditLote] = useState('');
  const [saving, setSaving] = useState(false);

  // Add state
  const [addForm, setAddForm] = useState({ nombre:'', propietario:'', ubicacion:'', telefono:'', correo:'', demo:'barberia', lote:'' });
  const [adding, setAdding] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchProspectos = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterLote)   params.set('lote', filterLote);
    if (filterVendedor) params.set('vendedor', filterVendedor);
    if (search)       params.set('search', search);
    try {
      const res = await fetch(`/api/prospectos?${params}`);
      const data = await res.json();
      if (data.ok) {
        setProspectos(data.prospectos);
        setStats(data.stats);
        setLotes(data.lotes);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterStatus, filterLote, filterVendedor, search]);

  useEffect(() => { fetchProspectos(); }, [fetchProspectos]);

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
        body: JSON.stringify({ rows: importPreview, lote: importLote, demo: importDemo }),
      });
      const data = await res.json();
      if (data.ok) {
        setImportModal(false);
        setImportText('');
        setImportPreview([]);
        fetchProspectos();
      } else { alert(data.error || 'Error al importar'); }
    } finally { setImporting(false); }
  };

  // ─── Message ──────────────────────────────────────────────────────────────

  const handleSendMessages = async () => {
    if (!selected.size) return;
    setSending(true);
    try {
      const res = await fetch('/api/prospectos/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selected),
          plantilla,
          vendedor: currentVendedor,
          baseUrl: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessageModal(false);
        setSelected(new Set());
        fetchProspectos();
        alert(`✅ ${data.queued} mensaje(s) en cola. El bridge los enviará en segundos.`);
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
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await fetch('/api/prospectos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editModal.id, status: editStatus, notas: editNotas, asignadoA: editAsignado, lote: editLote }),
      });
      setEditModal(null);
      fetchProspectos();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este prospecto?')) return;
    await fetch(`/api/prospectos/status?id=${id}`, { method: 'DELETE' });
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
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.ok) { setAddModal(false); setAddForm({ nombre:'',propietario:'',ubicacion:'',telefono:'',correo:'',demo:'barberia',lote:'' }); fetchProspectos(); }
      else alert(data.error);
    } finally { setAdding(false); }
  };

  // ─── Export CSV ───────────────────────────────────────────────────────────

  const handleExport = () => {
    const headers = 'Nombre,Propietario,Ubicacion,Telefono,Correo,Demo,Lote,Status,Asignado,Contactado,DemoVista,Notas';
    const rows = prospectos.map((p) =>
      [p.nombre,p.propietario,p.ubicacion,p.telefono,p.correo,p.demo,p.lote,
       p.status,p.asignadoA,p.contactadoAt ? fmtDate(p.contactadoAt) : '',
       p.demoAbierta ? (p.demoAbiertaAt ? fmtDate(p.demoAbiertaAt) : 'Sí') : 'No',
       p.notas].map((v) => `"${String(v || '').replace(/"/g,'""')}"`).join(',')
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
    <div className="min-h-screen bg-[#0a1209] p-4 lg:p-6">
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
          <button onClick={() => setAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition">
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
        </div>
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

        {selected.size > 0 && (
          <button
            onClick={() => setMessageModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
          >
            <Send className="w-4 h-4" /> Enviar WhatsApp ({selected.size})
          </button>
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
              <tr><td colSpan={11} className="py-12 text-center text-slate-500">Cargando...</td></tr>
            ) : prospectos.length === 0 ? (
              <tr><td colSpan={11} className="py-12 text-center text-slate-500">
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
          <div className="bg-[#0f1a0f] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  Pega tu CSV/Excel aquí — columnas: <code className="text-emerald-400">nombre, ubicacion, telefono</code> (+ propietario, correo opcionales)
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
          <div className="bg-[#0f1a0f] border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Enviar WhatsApp</h2>
              <button onClick={() => setMessageModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="rounded-lg bg-slate-800/60 border border-slate-700 p-3 text-sm text-slate-300">
                Se enviará a <strong className="text-white">{selected.size} prospecto(s)</strong> como <strong className="text-emerald-400">{currentVendedor}</strong>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Selecciona la plantilla</label>
                <div className="space-y-2">
                  {PLANTILLAS.map((pl) => (
                    <button key={pl.value} onClick={() => setPlantilla(pl.value)}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${
                        plantilla === pl.value
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      {pl.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-500">
                El mensaje incluirá un link de seguimiento único por prospecto para detectar quién abre la demo.
              </p>
            </div>
            <div className="flex gap-3 p-5 border-t border-slate-700">
              <button onClick={() => setMessageModal(false)} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition text-sm">Cancelar</button>
              <button onClick={handleSendMessages} disabled={sending}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition text-sm flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />{sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Prospecto ─────────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#0f1a0f] border border-slate-700 rounded-2xl w-full max-w-md">
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
          <div className="bg-[#0f1a0f] border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Agregar Prospecto</h2>
              <button onClick={() => setAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              {(['nombre','propietario','ubicacion','telefono','correo'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs text-slate-400 mb-1 capitalize">{field}{field === 'nombre' || field === 'telefono' ? ' *' : ''}</label>
                  <input
                    value={addForm[field]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              ))}
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
