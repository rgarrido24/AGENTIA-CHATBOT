'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

type Rule = {
  id: string;
  active: boolean;
  channel: 'comment' | 'dm' | 'both';
  keywords: string[];
  publicReplies: string[];
  dmMessage: string;
};

const inputCls =
  'w-full rounded-lg px-3 py-2 bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ReglasPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agentia-panel/reglas', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'No se pudieron cargar las reglas');
          return;
        }
        setRules(
          (data.rules ?? []).map((r: any) => ({
            id: r.id,
            active: r.active !== false,
            channel: r.channel ?? 'both',
            keywords: r.keywords ?? [],
            publicReplies: r.publicReplies ?? [],
            dmMessage: r.dmMessage ?? '',
          }))
        );
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (i: number, patch: Partial<Rule>) =>
    setRules((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const add = () =>
    setRules((prev) => [
      ...prev,
      { id: `regla-${prev.length + 1}`, active: true, channel: 'both', keywords: [], publicReplies: [], dmMessage: '' },
    ]);

  const save = async () => {
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const res = await fetch('/api/agentia-panel/reglas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'No se pudo guardar');
        return;
      }
      setMsg('Guardado ✓ Aplica en aproximadamente 1 minuto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh] text-slate-100 bg-[#0a0f1a] px-4 py-5 max-w-3xl mx-auto">
      <Link href="/agentia-panel/conversaciones" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-3">
        <ArrowLeft className="h-4 w-4" /> Conversaciones
      </Link>
      <h1 className="text-xl font-bold mb-1">Respuestas automáticas</h1>
      <p className="text-xs text-slate-500 mb-4">
        Si el comentario o mensaje empieza con alguna de las palabras (sin importar mayúsculas ni acentos), el bot manda tu texto.
        Si ninguna regla coincide, contesta la IA.
      </p>

      {error && <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
      {msg && <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">{msg}</div>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando...</p>
      ) : (
        <div className="space-y-4">
          {rules.map((r, i) => (
            <section key={i} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <input className={inputCls} value={r.id} onChange={(e) => update(i, { id: e.target.value })} aria-label="Nombre de la regla" />
                <label className="flex items-center gap-1.5 text-xs text-slate-300 shrink-0">
                  <input type="checkbox" checked={r.active} onChange={(e) => update(i, { active: e.target.checked })} /> Activa
                </label>
                <button type="button" onClick={() => setRules((p) => p.filter((_, x) => x !== i))} className="p-2 text-red-300 hover:bg-red-500/10 rounded-lg" aria-label="Borrar regla">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Palabras clave (separadas por coma)</p>
                <input className={inputCls} value={r.keywords.join(', ')} onChange={(e) => update(i, { keywords: e.target.value.split(',').map((s) => s.trim()) })} placeholder="info, precio, quiero" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Dónde aplica</p>
                <select className={inputCls} value={r.channel} onChange={(e) => update(i, { channel: e.target.value as Rule['channel'] })}>
                  <option value="both">Comentarios y mensajes</option>
                  <option value="comment">Solo comentarios</option>
                  <option value="dm">Solo mensajes (DM)</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Respuesta pública al comentario (una por línea; se elige una al azar)</p>
                <textarea className={inputCls} rows={2} value={r.publicReplies.join('\n')} onChange={(e) => update(i, { publicReplies: e.target.value.split('\n') })} placeholder="¡Te la mandé por privado! 📩" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Mensaje privado (DM). Vacío = responde la IA</p>
                <textarea className={inputCls} rows={4} value={r.dmMessage} onChange={(e) => update(i, { dmMessage: e.target.value })} placeholder="Hola, gracias por tu interés..." />
              </div>
            </section>
          ))}
          <div className="flex gap-2">
            <button type="button" onClick={add} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5">
              <Plus className="h-4 w-4" /> Nueva regla
            </button>
            <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
