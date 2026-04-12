'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_CITAS_SEMANA,
  MOCK_PACIENTES,
  pacientesActivosEnRiesgo,
  ultimaMedicion,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from '../nutricion-context';
import { useNutricionTheme } from '../nutricion-theme-context';

function previewMsg(p: (typeof MOCK_PACIENTES)[0], mediciones: ReturnType<typeof useNutricion>['mediciones']): string {
  const ult = ultimaMedicion(p.id, mediciones);
  const meta = MOCK_PACIENTES.find((x) => x.id === p.id)?.pesoMetaKg ?? 0;
  if (p.diasSinRegistro >= 5) {
    return `Hola ${p.nombre.split(' ')[0]} 👋 Notamos que llevas unos días sin registrar. No pasa nada, cada día es una nueva oportunidad.\nUn pequeño paso cuenta más que ninguno.\n¿Cómo te has sentido esta semana?\n— Dra. Andrea 💪`;
  }
  if (ult && Math.abs(ult.peso - meta) < 2) {
    return `¡${p.nombre.split(' ')[0].toUpperCase()}! 🏆 Estás a solo ${Math.abs(ult.peso - meta).toFixed(1)}kg de tu meta.\n¡Estás en la recta final!\nEste fin de semana puede ser decisivo. ¡No te rindas ahora!\n— Dra. Andrea 🎯`;
  }
  const ini = mediciones.filter((m) => m.pacienteId === p.id).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
  const baj = ini && ult ? (ini.peso - ult.peso).toFixed(1) : '0';
  return `¡Hola ${p.nombre.split(' ')[0]}! 💚 Los resultados del lunes se construyen hoy sábado.\nLlevas ${baj}kg menos — ¡eso es real y es tuyo!\nRecuerda tu meta: ${p.motivacion}\n¡Tú puedes! — Dra. Andrea 🌟`;
}

