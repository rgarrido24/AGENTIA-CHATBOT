'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

type LeadResult = {
  ok: boolean;
  lead: Record<string, unknown> | null;
  queued: Record<string, unknown> | null;
  webhookStatus: number;
};

const FIELD_LABELS: Record<string, string> = {
  leadId: 'Lead ID',
  senderName: 'Nombre',
  senderId: 'Teléfono (sender)',
  source: 'Fuente',
  source_meta: 'Meta Ads',
  campana: 'Campaña',
  adset: 'Ad Set',
  form_id: 'Form ID',
  leadgen_id: 'Leadgen ID',
  status: 'Pipeline',
  bot_status: 'Bot',
  platform: 'Plataforma',
  clientId: 'Cliente',
  createdAt: 'Creado',
  updatedAt: 'Actualizado',
  lastMessage: 'Último mensaje',
};

function LeadCard({ lead }: { lead: Record<string, unknown> }) {
  const [showRaw, setShowRaw] = useState(false);

  const highlight = [
    'leadId', 'senderName', 'senderId', 'source', 'source_meta',
    'campana', 'adset', 'form_id', 'leadgen_id', 'status', 'platform', 'createdAt',
  ];

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
        <CheckCircle className="w-5 h-5" />
        Lead guardado en MongoDB
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
        {highlight.map((key) => {
          const val = lead[key];
          if (val === undefined || val === null) return null;
          return (
            <div key={key} className="flex justify-between gap-2 py-0.5 border-b border-slate-700/40">
              <span className="text-slate-400 text-xs">{FIELD_LABELS[key] ?? key}</span>
              <span className="text-white text-xs font-mono text-right max-w-[200px] truncate" title={String(val)}>
                {typeof val === 'boolean' ? (val ? '✓' : '✗') : String(val)}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowRaw((p) => !p)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition"
      >
        {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showRaw ? 'Ocultar' : 'Ver'} JSON completo
      </button>

      {showRaw && (
        <pre className="text-[11px] text-slate-400 bg-slate-900 rounded-lg p-3 overflow-x-auto max-h-64">
          {JSON.stringify(lead, null, 2)}
        </pre>
      )}
    </div>
  );
}

function QueueCard({ queued }: { queued: Record<string, unknown> }) {
  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
        <CheckCircle className="w-4 h-4" />
        Mensaje encolado en outbound_queue
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {(['to', 'type', 'status', 'attempts', 'createdAt'] as string[]).map((key) => {
          const val = queued[key];
          if (val === undefined) return null;
          return (
            <div key={key} className="flex justify-between gap-2 py-0.5 border-b border-slate-700/40">
              <span className="text-slate-400 text-xs">{key}</span>
              <span className="text-white text-xs font-mono">{String(val)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TestLeadFormPage() {
  const [form, setForm] = useState({
    nombre: 'Juan García Test',
    telefono: '5512345678',
    email: 'juan@gmail.com',
    campana: 'Agentia Q2 2026 — Barberías',
    fuente: 'facebook',
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LeadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/test/simulate-fb-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(!isDev && password ? { 'x-test-password': password } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`);
      } else {
        setResult(data as LeadResult);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    type: string = 'text'
  ) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-slate-500"
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
            Dev Tool
          </span>
          <h1 className="text-xl font-bold text-white">Simular Lead de Facebook Ads</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Envía un payload firmado al endpoint real <code className="text-slate-400">/api/webhook/facebook-leads</code> y muestra el lead guardado.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('nombre', 'Nombre completo', 'Juan García')}
          {field('telefono', 'Teléfono (10 dígitos MX)', '5512345678', 'tel')}
          {field('email', 'Email (opcional)', 'juan@gmail.com', 'email')}
          {field('campana', 'Nombre de campaña', 'Campaña Q2 2026')}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Fuente</label>
          <div className="flex gap-3">
            {(['facebook', 'instagram'] as const).map((src) => (
              <label key={src} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fuente"
                  value={src}
                  checked={form.fuente === src}
                  onChange={() => setForm((p) => ({ ...p, fuente: src }))}
                  className="accent-blue-500"
                />
                <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  src === 'facebook'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                }`}>
                  {src === 'facebook' ? 'FB Ads' : 'IG Ads'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {!isDev && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Contraseña de acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="TEST_FORM_PASSWORD"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm placeholder-slate-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          ) : (
            <><Send className="w-4 h-4" /> Enviar lead de prueba</>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Error</p>
            <p className="text-red-300 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Resultado</h2>
            <button
              onClick={() => setResult(null)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" /> Limpiar
            </button>
          </div>

          {result.lead ? (
            <LeadCard lead={result.lead} />
          ) : (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-amber-300 text-sm">
              Webhook respondió {result.webhookStatus} pero el lead no apareció aún en MongoDB. Puede que el procesamiento async esté en curso.
            </div>
          )}

          {result.queued && <QueueCard queued={result.queued} />}

          {!result.queued && result.lead && (
            <p className="text-xs text-slate-600">
              No se encontró entrada en outbound_queue (puede que el teléfono no sea válido o el procesamiento async no haya terminado).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
