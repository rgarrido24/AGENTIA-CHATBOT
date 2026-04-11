import { readFileSync } from 'fs';
import { join } from 'path';

export type AlimentoSMAE = {
  nombre: string;
  porcionCasera: string;
};

export type GrupoSMAE = {
  nombre: string;
  slug: string;
  labelCorto: string;
  emoji: string;
  proteina: number;
  grasa: number;
  cho: number;
  calorias: number;
  alimentos: AlimentoSMAE[];
};

// ── Macros estándar del SMAE por equivalente ─────────────────────────────────
const MACROS: Record<string, { prot: number; grasa: number; cho: number; kcal: number; emoji: string; label: string }> = {
  'VERDURAS':                      { prot: 2, grasa: 0, cho: 4,  kcal: 25,  emoji: '🥦', label: 'Verduras' },
  'FRUTAS':                        { prot: 0, grasa: 0, cho: 15, kcal: 60,  emoji: '🍎', label: 'Frutas' },
  'CEREALES SIN GRASA':            { prot: 2, grasa: 0, cho: 15, kcal: 70,  emoji: '🌽', label: 'Cereales s/grasa' },
  'CEREALES CON GRASA':            { prot: 2, grasa: 5, cho: 15, kcal: 115, emoji: '🥐', label: 'Cereales c/grasa' },
  'LEGUMINOSAS':                   { prot: 9, grasa: 1, cho: 20, kcal: 120, emoji: '🫘', label: 'Leguminosas' },
  'POA MUY BAJO APORTE DE GRASA':  { prot: 7, grasa: 1, cho: 0,  kcal: 40,  emoji: '🍗', label: 'POA Muy bajo' },
  'POA BAJO APORTE DE GRASA':      { prot: 7, grasa: 3, cho: 0,  kcal: 55,  emoji: '🥩', label: 'POA Bajo' },
  'POA MODERADO APORTE DE GRASA':  { prot: 7, grasa: 5, cho: 0,  kcal: 75,  emoji: '🥚', label: 'POA Moderado' },
  'POA ALTO APORTE DE GRASAS':     { prot: 7, grasa: 8, cho: 0,  kcal: 100, emoji: '🥓', label: 'POA Alto' },
  'LECHE DESCREMADA':              { prot: 9, grasa: 2, cho: 12, kcal: 95,  emoji: '🥛', label: 'Leche descremada' },
  'LECHE SEMI DESCREMADA':         { prot: 9, grasa: 4, cho: 12, kcal: 110, emoji: '🥛', label: 'Leche semidesc.' },
  'LECHE ENTERA':                  { prot: 9, grasa: 8, cho: 12, kcal: 150, emoji: '🥛', label: 'Leche entera' },
  'LECHE CON AZÚCAR':              { prot: 8, grasa: 5, cho: 30, kcal: 200, emoji: '🥛', label: 'Leche c/azúcar' },
  'ACEITES Y GRASAS':              { prot: 0, grasa: 5, cho: 0,  kcal: 45,  emoji: '🫒', label: 'Aceites/Grasas' },
  'ACEITES Y GRASAS CON PROTEÍNA': { prot: 3, grasa: 5, cho: 3,  kcal: 70,  emoji: '🥜', label: 'Grasas c/prot.' },
  'AZÚCARES SIN GRASA':            { prot: 0, grasa: 0, cho: 10, kcal: 40,  emoji: '🍯', label: 'Azúcares' },
  'AZÚCARES CON GRASA':            { prot: 0, grasa: 5, cho: 10, kcal: 85,  emoji: '🍫', label: 'Azúcares c/grasa' },
  'ALIMENTOS LIBRES DE ENERGÍA':   { prot: 0, grasa: 0, cho: 0,  kcal: 0,   emoji: '🌿', label: 'Libres' },
  'BEBIDAS ALCOHOLICAS':           { prot: 0, grasa: 0, cho: 0,  kcal: 90,  emoji: '🍷', label: 'Bebidas alc.' },
  'PRODUCTOS YAKULT':              { prot: 1, grasa: 0, cho: 8,  kcal: 35,  emoji: '🧃', label: 'Yakult' },
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

let _cache: GrupoSMAE[] | null = null;

export function parseSMAE(): GrupoSMAE[] {
  if (_cache) return _cache;

  const raw = readFileSync(join(process.cwd(), 'lib', 'smae-completo.txt'), 'utf-8');
  const lines = raw.split('\n');

  const grupos: GrupoSMAE[] = [];
  let current: GrupoSMAE | null = null;
  let inAlimentos = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('GRUPO:')) {
      if (current) grupos.push(current);
      const nombre = trimmed.replace('GRUPO:', '').trim();
      // Normalizar nombre para buscar en MACROS (quitar acentos del key)
      const macroKey = Object.keys(MACROS).find(k =>
        k === nombre ||
        k === nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() ||
        nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().startsWith(k.slice(0, 10))
      ) ?? nombre.toUpperCase().trim();
      const m = MACROS[macroKey] ?? { prot: 0, grasa: 0, cho: 0, kcal: 0, emoji: '🍽️', label: nombre };
      current = {
        nombre,
        slug: toSlug(nombre),
        labelCorto: m.label,
        emoji: m.emoji,
        proteina: m.prot,
        grasa: m.grasa,
        cho: m.cho,
        calorias: m.kcal,
        alimentos: [],
      };
      inAlimentos = false;
      continue;
    }

    if (trimmed === 'ALIMENTOS:') { inAlimentos = true; continue; }
    if (trimmed.startsWith('Calorías:') || trimmed.startsWith('Porción equivalente:')) continue;
    if (!trimmed || trimmed === '(hoja vacía)') { inAlimentos = false; continue; }

    if (inAlimentos && trimmed.startsWith('-') && current) {
      // Formato: "- NOMBRE: porcion" o "- NOMBRE"
      const body = trimmed.slice(1).trim();
      const colonIdx = body.lastIndexOf(':');
      if (colonIdx > 0) {
        const nombre = body.slice(0, colonIdx).trim();
        const porcion = body.slice(colonIdx + 1).trim();
        if (nombre) current.alimentos.push({ nombre, porcionCasera: porcion });
      } else if (body) {
        current.alimentos.push({ nombre: body, porcionCasera: '' });
      }
    }
  }

  if (current) grupos.push(current);
  _cache = grupos;
  return grupos;
}

export function buscarAlimento(query: string, grupos: GrupoSMAE[]): Array<AlimentoSMAE & { grupo: string; emoji: string }> {
  if (!query.trim()) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const results: Array<AlimentoSMAE & { grupo: string; emoji: string }> = [];
  for (const g of grupos) {
    for (const a of g.alimentos) {
      const name = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (name.includes(q)) results.push({ ...a, grupo: g.nombre, emoji: g.emoji });
    }
  }
  return results.slice(0, 50);
}
