'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { MOCK_RECETAS_HISTORIAL } from '@/lib/mock-data-medico';
import { nivelLabel, type NivelAutenticidad } from '@/lib/receta-verification';
import SignatureCanvas from '@/components/SignatureCanvas';

type Tab = 'perfil' | 'nivel' | 'historial';

const inputCls =
  'mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm';

export default function MedicoConfigPage() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [saved, setSaved] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [nivelActivo, setNivelActivo] = useState<NivelAutenticidad>(1);
  const [firmaBase64, setFirmaBase64] = useState('');

  // Perfil state
  const [nombre, setNombre] = useState('Dr. Ramón Vega Torres');
  const [cedula, setCedula] = useState('9876543');
  const [especialidad, setEspecialidad] = useState('Medicina General');
  const [universidad, setUniversidad] = useState('UNAM — Facultad de Medicina');
  const [telefono, setTelefono] = useState('999-000-2222');
  const [email, setEmail] = useState('dr.vega@saludplus.mx');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFirmaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFirmaBase64((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'perfil',    label: 'Perfil del Médico' },
    { id: 'nivel',     label: 'Nivel de Autenticidad' },
    { id: 'historial', label: 'Historial de Recetas' },
  ];

  const nivelCards: {
    n: NivelAutenticidad;
    title: string;
    pros: string[];
    cons?: string[];
    costo: string;
    badge?: string;
  }[] = [
    {
      n: 1,
      title: 'NIVEL 1 — Básico',
      pros: ['Folio único por receta', 'QR de verificación en URL', 'Historial en el sistema'],
      cons: ['Sin firma digital', 'Sin cédula en receta'],
      costo: 'Incluido en plan básico',
    },
    {
      n: 2,
      title: 'NIVEL 2 — Profesional',
      pros: ['Todo lo del Nivel 1', 'Cédula profesional en receta', 'Firma digital manuscrita', 'Datos universitarios', 'Aspecto más formal y confiable'],
      costo: 'Incluido en plan profesional',
      badge: 'Recomendado',
    },
    {
      n: 3,
      title: 'NIVEL 3 — e.firma SAT',
      pros: ['Todo lo del Nivel 2', 'Firma electrónica avanzada (FIEL)', 'Validez legal plena', 'Cumple NOM-024-SSA3-2010', 'Equivale a firma autógrafa ante la ley'],
      costo: 'Plan enterprise + configuración inicial',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/10 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PERFIL ──────────────────────────────────────────────────────── */}
      {tab === 'perfil' && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
          <h2 className="font-semibold text-lg">Perfil del Médico</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Nombre completo</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Cédula profesional</label>
              <input value={cedula} onChange={(e) => setCedula(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Especialidad</label>
              <input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Universidad</label>
              <input value={universidad} onChange={(e) => setUniversidad(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Teléfono de consultorio</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Logo / foto (solo visual)</label>
              <input type="file" accept="image/*" className="mt-1 text-xs text-slate-400 w-full" />
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Firma digital</p>
            {firmaBase64 ? (
              <div className="space-y-2">
                <img src={firmaBase64} alt="Firma" className="max-w-[300px] rounded border border-white/10 bg-white" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFirmaBase64('')} className="text-xs text-emerald-400">Redibujar</button>
                  <span className="text-slate-600 text-xs">·</span>
                  <label className="text-xs text-emerald-400 cursor-pointer">
                    Subir imagen
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFirmaUpload} />
                  </label>
                </div>
              </div>
            ) : (
              <SignatureCanvas onConfirm={(b64) => setFirmaBase64(b64)} />
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-sm"
            >
              Guardar cambios
            </button>
            {saved && <span className="text-emerald-400 text-sm">✅ Guardado</span>}
          </div>
        </div>
      )}

      {/* ── TAB: NIVEL ───────────────────────────────────────────────────────── */}
      {tab === 'nivel' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nivelCards.map(({ n, title, pros, cons, costo, badge }) => {
              const active = nivelActivo === n;
              return (
                <div
                  key={n}
                  className={`rounded-2xl border p-5 space-y-3 transition-all ${
                    active ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  {badge && (
                    <span className="text-[10px] bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded font-medium">
                      {badge}
                    </span>
                  )}
                  <h3 className={`font-bold text-sm ${active ? 'text-emerald-300' : 'text-white'}`}>{title}</h3>
                  <ul className="space-y-1 text-xs">
                    {pros.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-emerald-400 mt-0.5">✓</span>{p}
                      </li>
                    ))}
                    {cons?.map((c) => (
                      <li key={c} className="flex items-start gap-1.5 text-slate-500">
                        <span className="text-slate-600 mt-0.5">✗</span>{c}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-500">{costo}</p>
                  {n === 3 ? (
                    <a
                      href="mailto:contacto@agentia.software"
                      className="block text-center text-xs px-3 py-2 rounded-lg border border-blue-500/40 text-blue-300 hover:bg-blue-900/20"
                    >
                      Solicitar implementación →
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNivelActivo(n)}
                      className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'border border-white/15 text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {active ? 'Activado — plan actual' : 'Activar este nivel'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legal accordion */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <button
              type="button"
              onClick={() => setLegalOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-300 hover:bg-white/[0.03]"
            >
              <span>📜 Marco legal de la e.firma SAT en recetas médicas</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${legalOpen ? 'rotate-180' : ''}`} />
            </button>
            {legalOpen && (
              <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed space-y-2 border-t border-white/10 pt-4">
                <p>La firma electrónica avanzada (e.firma) está regulada por:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li>Código de Comercio, Art. 89-114</li>
                  <li>Ley de Firma Electrónica Avanzada (LFEA)</li>
                  <li>NOM-024-SSA3-2010 para expedientes clínicos electrónicos</li>
                  <li>COFEPRIS para recetas médicas digitales</li>
                </ul>
                <p>
                  Al usar la e.firma del SAT, tu receta tiene la misma validez legal que una receta
                  firmada de puño y letra ante cualquier autoridad, institución médica o farmacia.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ───────────────────────────────────────────────────── */}
      {tab === 'historial' && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 bg-white/[0.03] font-medium text-sm">Historial de recetas emitidas</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-500">
                <th className="p-3">Folio</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Nivel</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECETAS_HISTORIAL.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-3 font-mono text-xs text-slate-400">{r.id.toUpperCase()}</td>
                  <td className="p-3">{r.pacienteNombre}</td>
                  <td className="p-3 text-slate-400">{r.fecha}</td>
                  <td className="p-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                      {nivelLabel(1)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                      Vigente
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
