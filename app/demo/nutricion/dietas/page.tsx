'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_PACIENTES,
  PLANES_DIETA,
  BANCO_RECETAS,
  type DietaActual,
  type DiaMenu,
  type Receta,
  type PlanDietaId,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from '../nutricion-context';

const ACCENT = '#16a34a';
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'] as const;
const TIEMPO_EMOJIS: Record<string, string> = {
  Desayuno: '🌅', 'Colación AM': '🍎', Comida: '🍽️', Merienda: '🥤', Cena: '🌙',
};

type MainTab = 'semanal' | 'recetario' | 'gestion';
type GenForm = { objetivo: string; calorias: number; restricciones: string };

// ─── Modal Receta ──────────────────────────────────────────────────────────────
function ModalReceta({ receta, onClose }: { receta: Receta; onClose: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1625] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="h-40 rounded-t-2xl bg-gradient-to-br from-emerald-900/60 to-slate-900 flex items-center justify-center text-6xl">
          {receta.tags.includes('mexicana') ? '🇲🇽' : receta.tags.includes('vegetariana') ? '🥦' : '🍳'}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">{receta.nombre}</h2>
            <p className="text-sm text-slate-400 mt-1">{receta.descripcion}</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-slate-400">⏱️ {receta.tiempoPrep} min</span>
            <span className="text-emerald-400">🔥 {receta.calorias} kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg py-2">
              <p className="text-sky-300 font-bold text-sm">{receta.proteinas}g</p>
              <p className="text-sky-400/70">Proteína</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg py-2">
              <p className="text-amber-300 font-bold text-sm">{receta.carbohidratos}g</p>
              <p className="text-amber-400/70">Carbos</p>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg py-2">
              <p className="text-rose-300 font-bold text-sm">{receta.grasas}g</p>
              <p className="text-rose-400/70">Grasa</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-2">Ingredientes</p>
            <ul className="space-y-1">
              {receta.ingredientes.map((ing) => (
                <li key={ing} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChecked((c) => ({ ...c, [ing]: !c[ing] }))}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${checked[ing] ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}
                  >
                    {checked[ing] && <span className="text-white text-[10px]">✓</span>}
                  </button>
                  <span className={`text-sm ${checked[ing] ? 'line-through text-slate-500' : 'text-slate-300'}`}>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-400 mb-2">Preparación</p>
            <ol className="space-y-2">
              {receta.preparacion.map((paso, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-600/40 text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                  {paso}
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {receta.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                {tag === 'mexicana' ? '🇲🇽' : tag === 'alta proteína' ? '💪' : tag === 'rápida' ? '⚡' : tag === 'vegetariana' ? '🥦' : '•'} {tag}
              </span>
            ))}
          </div>
          <div className="border-t border-white/5 pt-3">
            <p className="text-[10px] text-slate-600">Referencia SMAE: {receta.equivalentesSMAE}</p>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Vista Paciente Mobile ─────────────────────────────────────────────────────
function ModalVistaPaciente({ semana, pacienteNombre, onClose }: {
  semana: DiaMenu[];
  pacienteNombre: string;
  onClose: () => void;
}) {
  const hoy = new Date().getDay();
  const idx = hoy === 0 ? 6 : hoy - 1;
  const dia = semana[Math.min(idx, semana.length - 1)]!;
  const [expandedTime, setExpandedTime] = useState<string | null>('Desayuno');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-[390px] max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
        style={{ background: '#f9fafb' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Phone header */}
        <div className="bg-emerald-600 text-white px-5 pt-5 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs opacity-75 font-medium">NutriVida</p>
              <h3 className="text-lg font-bold mt-0.5">Hola {pacienteNombre.split(' ')[0]} 👋</h3>
              <p className="text-sm opacity-90 mt-1">Tu menú de hoy — {dia.dia}</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/70 text-xl leading-none">✕</button>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {semana.map((d) => (
              <span key={d.dia} className={`flex-shrink-0 text-xs px-3 py-1 rounded-full ${d.dia === dia.dia ? 'bg-white text-emerald-700 font-bold' : 'bg-emerald-700/50 text-white/80'}`}>
                {d.dia.slice(0,3)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-3">
          {dia.tiempos.map((tiempo) => {
            const receta = tiempo.recetas[0]!;
            const expanded = expandedTime === tiempo.nombre;
            return (
              <div key={tiempo.nombre} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left p-4 flex items-center gap-3"
                  onClick={() => setExpandedTime(expanded ? null : tiempo.nombre)}
                >
                  <span className="text-2xl">{tiempo.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium">{tiempo.hora} · {tiempo.calorias} kcal</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{receta.nombre}</p>
                  </div>
                  <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">🛒 Ingredientes</p>
                      <ul className="space-y-1">
                        {receta.ingredientes.map((ing) => (
                          <li key={ing} className="text-sm text-gray-700 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">👩‍🍳 Preparación</p>
                      <ol className="space-y-1">
                        {receta.preparacion.map((paso, i) => (
                          <li key={i} className="text-sm text-gray-700">
                            <span className="font-semibold text-emerald-600">{i+1}.</span> {paso}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Total hoy: <span className="text-emerald-600 font-bold">{dia.totalCalorias} kcal</span></p>
            <span className="text-xs text-gray-400">Dra. Andrea Morales · NutriVida</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal Subir Receta ────────────────────────────────────────────────────────
function ModalSubirReceta({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ nombre: '', ingredientes: '', preparacion: '' });
  if (saved) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#0d1625] border border-emerald-500/40 rounded-2xl p-8 text-center max-w-sm w-full">
        <div className="text-5xl mb-3">✅</div>
        <p className="text-white font-semibold text-lg">¡Receta agregada!</p>
        <p className="text-slate-400 text-sm mt-1">La receta fue guardada en el recetario.</p>
        <button type="button" onClick={onClose} className="mt-4 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Cerrar</button>
      </motion.div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0d1625] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-white font-semibold">📷 Subir receta</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <input
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500"
            placeholder="Nombre de la receta"
            value={form.nombre}
            onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <textarea
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none"
            placeholder="Ingredientes (uno por línea)"
            rows={4}
            value={form.ingredientes}
            onChange={(e) => setForm(f => ({ ...f, ingredientes: e.target.value }))}
          />
          <textarea
            className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none"
            placeholder="Preparación (pasos)"
            rows={4}
            value={form.preparacion}
            onChange={(e) => setForm(f => ({ ...f, preparacion: e.target.value }))}
          />
          <button type="button" className="w-full py-2 border border-dashed border-white/20 rounded-lg text-slate-400 text-sm hover:border-emerald-500/50 hover:text-emerald-300 transition-colors">
            📎 Seleccionar foto (simulado)
          </button>
        </div>
        <div className="p-5 border-t border-white/10 flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-white/20 text-sm text-slate-300">Cancelar</button>
          <button
            type="button"
            onClick={() => { if (form.nombre) setSaved(true); }}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40"
            disabled={!form.nombre}
          >
            Guardar receta
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tab Menú Semanal ──────────────────────────────────────────────────────────
function TabMenuSemanal({
  semana,
  pacienteNombre,
  kcalObjetivo,
}: {
  semana: DiaMenu[];
  pacienteNombre: string;
  kcalObjetivo: number;
}) {
  const [diaIdx, setDiaIdx] = useState(0);
  const [recetaModal, setRecetaModal] = useState<Receta | null>(null);
  const dia = semana[diaIdx]!;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Día tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {semana.map((d, i) => (
          <button
            key={d.dia}
            type="button"
            onClick={() => setDiaIdx(i)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              i === diaIdx ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {d.dia.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Tiempo cards */}
      <div className="space-y-3 mt-2">
        {dia.tiempos.map((tiempo) => (
          <div key={tiempo.nombre} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <span className="text-lg">{tiempo.emoji}</span>
              <div>
                <span className="text-sm font-semibold text-white">{tiempo.nombre}</span>
                <span className="text-xs text-slate-500 ml-2">{tiempo.hora} · {tiempo.calorias} kcal</span>
              </div>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              {tiempo.recetas.map((receta) => (
                <button
                  key={receta.id}
                  type="button"
                  onClick={() => setRecetaModal(receta)}
                  className="text-left p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors group"
                >
                  <div className="text-2xl mb-1">
                    {receta.tags.includes('mexicana') ? '🇲🇽' : receta.tags.includes('vegetariana') ? '🥦' : receta.tags.includes('alta proteína') ? '💪' : '🍳'}
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight">{receta.nombre}</p>
                  <p className="text-[10px] text-slate-500 mt-1">⏱️ {receta.tiempoPrep} min · {receta.calorias} kcal</p>
                  <span className="text-[10px] text-emerald-400 group-hover:underline mt-1 block">Ver receta →</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Barra resumen del día */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Total: {dia.totalCalorias} / {kcalObjetivo} kcal</span>
              {Math.abs(dia.totalCalorias - kcalObjetivo) <= 50 && <span className="text-emerald-400 text-xs">✅</span>}
            </div>
            <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
              {dia.tiempos.map(t => (
                <span key={t.nombre}>{t.emoji} {t.calorias}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-xs text-slate-300 hover:bg-white/5"
            >
              📄 Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Print-only layout */}
      <div id="pdf-content" className="hidden print:block text-black text-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">NutriVida — Centro de Nutrición y Bienestar</h1>
          <p className="text-gray-600 mt-1">Plan semanal de alimentación — {pacienteNombre}</p>
          <p className="text-gray-500 text-sm mt-0.5">Objetivo: {kcalObjetivo} kcal/día</p>
        </div>
        {semana.map((d) => (
          <div key={d.dia} className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-2">{d.dia} — {d.totalCalorias} kcal</h2>
            {d.tiempos.map((t) => (
              <div key={t.nombre} className="mb-2 pl-3">
                <p className="font-semibold">{t.emoji} {t.nombre} ({t.hora}) — {t.calorias} kcal</p>
                {t.recetas.slice(0,1).map((r) => (
                  <div key={r.id} className="pl-4 text-gray-700">
                    <p>• {r.nombre}</p>
                    <p className="text-xs text-gray-500 pl-2">{r.ingredientes.join(' · ')}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div className="mt-8 text-center text-gray-500 text-xs border-t border-gray-200 pt-4">
          <p>Dra. Andrea Morales · NutriVida · Plan generado el {new Date().toLocaleDateString('es-MX')}</p>
        </div>
      </div>

      <AnimatePresence>
        {recetaModal && <ModalReceta receta={recetaModal} onClose={() => setRecetaModal(null)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Tab Recetario ─────────────────────────────────────────────────────────────
function TabRecetario() {
  const [filtroTiempo, setFiltroTiempo] = useState<string>('Todos');
  const [filtroTag, setFiltroTag] = useState<string>('Todos');
  const [recetaModal, setRecetaModal] = useState<Receta | null>(null);
  const [uploadModal, setUploadModal] = useState(false);

  const TIEMPOS_FILTER = ['Todos', 'Desayuno', 'Colación', 'Comida', 'Cena'];
  const TAGS_FILTER = ['Todos', '🇲🇽 Mexicana', '💪 Alta proteína', '⚡ Rápida', '🥦 Vegetariana'];

  const filtered = useMemo(() => {
    return BANCO_RECETAS.filter((r) => {
      const tagMatch =
        filtroTag === 'Todos' ||
        (filtroTag === '🇲🇽 Mexicana' && r.tags.includes('mexicana')) ||
        (filtroTag === '💪 Alta proteína' && r.tags.includes('alta proteína')) ||
        (filtroTag === '⚡ Rápida' && r.tags.includes('rápida')) ||
        (filtroTag === '🥦 Vegetariana' && r.tags.includes('vegetariana'));
      const tiempoMatch =
        filtroTiempo === 'Todos' ||
        (filtroTiempo === 'Desayuno' && r.id.startsWith('r-d')) ||
        (filtroTiempo === 'Colación' && r.id.startsWith('r-c')) ||
        (filtroTiempo === 'Comida' && r.id.startsWith('r-co')) ||
        (filtroTiempo === 'Cena' && r.id.startsWith('r-cn'));
      return tagMatch && tiempoMatch;
    });
  }, [filtroTiempo, filtroTag]);

  return (
    <>
      <div className="space-y-3">
        {/* Filtros tiempo */}
        <div className="flex gap-1.5 flex-wrap">
          {TIEMPOS_FILTER.map((f) => (
            <button key={f} type="button" onClick={() => setFiltroTiempo(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${filtroTiempo === f ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        {/* Filtros tags */}
        <div className="flex gap-1.5 flex-wrap">
          {TAGS_FILTER.map((f) => (
            <button key={f} type="button" onClick={() => setFiltroTag(f)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${filtroTag === f ? 'border border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border border-white/10 text-slate-500 hover:border-white/20 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {filtered.map((receta) => (
          <button
            key={receta.id}
            type="button"
            onClick={() => setRecetaModal(receta)}
            className="text-left p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors group flex flex-col"
          >
            <div className="h-20 rounded-lg bg-gradient-to-br from-emerald-900/40 to-slate-900 flex items-center justify-center text-4xl mb-3">
              {receta.tags.includes('mexicana') ? '🇲🇽' : receta.tags.includes('vegetariana') ? '🥦' : receta.tags.includes('alta proteína') ? '💪' : '🍳'}
            </div>
            <p className="text-sm font-semibold text-white leading-tight flex-1">{receta.nombre}</p>
            <p className="text-[10px] text-slate-500 mt-1">⏱️ {receta.tiempoPrep} min · 🔥 {receta.calorias} kcal</p>
            {receta.tags[0] && (
              <span className="text-[10px] text-emerald-400 mt-1 block">{receta.tags[0]}</span>
            )}
            <span className="text-xs text-emerald-400 group-hover:underline mt-2 block">+ Ver receta</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-12 text-sm">No hay recetas para este filtro.</p>
      )}

      {/* Floating upload button */}
      <button
        type="button"
        onClick={() => setUploadModal(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white text-sm font-semibold"
        style={{ background: ACCENT }}
      >
        📷 Subir receta con foto
      </button>

      <AnimatePresence>
        {recetaModal && <ModalReceta receta={recetaModal} onClose={() => setRecetaModal(null)} />}
        {uploadModal && <ModalSubirReceta onClose={() => setUploadModal(false)} />}
      </AnimatePresence>
    </>
  );
}

// ─── Tab Gestión ───────────────────────────────────────────────────────────────
function TabGestion({
  asignarA, setAsignarA, planSel, setPlanSel, onAsignar,
}: {
  asignarA: string;
  setAsignarA: (v: string) => void;
  planSel: PlanDietaId;
  setPlanSel: (v: PlanDietaId) => void;
  onAsignar: () => void;
}) {
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genForm, setGenForm] = useState<GenForm>({
    objetivo: 'Bajar peso de forma sostenible',
    calorias: 1400,
    restricciones: 'Sin lactosa, sin refrescos',
  });
  const [genResult, setGenResult] = useState<string | null>(null);
  const [semanal, setSemanal] = useState(false);
  const [semanalLoading, setSemanalLoading] = useState(false);
  const [semanalMsg, setSemanalMsg] = useState<string | null>(null);
  const { addDieta, replaceDietaPaciente } = useNutricion();

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

  const generarMenuSemanal = async () => {
    setSemanalLoading(true);
    setSemanalMsg(null);
    const pac = MOCK_PACIENTES.find((x) => x.id === asignarA);
    try {
      const res = await fetch('/api/demo/nutricion/plan-semanal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calorias: PLANES_DIETA[planSel].calorias,
          restricciones: PLANES_DIETA[planSel].restricciones,
          pacienteNombre: pac?.nombre ?? 'el paciente',
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setSemanalMsg('✅ Menú semanal generado con IA. Revisa la pestaña Menú Semanal.');
      } else {
        setSemanalMsg(`⚠️ ${data.error ?? 'Error al generar'}`);
      }
    } catch {
      setSemanalMsg('⚠️ No se pudo conectar al servidor.');
    } finally {
      setSemanalLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Asignar plan */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <p className="text-sm font-semibold text-white">Asignar plan a paciente</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Paciente</label>
            <select
              value={asignarA}
              onChange={(e) => setAsignarA(e.target.value)}
              className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            >
              {MOCK_PACIENTES.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
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
              <option value="plan-b">Proteico 1,600</option>
              <option value="plan-c">Mantenimiento 1,800</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="button" onClick={onAsignar}
              className="px-4 py-2 rounded-lg font-semibold text-white text-sm"
              style={{ background: ACCENT }}>
              Asignar dieta
            </button>
          </div>
        </div>
      </div>

      {/* Botones IA */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setGenOpen((v) => !v)}
          className="px-4 py-2 rounded-lg border border-amber-500/50 text-amber-200 text-sm font-semibold">
          ✨ Generar plan con IA
        </button>
        <button type="button" onClick={() => void generarMenuSemanal()} disabled={semanalLoading}
          className="px-4 py-2 rounded-lg border border-emerald-500/50 text-emerald-200 text-sm font-semibold disabled:opacity-50">
          {semanalLoading ? 'Generando…' : '📅 Generar menú semanal completo'}
        </button>
      </div>

      {semanalMsg && (
        <p className="text-sm text-slate-300 bg-white/5 rounded-lg px-3 py-2">{semanalMsg}</p>
      )}

      {genOpen && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-200">Generador con Gemini</p>
          <input className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            value={genForm.objetivo} onChange={(e) => setGenForm((f) => ({ ...f, objetivo: e.target.value }))}
            placeholder="Objetivo" />
          <input type="number" className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            value={genForm.calorias} onChange={(e) => setGenForm((f) => ({ ...f, calorias: Number(e.target.value) || 0 }))} />
          <input className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            value={genForm.restricciones} onChange={(e) => setGenForm((f) => ({ ...f, restricciones: e.target.value }))}
            placeholder="Restricciones" />
          <div className="flex gap-2">
            <button type="button" disabled={genLoading} onClick={() => void generarIA()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50">
              {genLoading ? 'Generando…' : 'Generar'}
            </button>
            {genResult && (
              <button type="button" onClick={guardarGenerado}
                className="px-4 py-2 rounded-lg border border-white/20 text-sm text-slate-200">
                Guardar en paciente
              </button>
            )}
          </div>
          {genResult && (
            <pre className="text-xs text-slate-300 whitespace-pre-wrap max-h-[240px] overflow-y-auto">{genResult}</pre>
          )}
        </motion.div>
      )}

      {/* Lista de dietas asignadas */}
      <div>
        <p className="text-xs text-slate-500 mb-3 font-semibold uppercase tracking-wide">Dietas actuales asignadas</p>
        <GestionDietas />
      </div>
    </div>
  );
}

function GestionDietas() {
  const { dietas } = useNutricion();
  const unicos = useMemo(() => {
    const map = new Map<string, DietaActual>();
    dietas.forEach((d) => { map.set(d.pacienteId, d); });
    return Array.from(map.values());
  }, [dietas]);

  return (
    <div className="space-y-2">
      {unicos.map((d) => {
        const pac = MOCK_PACIENTES.find((x) => x.id === d.pacienteId);
        const pctP = Math.min(100, Math.round((d.proteinas * 4 / d.calorias) * 100));
        const pctC = Math.min(100, Math.round((d.carbohidratos * 4 / d.calorias) * 100));
        const pctG = Math.min(100, Math.round((d.grasas * 9 / d.calorias) * 100));
        return (
          <div key={d.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-white">{pac?.nombre}</p>
                <p className="text-xs text-slate-500">{d.nombre} · {d.calorias} kcal</p>
              </div>
              <span className="text-xs text-emerald-400">{d.semana ? '📅 Menú rico' : '📝 Texto'}</span>
            </div>
            <div className="mt-2 space-y-1">
              {[
                { label: `P ${d.proteinas}g (${pctP}%)`, pct: pctP, color: 'bg-sky-500' },
                { label: `C ${d.carbohidratos}g (${pctC}%)`, pct: pctC, color: 'bg-amber-500' },
                { label: `G ${d.grasas}g (${pctG}%)`, pct: pctG, color: 'bg-rose-500' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 w-24">{label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function DietasInner() {
  const sp = useSearchParams();
  const prePaciente = sp.get('paciente') ?? '';
  const { dietas, addDieta, replaceDietaPaciente } = useNutricion();

  const [mainTab, setMainTab] = useState<MainTab>('semanal');
  const [asignarA, setAsignarA] = useState<string>(prePaciente || MOCK_PACIENTES[0]!.id);
  const [planSel, setPlanSel] = useState<PlanDietaId>('plan-a');
  const [pacienteView, setPacienteView] = useState(false);

  const currentDieta = useMemo(
    () => dietas.find((d) => d.pacienteId === asignarA),
    [dietas, asignarA]
  );
  const semana: DiaMenu[] = currentDieta?.semana ?? PLANES_DIETA[planSel].semana ?? [];
  const kcalObjetivo = currentDieta?.calorias ?? PLANES_DIETA[planSel].calorias;
  const pac = MOCK_PACIENTES.find((p) => p.id === asignarA);

  const asignarPlan = () => {
    const plan = PLANES_DIETA[planSel];
    const nueva: DietaActual = {
      id: `d-${asignarA}-${Date.now()}`,
      pacienteId: asignarA,
      fechaAsignacion: new Date().toISOString().slice(0, 10),
      nombre: `${plan.nombre} (asignado)`,
      semana: plan.semana ? [...plan.semana] : undefined,
      calorias: plan.calorias,
      proteinas: plan.proteinas,
      carbohidratos: plan.carbohidratos,
      grasas: plan.grasas,
      restricciones: [...plan.restricciones],
      alimentos_permitidos: [...plan.alimentos_permitidos],
      alimentos_prohibidos: [...plan.alimentos_prohibidos],
    };
    replaceDietaPaciente(asignarA, nueva);
    addDieta(nueva);
  };

  const TABS: { id: MainTab; label: string }[] = [
    { id: 'semanal', label: '📅 Menú Semanal' },
    { id: 'recetario', label: '🍽️ Recetario' },
    { id: 'gestion', label: '⚙️ Gestión' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 print:max-w-full print:space-y-0">
      {/* Patient selector + patient view button */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Paciente</label>
          <select
            value={asignarA}
            onChange={(e) => setAsignarA(e.target.value)}
            className="bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
          >
            {MOCK_PACIENTES.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setPacienteView(true)}
            className="px-4 py-2 rounded-lg border border-white/20 text-sm text-slate-300 hover:bg-white/5"
          >
            📱 Ver menú como paciente
          </button>
        </div>
        {currentDieta && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500">{currentDieta.nombre}</span>
            <span className="text-xs font-bold text-emerald-400">{currentDieta.calorias} kcal/día</span>
          </div>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-white/10 print:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMainTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              mainTab === tab.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="print:hidden">
        {mainTab === 'semanal' && semana.length > 0 && (
          <TabMenuSemanal semana={semana} pacienteNombre={pac?.nombre ?? ''} kcalObjetivo={kcalObjetivo} />
        )}
        {mainTab === 'semanal' && semana.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-3">🥗</p>
            <p>No hay menú semanal asignado para este paciente.</p>
            <button type="button" onClick={() => setMainTab('gestion')}
              className="mt-3 text-sm text-emerald-400 underline">
              Asignar un plan →
            </button>
          </div>
        )}
        {mainTab === 'recetario' && <TabRecetario />}
        {mainTab === 'gestion' && (
          <TabGestion
            asignarA={asignarA}
            setAsignarA={setAsignarA}
            planSel={planSel}
            setPlanSel={setPlanSel}
            onAsignar={asignarPlan}
          />
        )}
      </div>

      {/* Print content (visible only when printing) */}
      <div className="hidden print:block">
        {semana.length > 0 && (
          <div className="text-black text-sm">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">NutriVida — Centro de Nutrición y Bienestar</h1>
              <p className="text-gray-600 mt-1">Plan semanal de alimentación — {pac?.nombre}</p>
              <p className="text-gray-500 text-sm mt-0.5">Objetivo: {kcalObjetivo} kcal/día</p>
            </div>
            {semana.map((d) => (
              <div key={d.dia} className="mb-6 break-inside-avoid">
                <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-2">{d.dia} — {d.totalCalorias} kcal</h2>
                {d.tiempos.map((t) => (
                  <div key={t.nombre} className="mb-2 pl-3">
                    <p className="font-semibold">{t.emoji} {t.nombre} ({t.hora}) — {t.calorias} kcal</p>
                    {t.recetas.slice(0,1).map((r) => (
                      <div key={r.id} className="pl-4 text-gray-700">
                        <p>• {r.nombre}</p>
                        <p className="text-xs text-gray-500 pl-2">{r.ingredientes.join(' · ')}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-8 text-center text-gray-500 text-xs border-t border-gray-200 pt-4">
              <p>Dra. Andrea Morales · NutriVida · Plan generado el {new Date().toLocaleDateString('es-MX')}</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {pacienteView && semana.length > 0 && (
          <ModalVistaPaciente
            semana={semana}
            pacienteNombre={pac?.nombre ?? 'Paciente'}
            onClose={() => setPacienteView(false)}
          />
        )}
      </AnimatePresence>
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
