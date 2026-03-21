'use client';

import { useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { generarIncapacidadPdf, generarRecetaPdfMedico } from '@/lib/medico-pdf';
import { CIE10_COMUNES, MEDICOS, HOY_MED, type RecetaHistorial } from '@/lib/mock-data-medico';
import { useMedico } from '../medico-context';
import SignatureCanvas from '@/components/SignatureCanvas';

type NivelAuth = 1 | 2 | 3;
type FirmaTab = 'dibujar' | 'subir';
type EfirmaStatus = 'idle' | 'loading' | 'verified';

const inputCls =
  'mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm';

export default function MedicoRecetasPage() {
  const { pacientes, recetasHistorial, addReceta } = useMedico();

  // ── Base fields ─────────────────────────────────────────────────────────────
  const [pacId, setPacId] = useState('pm1');
  const [fecha, setFecha] = useState(HOY_MED);
  const [medico, setMedico] = useState<string>(MEDICOS[0]!.nombre);
  const [cieCode, setCieCode] = useState<string>(CIE10_COMUNES[0]!.code);
  const [diagnostico, setDiagnostico] = useState('Control de hipertensión arterial');
  const [indicaciones, setIndicaciones] = useState('Dieta baja en sodio. Actividad física moderada.');
  const [diasReposo, setDiasReposo] = useState(0);
  const [restriccionesLaborales, setRestriccionesLaborales] = useState('Sin restricción (consulta ambulatoria).');
  const [diasIncapacidad, setDiasIncapacidad] = useState(3);
  const [meds, setMeds] = useState([
    { nombre: 'Losartán', presentacion: '50mg', dosis: '1 tableta', frecuencia: 'cada 24 horas', duracion: '30 días', indicaciones: 'En ayunas o con alimentos' },
  ]);

  // ── Auth level ──────────────────────────────────────────────────────────────
  const [nivel, setNivel] = useState<NivelAuth>(1);

  // ── Nivel 2 fields ──────────────────────────────────────────────────────────
  const [cedula, setCedula] = useState('9876543');
  const [especialidad, setEspecialidad] = useState('Medicina General');
  const [universidad, setUniversidad] = useState('');
  const [firmaBase64, setFirmaBase64] = useState('');
  const [firmaTab, setFirmaTab] = useState<FirmaTab>('dibujar');
  const [showCanvas, setShowCanvas] = useState(true);

  // ── Nivel 3 fields ──────────────────────────────────────────────────────────
  const [cerFile, setCerFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [efirmaPassword, setEfirmaPassword] = useState('');
  const [efirmaStatus, setEfirmaStatus] = useState<EfirmaStatus>('idle');

  const p = pacientes.find((x) => x.id === pacId);
  const cieLabel = useMemo(() => CIE10_COMUNES.find((c) => c.code === cieCode)?.label ?? '', [cieCode]);
  const lista = useMemo(() => recetasHistorial, [recetasHistorial]);

  const agregarMed = () =>
    setMeds([...meds, { nombre: '', presentacion: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }]);

  const handleEfirmaVerify = async () => {
    if (!cerFile || !keyFile || !efirmaPassword) return;
    setEfirmaStatus('loading');
    await new Promise<void>((r) => setTimeout(r, 2000));
    setEfirmaStatus('verified');
  };

  const handleFirmaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFirmaBase64((ev.target?.result as string) ?? '');
    reader.readAsDataURL(file);
  };

  const generarReceta = async () => {
    if (!p) return;
    const folio = `RX-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    await generarRecetaPdfMedico({
      paciente: p,
      fecha,
      medico,
      cedula,
      cie10: cieCode,
      cie10Label: cieLabel,
      medicamentos: meds.filter((m) => m.nombre.trim()),
      indicacionesGenerales: indicaciones,
      diagnostico,
      diasReposo,
      restriccionesLaborales,
      nivel,
      folio,
      firmaBase64: nivel >= 2 ? firmaBase64 : undefined,
      universidad: nivel >= 2 ? universidad : undefined,
      especialidadReg: nivel >= 2 ? especialidad : undefined,
      efirmaSimulada: nivel === 3 && efirmaStatus === 'verified',
    });
    const r: RecetaHistorial = {
      id: `rxm-${Date.now()}`,
      pacienteId: p.id,
      pacienteNombre: p.nombre,
      fecha,
      medico,
      diagnostico,
      cie10: cieCode,
    };
    addReceta(r);
  };

  const generarIncap = async () => {
    if (!p) return;
    await generarIncapacidadPdf({
      paciente: p, fecha, medico, cedula,
      cie10: cieCode, cie10Label: cieLabel,
      diasIncapacidad, diagnostico,
    });
  };

  const nivelMeta: Record<NivelAuth, { title: string; sub: string; badge: string }> = {
    1: { title: 'NIVEL 1 — Básico',       sub: 'QR de verificación',           badge: 'Gratis' },
    2: { title: 'NIVEL 2 — Profesional',  sub: 'QR + Cédula + Firma digital',  badge: 'Recomendado' },
    3: { title: 'NIVEL 3 — e.firma SAT',  sub: 'Firma electrónica FIEL',       badge: 'Validez legal' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* ── BLOQUE: NIVEL DE AUTENTICIDAD ────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h3 className="font-semibold text-sm text-slate-300">Nivel de autenticidad de la receta</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([1, 2, 3] as const).map((n) => {
            const active = nivel === n;
            const meta = nivelMeta[n];
            return (
              <button
                key={n}
                type="button"
                onClick={() => setNivel(n)}
                className={`rounded-xl p-4 text-left border transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      active ? 'border-emerald-400' : 'border-slate-600'
                    }`}
                  >
                    {active && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${active ? 'text-emerald-300' : 'text-slate-300'}`}>{meta.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{meta.sub}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded mt-1.5 inline-block ${
                        n === 2 ? 'bg-emerald-600/30 text-emerald-300' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {meta.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Nivel 2 extra fields ─────────────────────────────────────────── */}
        {nivel === 2 && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Cédula Profesional</label>
                <input value={cedula} onChange={(e) => setCedula(e.target.value)} className={inputCls} placeholder="9876543" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Especialidad registrada</label>
                <input value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400">Universidad de egreso</label>
                <input value={universidad} onChange={(e) => setUniversidad(e.target.value)} className={inputCls} placeholder="Universidad Nacional..." />
              </div>
            </div>

            {/* Firma */}
            <div>
              <p className="text-xs text-slate-400 mb-2">Firma del médico</p>
              <div className="flex gap-2 mb-3">
                {(['dibujar', 'subir'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setFirmaTab(t); setShowCanvas(true); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      firmaTab === t
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {t === 'dibujar' ? '✍️ Dibujar firma' : '📁 Subir imagen'}
                  </button>
                ))}
              </div>

              {firmaTab === 'dibujar' ? (
                firmaBase64 && !showCanvas ? (
                  <div className="space-y-2">
                    <img src={firmaBase64} alt="Firma digital" className="max-w-[300px] rounded border border-white/10 bg-white" />
                    <button type="button" onClick={() => { setFirmaBase64(''); setShowCanvas(true); }} className="text-xs text-emerald-400">
                      Redibujar
                    </button>
                  </div>
                ) : (
                  <SignatureCanvas
                    onConfirm={(b64) => { setFirmaBase64(b64); setShowCanvas(false); }}
                  />
                )
              ) : (
                <div className="space-y-2">
                  <input type="file" accept="image/png,image/jpeg" onChange={handleFirmaUpload} className="text-xs text-slate-400" />
                  {firmaBase64 && (
                    <img src={firmaBase64} alt="Firma" className="max-w-[200px] rounded border border-white/10 bg-white" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Nivel 3 ──────────────────────────────────────────────────────── */}
        {nivel === 3 && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            <div className="rounded-xl border border-blue-500/30 bg-blue-900/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-xl">🔐</span>
                <div>
                  <p className="font-semibold text-blue-200 text-sm">e.firma SAT (FIEL) — Firma Electrónica Avanzada</p>
                  <p className="text-xs text-blue-300 mt-1 leading-relaxed">
                    La e.firma del SAT otorga <strong>VALIDEZ LEGAL PLENA</strong> a tus recetas médicas,
                    equiparable a la firma autógrafa según el Código de Comercio y NOM-024-SSA3-2010.
                  </p>
                </div>
              </div>

              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Para activar esta función necesitas:</p>
                <ul className="space-y-0.5 ml-3 list-disc text-blue-400">
                  <li>Archivo .cer (certificado) emitido por el SAT</li>
                  <li>Archivo .key (llave privada)</li>
                  <li>Tu contraseña de e.firma</li>
                </ul>
              </div>

              <div className="rounded-lg bg-amber-900/30 border border-amber-500/30 p-3 text-xs text-amber-200">
                ⚠️ <strong>MODO DEMO:</strong> Esta función simula el proceso. En producción se
                integra con los servicios del SAT para firmar el hash del documento digitalmente.
              </div>

              <div className="grid sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-slate-400">📁 Archivo .cer</label>
                  <input type="file" accept=".cer" onChange={(e) => setCerFile(e.target.files?.[0] ?? null)} className="mt-1 text-xs text-slate-300 w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">📁 Archivo .key</label>
                  <input type="file" accept=".key" onChange={(e) => setKeyFile(e.target.files?.[0] ?? null)} className="mt-1 text-xs text-slate-300 w-full" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">🔑 Contraseña</label>
                  <input type="password" value={efirmaPassword} onChange={(e) => setEfirmaPassword(e.target.value)} className="mt-1 w-full rounded bg-slate-900 border border-white/10 px-2 py-1.5 text-xs" placeholder="••••••••" />
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => void handleEfirmaVerify()}
                  disabled={!cerFile || !keyFile || !efirmaPassword || efirmaStatus === 'loading'}
                  className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40"
                >
                  {efirmaStatus === 'loading' ? '⏳ Verificando...' : 'Verificar certificado'}
                </button>
                {efirmaStatus === 'verified' && (
                  <span className="text-xs text-emerald-400">✅ Certificado verificado (simulación demo)</span>
                )}
                {efirmaStatus === 'idle' && (
                  <span className="text-xs text-slate-500">⚪ Sin certificado cargado</span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <a href="https://www.sat.gob.mx/tramites/16703" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  ¿No tienes e.firma? Tramítala en el SAT →
                </a>
                <span className="text-slate-600">·</span>
                <a href="mailto:contacto@agentia.software" className="text-emerald-400 hover:underline">
                  Contactar a Agentia para implementación
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FORMULARIO DE RECETA ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="font-semibold text-lg">Receta médica e incapacidad (PDF)</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Paciente</label>
            <select value={pacId} onChange={(e) => setPacId(e.target.value)} className={inputCls}>
              {pacientes.map((px) => (
                <option key={px.id} value={px.id}>{px.folio} · {px.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Médico</label>
            <select value={medico} onChange={(e) => setMedico(e.target.value)} className={inputCls}>
              {MEDICOS.map((d) => (
                <option key={d.id} value={d.nombre}>{d.nombre}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Diagnóstico CIE-10</label>
            <select value={cieCode} onChange={(e) => setCieCode(e.target.value)} className={inputCls}>
              {CIE10_COMUNES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Medicamentos</p>
          {meds.map((m, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2 text-xs">
              <input placeholder="Nombre"       value={m.nombre}       onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, nombre: e.target.value };       setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Presentación" value={m.presentacion} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, presentacion: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Dosis"        value={m.dosis}        onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, dosis: e.target.value };        setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Frecuencia"   value={m.frecuencia}   onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, frecuencia: e.target.value };   setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Duración"     value={m.duracion}     onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, duracion: e.target.value };     setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Indicaciones" value={m.indicaciones} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, indicaciones: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
            </div>
          ))}
          <button type="button" onClick={agregarMed} className="text-xs text-emerald-400">+ Agregar</button>
        </div>

        <div>
          <label className="text-xs text-slate-400">Diagnóstico (texto libre en receta)</label>
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={2} className={inputCls} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Indicaciones de reposo (días)</label>
            <input type="number" min={0} value={diasReposo} onChange={(e) => setDiasReposo(Number(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-slate-400">Días incapacidad (PDF aparte)</label>
            <input type="number" min={1} value={diasIncapacidad} onChange={(e) => setDiasIncapacidad(Number(e.target.value) || 1)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Restricciones laborales / incapacidad</label>
          <textarea value={restriccionesLaborales} onChange={(e) => setRestriccionesLaborales(e.target.value)} rows={2} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-slate-400">Indicaciones generales</label>
          <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={2} className={inputCls} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void generarReceta()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
          >
            <FileDown className="w-5 h-5" />
            Generar Receta PDF
          </button>
          <button
            type="button"
            onClick={() => void generarIncap()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold border border-emerald-500/50 text-emerald-200 hover:bg-emerald-950/40"
          >
            <FileDown className="w-5 h-5" />
            Generar Incapacidad PDF
          </button>
        </div>
      </div>

      {/* ── HISTORIAL ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 bg-white/[0.03] font-medium text-sm">Historial de recetas emitidas</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-500">
              <th className="p-3">Fecha</th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Médico</th>
              <th className="p-3">CIE-10</th>
              <th className="p-3">Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {lista.slice(0, 12).map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="p-3">{r.fecha}</td>
                <td className="p-3">{r.pacienteNombre}</td>
                <td className="p-3 text-slate-400">{r.medico}</td>
                <td className="p-3 text-slate-400">{r.cie10}</td>
                <td className="p-3 text-slate-400">{r.diagnostico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
