'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOCK_PACIENTES,
  ultimaMedicion,
  type MedicionInBody,
} from '@/lib/mock-data-nutricion';
import { useNutricion } from '../nutricion-context';

type InbodyForm = {
  pacienteId: string;
  fecha: string;
  peso: string;
  grasaCorporal: string;
  masaMuscular: string;
  grasaVisceral: string;
  aguaCorporal: string;
  edadMetabolica: string;
};

function imcFromPeso(peso: number): number {
  const alt = 1.64;
  return Math.round((peso / (alt * alt)) * 10) / 10;
}

function InbodyInner() {
  const sp = useSearchParams();
  const pre = sp.get('paciente') ?? 'p01';
  const { mediciones, addMedicion, addLogro } = useNutricion();
  const [manual, setManual] = useState<boolean>(true);
  const [form, setForm] = useState<InbodyForm>({
    pacienteId: pre,
    fecha: new Date().toISOString().slice(0, 10),
    peso: '',
    grasaCorporal: '',
    masaMuscular: '',
    grasaVisceral: '10',
    aguaCorporal: '',
    edadMetabolica: '',
  });
  const [ocrBusy, setOcrBusy] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, pacienteId: pre }));
  }, [pre]);

  const prevUlt = ultimaMedicion(form.pacienteId, mediciones);

  const guardar = () => {
    const peso = Number(form.peso);
    const gc = Number(form.grasaCorporal);
    const mm = Number(form.masaMuscular);
    const gv = Number(form.grasaVisceral);
    const agua = Number(form.aguaCorporal);
    const edM = Number(form.edadMetabolica);
    if (!peso || !gc || !mm) return;

    const ideal = Math.round((22 * 1.64 * 1.64) * 10) / 10;
    const nueva: MedicionInBody = {
      id: `m-live-${Date.now()}`,
      pacienteId: form.pacienteId,
      fecha: form.fecha,
      peso,
      grasaCorporal: gc,
      masaMuscular: mm,
      grasaVisceral: gv,
      aguaCorporal: agua || 55,
      edadMetabolica: edM || 35,
      IMC: imcFromPeso(peso),
      pesoIdeal: ideal,
    };
    addMedicion(nueva);

    let msg: string | null = null;
    if (prevUlt) {
      if (peso < prevUlt.peso - 0.1) {
        msg = `💪 ¡Bajaste ${(prevUlt.peso - peso).toFixed(1)}kg desde tu última medición!`;
      }
      if (gv < prevUlt.grasaVisceral) {
        msg = `❤️ ¡Tu grasa visceral bajó al nivel ${gv}!`;
      }
    }
    const p = MOCK_PACIENTES.find((x) => x.id === form.pacienteId);
    if (p && Math.abs(peso - p.pesoMetaKg) < 0.6) {
      msg = '🏆 ¡OBJETIVO ALCANZADO! ¡Felicidades!';
    }
    if (msg) {
      const emoji = msg.includes('🏆') ? '🏆' : msg.includes('❤️') ? '❤️' : '💪';
      addLogro({
        id: `l-${Date.now()}`,
        pacienteId: form.pacienteId,
        fecha: form.fecha,
        tipo: 'peso',
        descripcion: msg,
        emoji,
      });
      setCelebrate(msg);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2500);
    }
  };

  const runOcr = async (file: File) => {
    setOcrBusy(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const s = String(r.result ?? '');
          const raw = s.includes(',') ? s.split(',')[1] ?? '' : s;
          resolve(raw);
        };
        r.onerror = () => reject(new Error('lectura'));
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/demo/nutricion/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: b64, mimeType: file.type || 'image/jpeg' }),
      });
      const data = await res.json();
      if (data.peso != null) setForm((f) => ({ ...f, peso: String(data.peso) }));
      if (data.grasaCorporal != null) setForm((f) => ({ ...f, grasaCorporal: String(data.grasaCorporal) }));
      if (data.masaMuscular != null) setForm((f) => ({ ...f, masaMuscular: String(data.masaMuscular) }));
      if (data.grasaVisceral != null) setForm((f) => ({ ...f, grasaVisceral: String(data.grasaVisceral) }));
      if (data.aguaCorporal != null) setForm((f) => ({ ...f, aguaCorporal: String(data.aguaCorporal) }));
      if (data.edadMetabolica != null) setForm((f) => ({ ...f, edadMetabolica: String(data.edadMetabolica) }));
    } finally {
      setOcrBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-24">
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={() => setManual(true)}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${manual ? 'bg-emerald-600 text-white' : 'border border-white/15 text-slate-400'}`}
        >
          Captura manual
        </button>
        <button
          type="button"
          onClick={() => setManual(false)}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${!manual ? 'bg-emerald-600 text-white' : 'border border-white/15 text-slate-400'}`}
        >
          OCR ticket
        </button>
      </div>

      {!manual && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 space-y-3">
          <p className="text-sm font-semibold text-emerald-200">📷 ¡Nuevo! Captura automática con IA</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Toma una foto del ticket de la báscula InBody y la IA extrae los datos automáticamente.
          </p>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void runOcr(f);
              }}
            />
            <span className="flex items-center justify-center w-full py-4 rounded-xl bg-emerald-600 text-white font-semibold cursor-pointer text-lg">
              {ocrBusy ? 'Analizando ticket…' : '📷 Tomar foto / Subir imagen'}
            </span>
          </label>
        </div>
      )}

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs text-slate-500">Paciente</span>
          <select
            value={form.pacienteId}
            onChange={(e) => setForm((f) => ({ ...f, pacienteId: e.target.value }))}
            className="mt-1 w-full text-lg py-3 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
          >
            {MOCK_PACIENTES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Fecha</span>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
            className="mt-1 w-full text-lg py-3 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Peso (kg)</span>
          <input
            inputMode="decimal"
            value={form.peso}
            onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))}
            className="mt-1 w-full text-2xl py-4 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
            placeholder="0.0"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">% Grasa corporal</span>
          <input
            inputMode="decimal"
            value={form.grasaCorporal}
            onChange={(e) => setForm((f) => ({ ...f, grasaCorporal: e.target.value }))}
            className="mt-1 w-full text-xl py-3 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Masa muscular (kg)</span>
          <input
            inputMode="decimal"
            value={form.masaMuscular}
            onChange={(e) => setForm((f) => ({ ...f, masaMuscular: e.target.value }))}
            className="mt-1 w-full text-xl py-3 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
          />
        </label>
        <div>
          <span className="text-xs text-slate-500">Grasa visceral (1–20)</span>
          <input
            type="range"
            min={1}
            max={20}
            value={Number(form.grasaVisceral) || 10}
            onChange={(e) => setForm((f) => ({ ...f, grasaVisceral: e.target.value }))}
            className="w-full mt-2 accent-emerald-500"
          />
          <p className="text-center text-emerald-400 font-bold text-lg">{form.grasaVisceral}</p>
        </div>
        <label className="block">
          <span className="text-xs text-slate-500">% Agua corporal</span>
          <input
            inputMode="decimal"
            value={form.aguaCorporal}
            onChange={(e) => setForm((f) => ({ ...f, aguaCorporal: e.target.value }))}
            className="mt-1 w-full text-xl py-3 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Edad metabólica</span>
          <input
            inputMode="numeric"
            value={form.edadMetabolica}
            onChange={(e) => setForm((f) => ({ ...f, edadMetabolica: e.target.value }))}
            className="mt-1 w-full text-xl py-3 px-4 rounded-xl bg-slate-900 border border-white/15 text-white"
          />
        </label>
        <button
          type="button"
          onClick={guardar}
          className="w-full py-4 rounded-xl bg-emerald-600 text-white text-lg font-bold shadow-lg shadow-emerald-900/40"
        >
          Guardar medición
        </button>
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 z-50 rounded-xl border border-emerald-500/50 bg-emerald-950/95 p-4 text-center text-emerald-100 shadow-2xl"
          >
            {celebrate}
          </motion.div>
        )}
      </AnimatePresence>

      {confetti && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {Array.from({ length: 28 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ y: -20, x: `${(i * 13) % 100}%`, opacity: 1 }}
              animate={{ y: '100vh', rotate: 360 }}
              transition={{ duration: 2 + (i % 3) * 0.2, ease: 'linear' }}
              className="absolute w-2 h-2 rounded-sm"
              style={{
                background: ['#16a34a', '#f59e0b', '#22d3ee', '#f472b6'][i % 4],
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InbodyPage() {
  return (
    <Suspense fallback={<div className="text-slate-500 text-center py-12">Cargando…</div>}>
      <InbodyInner />
    </Suspense>
  );
}
