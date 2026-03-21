'use client';

import { useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { generarIncapacidadPdf, generarRecetaPdfMedico } from '@/lib/medico-pdf';
import { CIE10_COMUNES, MEDICOS, HOY_MED, type RecetaHistorial } from '@/lib/mock-data-medico';
import { useMedico } from '../medico-context';

export default function MedicoRecetasPage() {
  const { pacientes, recetasHistorial, addReceta } = useMedico();
  const [pacId, setPacId] = useState('pm1');
  const [fecha, setFecha] = useState(HOY_MED);
  const [medico, setMedico] = useState(MEDICOS[0]!.nombre);
  const [cieCode, setCieCode] = useState(CIE10_COMUNES[0]!.code);
  const [diagnostico, setDiagnostico] = useState('Control de hipertensión arterial');
  const [indicaciones, setIndicaciones] = useState('Dieta baja en sodio. Actividad física moderada.');
  const [diasReposo, setDiasReposo] = useState(0);
  const [restriccionesLaborales, setRestriccionesLaborales] = useState('Sin restricción (consulta ambulatoria).');
  const [diasIncapacidad, setDiasIncapacidad] = useState(3);
  const [meds, setMeds] = useState([
    {
      nombre: 'Losartán',
      presentacion: '50mg',
      dosis: '1 tableta',
      frecuencia: 'cada 24 horas',
      duracion: '30 días',
      indicaciones: 'En ayunas o con alimentos',
    },
  ]);

  const p = pacientes.find((x) => x.id === pacId);
  const cieLabel = useMemo(() => CIE10_COMUNES.find((c) => c.code === cieCode)?.label ?? '', [cieCode]);

  const agregarMed = () =>
    setMeds([...meds, { nombre: '', presentacion: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }]);

  const generarReceta = async () => {
    if (!p) return;
    await generarRecetaPdfMedico({
      paciente: p,
      fecha,
      medico,
      cedula: '9876543',
      cie10: cieCode,
      cie10Label: cieLabel,
      medicamentos: meds.filter((m) => m.nombre.trim()),
      indicacionesGenerales: indicaciones,
      diagnostico,
      diasReposo,
      restriccionesLaborales,
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
      paciente: p,
      fecha,
      medico,
      cedula: '9876543',
      cie10: cieCode,
      cie10Label: cieLabel,
      diasIncapacidad,
      diagnostico,
    });
  };

  const lista = useMemo(() => recetasHistorial, [recetasHistorial]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="font-semibold text-lg">Receta médica e incapacidad (PDF)</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Paciente</label>
            <select value={pacId} onChange={(e) => setPacId(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
              {pacientes.map((px) => (
                <option key={px.id} value={px.id}>
                  {px.folio} · {px.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Médico</label>
            <select value={medico} onChange={(e) => setMedico(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
              {MEDICOS.map((d) => (
                <option key={d.id} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Diagnóstico CIE-10</label>
            <select value={cieCode} onChange={(e) => setCieCode(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
              {CIE10_COMUNES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Medicamentos</p>
          {meds.map((m, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2 text-xs">
              <input
                placeholder="Nombre"
                value={m.nombre}
                onChange={(e) => {
                  const x = [...meds];
                  x[i] = { ...x[i]!, nombre: e.target.value };
                  setMeds(x);
                }}
                className="rounded bg-slate-900 border border-white/10 px-2 py-1"
              />
              <input
                placeholder="Presentación"
                value={m.presentacion}
                onChange={(e) => {
                  const x = [...meds];
                  x[i] = { ...x[i]!, presentacion: e.target.value };
                  setMeds(x);
                }}
                className="rounded bg-slate-900 border border-white/10 px-2 py-1"
              />
              <input
                placeholder="Dosis"
                value={m.dosis}
                onChange={(e) => {
                  const x = [...meds];
                  x[i] = { ...x[i]!, dosis: e.target.value };
                  setMeds(x);
                }}
                className="rounded bg-slate-900 border border-white/10 px-2 py-1"
              />
              <input
                placeholder="Frecuencia"
                value={m.frecuencia}
                onChange={(e) => {
                  const x = [...meds];
                  x[i] = { ...x[i]!, frecuencia: e.target.value };
                  setMeds(x);
                }}
                className="rounded bg-slate-900 border border-white/10 px-2 py-1"
              />
              <input
                placeholder="Duración"
                value={m.duracion}
                onChange={(e) => {
                  const x = [...meds];
                  x[i] = { ...x[i]!, duracion: e.target.value };
                  setMeds(x);
                }}
                className="rounded bg-slate-900 border border-white/10 px-2 py-1"
              />
              <input
                placeholder="Indicaciones"
                value={m.indicaciones}
                onChange={(e) => {
                  const x = [...meds];
                  x[i] = { ...x[i]!, indicaciones: e.target.value };
                  setMeds(x);
                }}
                className="rounded bg-slate-900 border border-white/10 px-2 py-1"
              />
            </div>
          ))}
          <button type="button" onClick={agregarMed} className="text-xs text-emerald-400">
            + Agregar
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-400">Diagnóstico (texto libre en receta)</label>
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={2} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400">Indicaciones de reposo (días)</label>
            <input
              type="number"
              min={0}
              value={diasReposo}
              onChange={(e) => setDiasReposo(Number(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Días incapacidad (PDF aparte)</label>
            <input
              type="number"
              min={1}
              value={diasIncapacidad}
              onChange={(e) => setDiasIncapacidad(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400">Restricciones laborales / incapacidad (texto)</label>
          <textarea
            value={restriccionesLaborales}
            onChange={(e) => setRestriccionesLaborales(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">Indicaciones generales</label>
          <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={2} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void generarReceta()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500">
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
