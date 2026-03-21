'use client';

import { useMemo, useState } from 'react';
import { FileDown } from 'lucide-react';
import { generarRecetaPdf } from '@/lib/dentista-pdf';
import { DENTISTAS, HOY_DENT, type RecetaHistorial } from '@/lib/mock-data-dentista';
import { useDentista } from '../dentista-context';

export default function RecetasPage() {
  const { pacientes, recetasHistorial, addReceta } = useDentista();
  const [pacId, setPacId] = useState('p1');
  const [fecha, setFecha] = useState(HOY_DENT);
  const [dentista, setDentista] = useState(DENTISTAS[0]!.nombre);
  const [diagnostico, setDiagnostico] = useState('Control post-tratamiento');
  const [indicaciones, setIndicaciones] = useState('Tomar con alimentos. Reposo 24h.');
  const [meds, setMeds] = useState([
    { nombre: 'Ibuprofeno', presentacion: '400mg', dosis: '1 tableta', frecuencia: 'cada 8 horas', duracion: '3 días', indicaciones: 'Con alimentos' },
  ]);

  const p = pacientes.find((x) => x.id === pacId);

  const agregarMed = () =>
    setMeds([...meds, { nombre: '', presentacion: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' }]);

  const generar = async () => {
    if (!p) return;
    await generarRecetaPdf({
      paciente: p,
      fecha,
      dentista,
      cedula: '1234567',
      medicamentos: meds.filter((m) => m.nombre.trim()),
      indicacionesGenerales: indicaciones,
      diagnostico,
    });
    const r: RecetaHistorial = {
      id: `rx-${Date.now()}`,
      pacienteId: p.id,
      pacienteNombre: p.nombre,
      fecha,
      dentista,
      diagnostico,
    };
    addReceta(r);
  };

  const lista = useMemo(() => recetasHistorial, [recetasHistorial]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <h2 className="font-semibold text-lg">Generador de receta médica (PDF)</h2>
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
            <label className="text-xs text-slate-400">Dentista</label>
            <select value={dentista} onChange={(e) => setDentista(e.target.value)} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm">
              {DENTISTAS.map((d) => (
                <option key={d.id} value={d.nombre}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Medicamentos</p>
          {meds.map((m, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2 text-xs">
              <input placeholder="Nombre" value={m.nombre} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, nombre: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Presentación" value={m.presentacion} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, presentacion: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Dosis" value={m.dosis} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, dosis: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Frecuencia" value={m.frecuencia} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, frecuencia: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Duración" value={m.duracion} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, duracion: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
              <input placeholder="Indicaciones" value={m.indicaciones} onChange={(e) => { const x = [...meds]; x[i] = { ...x[i]!, indicaciones: e.target.value }; setMeds(x); }} className="rounded bg-slate-900 border border-white/10 px-2 py-1" />
            </div>
          ))}
          <button type="button" onClick={agregarMed} className="text-xs text-sky-400">
            + Agregar
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-400">Diagnóstico (receta)</label>
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} rows={2} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400">Indicaciones generales</label>
          <textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={2} className="mt-1 w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm" />
        </div>

        <button type="button" onClick={() => void generar()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-sky-600 hover:bg-sky-500">
          <FileDown className="w-5 h-5" />
          Generar Receta PDF
        </button>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 bg-white/[0.03] font-medium text-sm">Historial de recetas emitidas</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-slate-500">
              <th className="p-3">Fecha</th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Dentista</th>
              <th className="p-3">Diagnóstico</th>
            </tr>
          </thead>
          <tbody>
            {lista.slice(0, 12).map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="p-3">{r.fecha}</td>
                <td className="p-3">{r.pacienteNombre}</td>
                <td className="p-3 text-slate-400">{r.dentista}</td>
                <td className="p-3 text-slate-400">{r.diagnostico}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
