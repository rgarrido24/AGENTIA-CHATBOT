'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { Calendar, MessageCircle, PawPrint } from 'lucide-react';
import {
  FECHA_REF_GROOMING,
  getDueño,
  getMascota,
  getServicioG,
  historialMockParaMascota,
} from '@/lib/mock-data-grooming';
import { useGrooming } from '../../grooming-context';

const ACCENT = '#f97316';

export default function MascotaFichaPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { citas, notasMascota, setNotaMascota } = useGrooming();
  const [localNotas, setLocalNotas] = useState('');

  const m = getMascota(id);
  const d = m ? getDueño(m.dueñoId) : undefined;

  useEffect(() => {
    if (!m) return;
    setLocalNotas(notasMascota[m.id] ?? m.notasEspeciales);
  }, [m, notasMascota]);

  const proxima = useMemo(() => {
    if (!m) return null;
    return citas
      .filter((c) => c.mascotaId === m.id && c.fecha >= FECHA_REF_GROOMING && c.status !== 'cancelada' && c.status !== 'completada')
      .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
  }, [citas, m]);

  const historial = m ? historialMockParaMascota(m.id) : [];

  if (!m || !d) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Mascota no encontrada.</p>
        <Link href="/demo/grooming/mascotas" className="text-orange-400 mt-4 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  const tel = d.telefono.replace(/\D/g, '');
  const wa = `https://wa.me/52${tel}`;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Link href="/demo/grooming/mascotas" className="text-sm text-slate-500 hover:text-orange-400">
        ← Mascotas
      </Link>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="text-6xl">{m.foto}</span>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <PawPrint className="w-7 h-7" style={{ color: ACCENT }} />
              {m.nombre}
            </h1>
            <p className="text-slate-400 mt-1">
              {m.raza} · {m.tamaño} · {m.edad} años · {m.peso} kg
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Último grooming: {m.ultimoGrooming}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold mb-3">Dueño</h2>
        <p className="text-white">{d.nombre}</p>
        <p className="text-sm text-slate-400">{d.telefono}</p>
        <p className="text-sm text-slate-400">{d.email}</p>
        <p className="text-xs text-slate-500 mt-2">
          Nivel {d.nivel} · Pref. {d.preferencia}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold mb-2">Salud y comportamiento</h2>
        <p className="text-sm">
          <span className="text-slate-500">Alergias:</span> {m.alergias}
        </p>
        <p className="text-sm mt-1">
          <span className="text-slate-500">Comportamiento:</span> {m.comportamiento}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold mb-3">Notas del groomer</h2>
        <textarea
          value={localNotas}
          onChange={(e) => {
            setLocalNotas(e.target.value);
            setNotaMascota(m.id, e.target.value);
          }}
          rows={4}
          className="w-full rounded-xl bg-slate-900 border border-white/10 px-4 py-3 text-sm"
          placeholder="Escribe notas para el próximo servicio…"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold mb-4">Historial (antes / después — demo)</h2>
        <ul className="space-y-3">
          {historial.map((h, i) => (
            <li key={i} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <p className="font-medium">{h.servicio}</p>
                <p className="text-xs text-slate-500">{h.fecha}</p>
              </div>
              <div className="flex items-center gap-3 text-2xl">
                <span title="Antes">{h.antes}</span>
                <span className="text-slate-600">→</span>
                <span title="Después">{h.después}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-orange-500/30 bg-orange-950/20 p-6">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-400" />
          Próxima cita
        </h2>
        {proxima ? (
          <p className="text-slate-300">
            {proxima.fecha} {proxima.hora} — {getServicioG(proxima.servicioId)?.nombre}
          </p>
        ) : (
          <p className="text-slate-500 text-sm">Sin cita futura registrada.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/demo/grooming/agenda"
          className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-white"
          style={{ background: ACCENT }}
        >
          Agendar
        </Link>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-500/50 text-emerald-300 font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp al dueño
        </a>
      </div>
    </div>
  );
}
