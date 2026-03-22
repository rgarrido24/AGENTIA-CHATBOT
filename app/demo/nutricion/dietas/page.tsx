'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MOCK_PACIENTES,
  PLANES_DIETA,
  type DietaActual,
  type PlanDietaId,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from '../nutricion-context';

type GenForm = {
  objetivo: string;
  calorias: number;
  restricciones: string;
};

const ACCENT = '#16a34a';

function DietasInner() {
  const sp = useSearchParams();
  const prePaciente = sp.get('paciente') ?? '';
  const { dietas, addDieta, replaceDietaPaciente } = useNutricion();
  const [asignarA, setAsignarA] = useState<string>(prePaciente || MOCK_PACIENTES[0]!.id);
  const [planSel, setPlanSel] = useState<PlanDietaId>('plan-a');
  const [openId, setOpenId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genForm, setGenForm] = useState<GenForm>({
    objetivo: 'Bajar peso de forma sostenible',
    calorias: 1600,
    restricciones: 'Sin lactosa, sin refrescos',
  });
  const [genResult, setGenResult] = useState<string | null>(null);

  const unicos = useMemo(() => {
    const map = new Map<string, DietaActual>();
    dietas.forEach((d) => {
      map.set(d.pacienteId, d);
    });
    return Array.from(map.values());
  }, [dietas]);

  const asignarPlan = () => {
    const p = MOCK_PACIENTES.find((x) => x.id === asignarA);
    if (!p) return;
    const plan = PLANES_DIETA[planSel];
    const nueva: DietaActual = {
      id: `d-${asignarA}-${Date.now()}`,
      pacienteId: asignarA,
      fechaAsignacion: new Date().toISOString().slice(0, 10),
      nombre: `${plan.nombre} (asignado)`,
      contenido: plan.contenido,
      calorias: plan.calorias,
      proteinas: plan.proteinas,
      carbohidratos: plan.carbohidratos,
      grasas: plan.grasas,
      restricciones: [...plan.restricciones],
      alimentos_permitidos: [...plan.alimentos_permitidos],
      alimentos_prohibidos: [...plan.alimentos_prohibidos],
    };
    replaceDietaPaciente(asignarA, nueva);
  };

  const generarIA = async () => {
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/demo/nutricion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Genera un plan de 5 comidas (desayuno, colación, comida, merienda, cena) con objetivo: ${genForm.objetivo}, calorías objetivo ${genForm.calorias}, restricciones: ${genForm.restricciones}. Incluye macros aproximados y lista breve de alimentos. Responde solo con el plan en texto.`,
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
      setGenResult(text);
    } catch {
      setGenResult('No se pudo generar. Verifica GEMINI_API_KEY.');
    } finally {
      setGenLoading(false);
    }
  };

  const guardarGenerado = () => {
    if (!genResult) return;
    const p = MOCK_PACIENTES.find((x) => x.id === asignarA);
    if (!p) return;
    const nueva: DietaActual = {
      id: `d-gen-${Date.now()}`,
      pacienteId: asignarA,
      fechaAsignacion: new Date().toISOString().slice(0, 10),
      nombre: `Plan IA (${genForm.calorias} kcal)`,
      contenido: genResult,
      calorias: genForm.calorias,
      proteinas: Math.round(genForm.calorias * 0.3 / 4),
      carbohidratos: Math.round(genForm.calorias * 0.4 / 4),
      grasas: Math.round(genForm.calorias * 0.3 / 9),
      restricciones: genForm.restricciones.split(',').map((s) => s.trim()),
      alimentos_permitidos: PLANES_DIETA['plan-a'].alimentos_permitidos.slice(0, 12),
      alimentos_prohibidos: ['Ultraprocesados', 'Azúcar añadida'],
    };
    addDieta(nueva);
    replaceDietaPaciente(asignarA, nueva);
    setGenOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Asignar a paciente</label>
          <select
            value={asignarA}
            onChange={(e) => setAsignarA(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
          >
            {MOCK_PACIENTES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Plan</label>
          <select
            value={planSel}
            onChange={(e) => setPlanSel(e.target.value as PlanDietaId)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="plan-a">Hipocalórico 1,400</option>
            <option value="plan-b">Proteico 2,200</option>
            <option value="plan-c">Mantenimiento 1,800</option>
          </select>
        </div>
        <button
          type="button"
          onClick={asignarPlan}
          className="px-4 py-2 rounded-lg font-semibold text-white"
          style={{ background: ACCENT }}
        >
          Asignar dieta
        </button>
        <button
          type="button"
          onClick={() => setGenOpen(true)}
          className="px-4 py-2 rounded-lg border border-amber-500/50 text-amber-200 text-sm font-semibold"
        >
          + Generar plan con IA
        </button>
      </div>

      {genOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3"
        >
          <p className="text-sm font-semibold text-amber-200">Generador con Gemini</p>
          <input
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            value={genForm.objetivo}
            onChange={(e) => setGenForm((f) => ({ ...f, objetivo: e.target.value }))}
            placeholder="Objetivo"
          />
          <input
            type="number"
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            value={genForm.calorias}
            onChange={(e) => setGenForm((f) => ({ ...f, calorias: Number(e.target.value) || 0 }))}
          />
          <input
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            value={genForm.restricciones}
            onChange={(e) => setGenForm((f) => ({ ...f, restricciones: e.target.value }))}
            placeholder="Restricciones"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={genLoading}
              onClick={() => void generarIA()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {genLoading ? 'Generando…' : 'Generar'}
            </button>
            {genResult && (
              <button type="button" onClick={guardarGenerado} className="px-4 py-2 rounded-lg border border-white/20 text-sm">
                Guardar como plan del paciente seleccionado
              </button>
            )}
          </div>
          {genResult && (
            <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-[240px] overflow-y-auto">{genResult}</pre>
          )}
        </motion.div>
      )}

      <div className="space-y-6">
        {unicos.map((d) => {
          const pac = MOCK_PACIENTES.find((x) => x.id === d.pacienteId);
          const pctP = Math.min(100, Math.round((d.proteinas * 4 / d.calorias) * 100));
          const pctC = Math.min(100, Math.round((d.carbohidratos * 4 / d.calorias) * 100));
          const pctG = Math.min(100, Math.round((d.grasas * 9 / d.calorias) * 100));
          const open = openId === d.id;
          return (
            <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : d.id)}
                className="w-full text-left p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-white">{d.nombre}</p>
                  <p className="text-xs text-slate-500">{pac?.nombre}</p>
                </div>
                <span className="text-emerald-400 text-sm">{d.calorias} kcal</span>
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Macros</p>
                    <div className="space-y-1">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${pctP}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400">Proteína {d.proteinas}g ({pctP}%)</p>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${pctC}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400">Carbs {d.carbohidratos}g ({pctC}%)</p>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${pctG}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400">Grasas {d.grasas}g ({pctG}%)</p>
                    </div>
                  </div>
                  <details open className="text-sm">
                    <summary className="cursor-pointer text-emerald-400 font-medium">Horario de comidas</summary>
                    <p className="mt-2 text-slate-300 whitespace-pre-wrap text-xs">{d.contenido}</p>
                  </details>
                  <div>
                    <p className="text-xs text-emerald-400 mb-2">Permitidos</p>
                    <div className="flex flex-wrap gap-1">
                      {d.alimentos_permitidos.slice(0, 20).map((a) => (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-red-400 mb-2">Evitar</p>
                    <div className="flex flex-wrap gap-1">
                      {d.alimentos_prohibidos.map((a) => (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-200">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/demo/nutricion/chat?paciente=${d.pacienteId}`}
                    className="inline-block text-xs text-amber-300 underline"
                  >
                    Ver qué puede sustituir la IA →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DietasPage() {
  return (
    <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
      <DietasInner />
    </Suspense>
  );
}
