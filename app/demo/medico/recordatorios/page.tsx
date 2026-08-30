'use client';

import { useMemo } from 'react';
import { Bell } from 'lucide-react';
import {
  HOY_MED,
  MOCK_ESTUDIOS,
  pacientesSinRevision6Meses,
  ultimaConsulta,
} from '@/lib/mock-data-medico';
import { useMedico } from '../medico-context';

export default function RecordatoriosPage() {
  const { pacientes, consultas } = useMedico();

  const sinRevision = useMemo(
    () => pacientesSinRevision6Meses(pacientes, consultas, HOY_MED),
    [pacientes, consultas]
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 flex gap-3 items-start">
        <Bell className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-100">
          Recordatorios automáticos de seguimiento. En producción se envían por SMS, correo o WhatsApp según la política del
          centro.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-lg mb-4">Pacientes sin consulta en más de 6 meses</h2>
        <ul className="space-y-4">
          {sinRevision.map(({ paciente, dias, ultimaFecha }) => {
            const doc = paciente.medicoTratante;
            const msg = `Estimado/a ${paciente.nombre}, es hora de su revisión semestral con ${doc}. Su última consulta fue el ${ultimaFecha}. ¿Agendamos? 📋`;
            return (
              <li key={paciente.id} className="rounded-xl border border-white/10 bg-[#0c1220] p-4">
                <p className="text-xs text-slate-500 mb-1">
                  {paciente.folio} · Sin visita hace {dias} días
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">{msg}</p>
              </li>
            );
          })}
          {sinRevision.length === 0 && <li className="text-slate-500 text-sm">Nadie supera el umbral en esta demo.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-lg mb-4">Estudios de seguimiento</h2>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 text-left">
                <th className="p-3">Paciente</th>
                <th className="p-3">Estudio</th>
                <th className="p-3">Solicitud</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ESTUDIOS.map((e) => (
                <tr key={e.id} className="border-b border-white/5">
                  <td className="p-3">{e.pacienteNombre}</td>
                  <td className="p-3 text-slate-300">{e.estudio}</td>
                  <td className="p-3 text-slate-400">{e.fechaSolicitud}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        e.estado === 'pendiente' ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200'
                      }`}
                    >
                      {e.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6">
        <h2 className="font-semibold mb-3">Próximos controles sugeridos (mock)</h2>
        <ul className="text-sm text-slate-300 space-y-2">
          {pacientes.slice(0, 5).map((p) => {
            const u = ultimaConsulta(consultas, p.id);
            return (
              <li key={p.id}>
                <span className="text-emerald-400">{p.nombre}</span> — última visita {u?.fecha ?? '—'} · recordatorio anual de
                laboratorio
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