export default function RecordatoriosPage() {
  const { mediciones, weekendBotOn, setWeekendBotOn } = useNutricion();
  const { colors, theme } = useNutricionTheme();
  const isLight = theme === 'light';
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rescate, setRescate] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activos = MOCK_PACIENTES.filter((p) => p.status === 'activo');
  const activosBot = activos.filter((p) => p.diasSinRegistro <= 14).length;
  const riesgo = pacientesActivosEnRiesgo(7);

  const nextSab = useMemo(() => {
    const d = new Date('2026-03-22T12:00:00');
    const day = d.getDay();
    const add = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + add);
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });
  }, []);

  const generarRescate = async (pid: string) => {
    setLoadingId(pid);
    try {
      const p = MOCK_PACIENTES.find((x) => x.id === pid);
      if (!p) return;
      const res = await fetch('/api/demo/nutricion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Escribe un mensaje de WhatsApp corto y empático para ${p.nombre} que lleva ${p.diasSinRegistro} días sin registrar mediciones. Motivación: ${p.motivacion}. Firma Dra. Andrea Morales.`,
          mode: 'nutriologa',
          messages: [],
        }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let text = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
        }
      }
      setRescate((s) => ({ ...s, [pid]: text }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Bot motivacional */}
      <motion.div
        className="rounded-2xl p-6"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #fffbeb, #fef3c7)'
            : 'linear-gradient(135deg, rgba(120,53,15,0.3), transparent)',
          border: `1px solid ${isLight ? '#fde68a' : 'rgba(245,158,11,0.4)'}`,
        }}
        layout
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-lg font-bold flex items-center gap-2" style={{ color: colors.textPrimary }}>
              🤖 Bot motivacional de fin de semana
            </p>
            <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
              Todos los sábados a las 11:00 AM el sistema envía un mensaje personalizado a cada paciente activo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWeekendBotOn(!weekendBotOn)}
            className={`relative w-14 h-8 rounded-full transition-colors ${weekendBotOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
            aria-pressed={weekendBotOn}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform ${
                weekendBotOn ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
        <p className="text-sm mt-4" style={{ color: isLight ? '#15803d' : '#6ee7b7' }}>
          <strong>{weekendBotOn ? 'ON' : 'OFF'}</strong> · Activo para {activosBot} pacientes
        </p>
        <p className="text-xs mt-2" style={{ color: colors.textMuted }}>Próximo envío: {nextSab} · 11:00 AM</p>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            border: `1px solid ${isLight ? '#fde68a' : 'rgba(245,158,11,0.5)'}`,
            color: isLight ? '#b45309' : '#fcd34d',
          }}
        >
          Ver preview de mensajes
        </button>
      </motion.div>

      {/* Preview modal */}
      <AnimatePresence>
        {previewOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setPreviewOpen(false)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-h-[80vh] overflow-y-auto mx-auto max-w-lg rounded-2xl p-6 shadow-2xl"
              style={{ background: colors.sidebarBg, border: `1px solid ${colors.border}` }}
            >
              <p className="font-semibold mb-4" style={{ color: colors.textPrimary }}>Preview por paciente</p>
              <div className="space-y-4">
                {['p01', 'p02', 'p03'].map((id) => {
                  const p = MOCK_PACIENTES.find((x) => x.id === id)!;
                  const txt = previewMsg(p, mediciones);
                  return (
                    <div
                      key={id}
                      className="rounded-xl p-3 text-xs whitespace-pre-wrap"
                      style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                    >
                      <p className="text-emerald-600 font-medium mb-2">{p.nombre}</p>
                      {txt}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${p.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`,
                              '_blank'
                            )
                          }
                          className="text-[10px] px-2 py-1 rounded bg-[#25D366] text-white"
                        >
                          Enviar ahora
                        </button>
                        <button
                          type="button"
                          className="text-[10px] px-2 py-1 rounded"
                          style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}
                        >
                          Personalizar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="mt-6 w-full py-2 rounded-lg text-sm"
                style={{ border: `1px solid ${colors.border}`, color: colors.textSecondary }}
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Recordatorios de consulta */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textPrimary }}>
          Recordatorios de consulta (próxima semana)
        </h2>
        <ul className="space-y-2">
          {MOCK_CITAS_SEMANA.slice(0, 8).map((c) => {
            const p = MOCK_PACIENTES.find((x) => x.id === c.pacienteId);
            const msg = `Hola ${p?.nombre.split(' ')[0]}, te recordamos tu consulta mañana ${new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long' })} a las ${c.hora} con la Dra. Andrea.\n¡Recuerda traer tu ticket de báscula! 📋`;
            return (
              <li
                key={c.id}
                className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ background: colors.cardBg, border: `1px solid ${colors.border}` }}
              >
                <div className="flex-1 text-xs" style={{ color: colors.textSecondary }}>
                  <span className="text-emerald-600 font-mono">{c.fecha}</span> {c.hora} · {p?.nombre}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${p?.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
                      '_blank'
                    )
                  }
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: isLight ? '#dcfce7' : 'rgba(22,163,74,0.2)',
                    color: isLight ? '#15803d' : '#86efac',
                  }}
                >
                  Recordatorio 24h
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Alertas de abandono */}
      <div>
        <h2 className="text-sm font-semibold text-red-500 mb-3">Alertas de abandono</h2>
        <p className="text-xs mb-4" style={{ color: colors.textMuted }}>Ordenados por gravedad (más días sin registro primero)</p>
        <ul className="space-y-4">
          {riesgo.map((p) => (
            <li
              key={p.id}
              className="rounded-xl p-4"
              style={{
                background: isLight ? '#fff5f5' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${isLight ? '#fecaca' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              <p className="font-medium" style={{ color: colors.textPrimary }}>{p.nombre}</p>
              <p className="text-xs text-red-500">{p.diasSinRegistro} días sin registro</p>
              <button
                type="button"
                disabled={loadingId === p.id}
                onClick={() => void generarRescate(p.id)}
                className="mt-3 text-xs px-3 py-1.5 rounded-lg disabled:opacity-50"
                style={{ background: colors.cardBgAlt, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
              >
                {loadingId === p.id ? 'Generando…' : 'Generar mensaje de rescate (IA)'}
              </button>
              {rescate[p.id] && (
                <pre className="mt-3 text-xs whitespace-pre-wrap" style={{ color: colors.textSecondary }}>{rescate[p.id]}</pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
