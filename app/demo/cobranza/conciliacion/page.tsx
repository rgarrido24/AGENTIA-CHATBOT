'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Loader2, Upload } from 'lucide-react';
import { MOCK_ALUMNOS, type Alumno, type StatusAlumno } from '@/lib/mock-data-cobranza';
import {
  aplicarConciliacionAuto,
  buildImpactoMock,
  buildMovimientosIniciales,
  type MovimientoBanco,
} from '@/lib/cobranza-conciliacion-mock';

function fmtMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function statusLabel(s: StatusAlumno) {
  const m: Record<StatusAlumno, string> = {
    al_corriente: 'al_corriente',
    adeudo: 'adeudo',
    riesgo: 'riesgo',
    baja_riesgo: 'baja_riesgo',
  };
  return m[s];
}

export default function ConciliacionPage() {
  const [cargandoDemo, setCargandoDemo] = useState(false);
  const [movs, setMovs] = useState<MovimientoBanco[] | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [impactoVisible, setImpactoVisible] = useState(false);
  const [drag, setDrag] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [manual, setManual] = useState<MovimientoBanco | null>(null);
  const [qAlum, setQAlum] = useState('');

  const impacto = useMemo(() => buildImpactoMock(), []);

  const filtroAlumnos = useMemo(() => {
    const t = qAlum.trim().toLowerCase();
    if (!t) return MOCK_ALUMNOS.slice(0, 8);
    return MOCK_ALUMNOS.filter(
      (a) =>
        a.nombre.toLowerCase().includes(t) || a.tutor.toLowerCase().includes(t) || a.id.toLowerCase().includes(t)
    ).slice(0, 12);
  }, [qAlum]);

  const cargarDemo = useCallback(async () => {
    setCargandoDemo(true);
    setMovs(null);
    setResultado(null);
    setImpactoVisible(false);
    await new Promise((r) => setTimeout(r, 1200));
    setMovs(buildMovimientosIniciales());
    setCargandoDemo(false);
  }, []);

  const conciliarAuto = useCallback(async () => {
    if (!movs) return;
    setProcesando(true);
    setResultado(null);
    await new Promise((r) => setTimeout(r, 1500));
    const next = aplicarConciliacionAuto(movs);
    setMovs(next);
    const c = next.filter((m) => m.status === 'Conciliado').length;
    const s = next.filter((m) => m.status === 'Sin identificar').length;
    const d = next.filter((m) => m.status === 'Duplicado').length;
    setResultado(`${c} pagos conciliados · ${s} sin identificar · ${d} duplicados`);
    setImpactoVisible(true);
    setProcesando(false);
  }, [movs]);

  const asignarManual = (al: Alumno) => {
    if (!manual) return;
    setMovs((prev) =>
      (prev ?? []).map((m) =>
        m.id === manual.id
          ? { ...m, status: 'Conciliado' as const, alumnoId: al.id, concepto: `SPEI — ${al.nombre}` }
          : m
      )
    );
    setManual(null);
    setQAlum('');
    setToast('Pago asignado (demo local).');
    setTimeout(() => setToast(null), 2500);
  };

  const onFile = useCallback(() => {
    void cargarDemo();
  }, [cargarDemo]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div
        className="rounded-xl border-2 border-blue-600/50 bg-[#0f172a] p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
        style={{ boxShadow: '0 0 24px rgba(30, 64, 175, 0.12)' }}
      >
        <div className="flex gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-blue-900/80 border border-blue-500/50 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-sm text-slate-200 leading-relaxed">
            <p className="font-semibold text-white">MODO DEMO — Conciliación bancaria simulada</p>
            <p className="text-slate-400 mt-1">
              En producción se conecta a tu banco vía SPEI/CLABE o a plataformas como Conekta, Stripe o Mercado Pago para
              detectar pagos automáticamente por referencia.
            </p>
          </div>
        </div>
        <a
          href="mailto:contacto@agentia.mx?subject=Integración%20conciliación%20bancaria"
          className="inline-flex justify-center items-center px-4 py-2.5 rounded-lg bg-[#1e40af] hover:bg-blue-800 text-sm font-semibold text-white transition whitespace-nowrap"
        >
          Contactar a Agentia
        </a>
      </div>

      {/* Sección 1 */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">Subir estado de cuenta bancario</h2>
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void cargarDemo();
          }}
          onKeyDown={(e) => e.key === 'Enter' && void cargarDemo()}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
            drag ? 'border-blue-400 bg-blue-950/30' : 'border-white/20 bg-white/[0.02]'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-slate-500 mb-3" />
          <p className="text-white font-medium">Arrastra tu estado de cuenta</p>
          <p className="text-slate-500 text-sm mt-1">o haz clic para seleccionar archivo</p>
          <p className="text-xs text-slate-600 mt-2">.CSV · .XLS · .XLSX · .TXT</p>
          <button
            type="button"
            onClick={onFile}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm"
          >
            Seleccionar archivo
          </button>
          <p className="text-slate-600 text-xs my-4">── O usa datos de ejemplo ──</p>
          <button
            type="button"
            onClick={() => void cargarDemo()}
            disabled={cargandoDemo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1e40af] hover:bg-blue-800 text-sm font-medium disabled:opacity-60"
          >
            {cargandoDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Cargar movimientos de demostración
          </button>
        </div>

        {cargandoDemo && (
          <div className="mt-4 space-y-2 animate-pulse">
            <div className="h-10 bg-white/5 rounded-lg" />
            <div className="h-10 bg-white/5 rounded-lg" />
            <div className="h-10 bg-white/5 rounded-lg" />
          </div>
        )}
      </section>

      {/* Sección 2 */}
      {movs && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Movimientos bancarios</h2>
            <button
              type="button"
              disabled={procesando}
              onClick={() => void conciliarAuto()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-semibold disabled:opacity-60"
            >
              {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Conciliar automáticamente
            </button>
          </div>
          {resultado && (
            <p className="text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded-lg px-3 py-2">
              {resultado}
            </p>
          )}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                    <th className="px-3 py-3 font-medium">Fecha</th>
                    <th className="px-3 py-3 font-medium">Referencia</th>
                    <th className="px-3 py-3 font-medium">Concepto / ordenante</th>
                    <th className="px-3 py-3 font-medium">Monto</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {movs.map((m) => (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 text-slate-300">{m.fecha}</td>
                      <td className="px-3 py-2.5 text-white font-mono text-xs">{m.referencia}</td>
                      <td className="px-3 py-2.5 text-slate-400 max-w-[220px] truncate" title={m.concepto}>
                        {m.concepto}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtMoney(m.monto)}</td>
                      <td className="px-3 py-2.5">
                        {m.status === 'Conciliado' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Conciliado
                          </span>
                        )}
                        {m.status === 'Sin identificar' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40">
                            Sin identificar
                          </span>
                        )}
                        {m.status === 'Duplicado' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                            Duplicado
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {m.status === 'Sin identificar' && (
                          <button
                            type="button"
                            onClick={() => {
                              setManual(m);
                              setQAlum('');
                            }}
                            className="text-xs text-blue-300 hover:underline"
                          >
                            Asignar manualmente
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Sección 3 */}
      {impactoVisible && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Alumnos actualizados en esta conciliación</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-white/10 bg-white/[0.03]">
                    <th className="px-3 py-3 font-medium">Alumno</th>
                    <th className="px-3 py-3 font-medium">Monto aplicado</th>
                    <th className="px-3 py-3 font-medium">Status anterior</th>
                    <th className="px-3 py-3 font-medium">Status nuevo</th>
                    <th className="px-3 py-3 font-medium">Fecha aplicación</th>
                    <th className="px-3 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {impacto.map((row) => (
                    <tr key={row.alumnoId} className="border-b border-white/5">
                      <td className="px-3 py-2.5 text-white font-medium">{row.nombre}</td>
                      <td className="px-3 py-2.5 tabular-nums">{fmtMoney(row.monto)}</td>
                      <td className="px-3 py-2.5 text-slate-400">{statusLabel(row.statusAntes)}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-slate-500">{statusLabel(row.statusAntes)}</span>
                        <span className="mx-1 text-slate-600">→</span>
                        <span
                          className={
                            row.statusDespues === 'al_corriente'
                              ? 'text-emerald-400 font-medium'
                              : 'text-amber-300 font-medium'
                          }
                        >
                          {statusLabel(row.statusDespues)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 text-xs">{row.fecha}</td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/demo/cobranza/cobranza?id=${encodeURIComponent(row.alumnoId)}`}
                          className="text-xs text-blue-300 hover:underline"
                        >
                          Ver estado de cuenta
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            En producción, este proceso puede ejecutarse automáticamente cada hora mediante webhook bancario o consulta
            programada a la API de tu banco.
          </p>
        </section>
      )}

      <AnimatePresence>
        {manual && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setManual(null)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-2rem,420px)] rounded-xl border border-white/10 bg-[#0f172a] p-5 shadow-2xl max-h-[80vh] flex flex-col"
            >
              <p className="text-white font-medium mb-2">Asignar pago manualmente</p>
              <p className="text-xs text-slate-500 mb-3 font-mono">{manual.referencia}</p>
              <input
                value={qAlum}
                onChange={(e) => setQAlum(e.target.value)}
                placeholder="Buscar alumno…"
                className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white mb-3"
              />
              <ul className="overflow-y-auto flex-1 space-y-1 min-h-[120px] max-h-[200px]">
                {filtroAlumnos.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => asignarManual(a)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/10"
                    >
                      {a.nombre} <span className="text-slate-500">· {a.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setManual(null)}
                className="mt-4 px-4 py-2 rounded-lg border border-white/15 text-sm self-end"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
