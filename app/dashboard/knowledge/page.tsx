'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { isIzziClient } from '@/lib/izzi-panel';

type Doc = { _id: string; filename: string; uploadedAt?: string };

const CLIENTS = [
  { id: 'izzi', label: 'izzi (cobranza)' },
  { id: 'demo-inmobiliaria', label: 'Inmobiliaria (demo)' },
  { id: 'agentia', label: 'Agentia' },
];

export default function KnowledgePage() {
  const [clientId, setClientId] = useState('izzi');
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/knowledge?clientId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      const list = data.docs ?? [];
      setDocs(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('clientId', clientId);
      form.append('file', file);
      const res = await fetch('/api/knowledge', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      await fetchDocs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este documento?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/knowledge?clientId=${encodeURIComponent(clientId)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      await fetchDocs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  return (
    <main className="min-h-screen bg-luxury">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-emerald-400 mb-6 inline-block transition"
          >
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold mb-2 title-tracking text-white font-heading">
            Base de Conocimiento
          </h1>
          <p className="text-slate-400 mb-8 subtitle-tracking">
            Sube archivos .txt, .csv o .pdf por cliente. La IA usará este contenido como contexto.
          </p>
          {isIzziClient(clientId) && (
            <div className="mb-6 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm text-[#CBD5E1]">
              <strong>Coberturas (izzi):</strong> Sube tu archivo de Excel exportado como CSV (columnas <code>d_codigo</code> o <code>CP</code>, y <code>tipo de plaza</code> para ON-NET/OFF-NET). También PDFs con precios, paquetes y promociones.
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 subtitle-tracking">Cliente</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
              >
                {CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="card-glass p-6">
              <label className="block text-sm font-medium mb-2 subtitle-tracking">Subir archivo</label>
              <div className="flex items-center gap-3">
                <label className="btn-cta cursor-pointer inline-block">
                  {uploading ? 'Subiendo…' : 'Seleccionar archivo'}
                  <input
                    type="file"
                    accept=".txt,.csv,.pdf"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
                <span className="text-sm text-slate-400">
                  .txt, .csv o .pdf (para coberturas: columnas CP, Cobertura)
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-sm">
                {error}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-3 title-tracking text-white">Documentos cargados</h2>
              {loading ? (
                <p className="text-slate-400 text-sm">Cargando…</p>
              ) : docs.length === 0 ? (
                <p className="text-slate-400 text-sm">No hay documentos para este cliente.</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li
                      key={String(d._id)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0f172a] border border-white/10"
                    >
                      <span
                        className="font-medium truncate text-slate-200"
                        title={d.filename || ''}
                      >
                        {d.filename || '(sin nombre)'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(String(d._id))}
                        className="text-red-400 hover:text-red-300 text-sm font-medium transition shrink-0 ml-3"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
