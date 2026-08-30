/**
 * read-smae.js — versión 2
 * Corrige el problema de fracciones convertidas a fechas por Excel.
 * Excel interpreta "1/2" como fecha "1 de febrero" → serial 44593.
 * La decodificación es: serial → fecha → día/mes → fracción original.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = 'C:/Users/Rodolfo/Downloads/SMAE.xlsx';
const outputDir = 'C:/Users/Rodolfo/Downloads';

// ── Decodificador de seriales de fecha → fracción ─────────────────────────────
// Excel origin: 1899-12-30
const EXCEL_ORIGIN = new Date(Date.UTC(1899, 11, 30));

// Fracciones estándar del SMAE
const FRACCIONES_VALIDAS = new Set(['1/2','1/3','1/4','2/3','3/4','1/8','3/8','1/6','2/4']);

function serialToFraction(n) {
  if (typeof n !== 'number' || n < 40000 || n > 50000) return null;
  const ms = EXCEL_ORIGIN.getTime() + n * 86400000;
  const d = new Date(ms);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  if (day >= 1 && day <= 9 && month >= 1 && month <= 12) {
    const frac = `${day}/${month}`;
    if (FRACCIONES_VALIDAS.has(frac)) return frac;
    // Fracción no estándar → "1 pza" es el valor más común en estos casos
    if (day === 1) return '1 pza';
    return frac; // dejar la fracción aunque no sea canónica
  }
  return null;
}

// ── Leer celda raw con tipo correcto ─────────────────────────────────────────
function readCell(sheet, address) {
  const cell = sheet[address];
  if (!cell) return '';

  // Tipo 'd' = fecha, 'n' = número, 's' = string, 'b' = bool
  if (cell.t === 'n' || cell.t === 'd') {
    const frac = serialToFraction(cell.v);
    if (frac) return frac;
    // Número real (gramos, ml, piezas)
    if (Number.isFinite(cell.v)) return String(cell.v);
  }
  if (cell.t === 's') return String(cell.v).trim();
  // Fallback: usar el valor formateado si existe
  if (cell.w) return String(cell.w).trim();
  return String(cell.v ?? '').trim();
}

// ── Hoja a array de arrays con celdas correctas ───────────────────────────────
function sheetToRows(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      row.push(readCell(sheet, addr));
    }
    if (row.some(v => v !== '')) rows.push(row);
  }
  return rows;
}

// ── Cargar libro ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile(filePath, { cellDates: false, raw: true });

console.log(`\nTotal de hojas: ${wb.SheetNames.length}`);
console.log('─'.repeat(40));
wb.SheetNames.forEach((name, i) => console.log(`  ${String(i+1).padStart(2)}. ${name}`));
console.log('─'.repeat(40));

// ── Procesar cada hoja ────────────────────────────────────────────────────────
const grupos = [];

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  if (!sheet['!ref']) { grupos.push({ nombre: name, vacia: true }); continue; }

  const rows = sheetToRows(sheet);
  if (rows.length === 0) { grupos.push({ nombre: name, vacia: true }); continue; }

  // Encontrar fila de encabezados
  let headerRow = -1, colAlimento = -1, colPorcion = -1;
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const lower = rows[r].map(c => String(c).toLowerCase());
    const hasAli = lower.findIndex(c =>
      c.includes('alimento') || c.includes('nombre') || c.includes('descripci')
    );
    if (hasAli >= 0) {
      const hasPor = lower.findIndex(c =>
        c.includes('porci') || c.includes('raci') || c.includes('gramo') ||
        c.includes('medida') || c.includes('cantidad')
      );
      headerRow = r;
      colAlimento = hasAli;
      colPorcion = hasPor >= 0 ? hasPor : hasAli + 1;
      break;
    }
  }

  // Macronutrientes en cabecera (primeras 15 filas)
  let calorias = '', proteina = '', grasa = '', cho = '', porcionEq = '';
  for (let r = 0; r < Math.min(15, rows.length); r++) {
    const joined = rows[r].join(' ').toLowerCase();
    const nums = rows[r].filter(c => c !== '' && !isNaN(Number(c)) && Number(c) < 1000);
    if ((joined.includes('calor') || joined.includes('kcal')) && !calorias && nums.length) calorias = nums[0];
    if (joined.includes('prote') && !proteina && nums.length) proteina = nums[0];
    if ((joined.includes('grasa') || joined.includes('líp') || joined.includes('lip')) && !grasa && nums.length) grasa = nums[0];
    if ((joined.includes(' cho') || joined.includes('carbo') || joined.includes('hidrat')) && !cho && nums.length) cho = nums[0];
    if (joined.includes('porci') && joined.includes('equiv') && !porcionEq) {
      const val = rows[r].filter(c => c !== '').slice(-1)[0];
      if (val) porcionEq = val;
    }
  }

  // Alimentos
  const alimentos = [];
  if (headerRow >= 0) {
    for (let r = headerRow + 1; r < rows.length; r++) {
      const aliVal = String(rows[r][colAlimento] ?? '').trim();
      let porVal = colPorcion >= 0 ? String(rows[r][colPorcion] ?? '').trim() : '';
      // Ignorar filas de totales o vacías
      if (!aliVal || aliVal.toLowerCase() === 'alimento' || aliVal.toLowerCase() === 'nombre') continue;
      if (/^total|subtotal/i.test(aliVal)) continue;
      alimentos.push({ alimento: aliVal.toUpperCase(), porcion: porVal });
    }
  } else {
    // Sin encabezado claro: primeras 2 columnas no vacías
    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r].filter(c => c !== '');
      if (cols.length >= 1) alimentos.push({ alimento: String(cols[0]).toUpperCase(), porcion: cols[1] ? String(cols[1]) : '' });
    }
  }

  grupos.push({ nombre: name, porcionEquivalente: porcionEq, calorias, proteina, grasa, cho, alimentos });
}

// ── Muestra de 5 alimentos para verificar ────────────────────────────────────
console.log('\n── MUESTRA DE VERIFICACIÓN (primeras 5 líneas de cada grupo) ──');
for (const g of grupos.slice(0, 4)) {
  if (g.vacia) { console.log(`\n${g.nombre}: (vacía)`); continue; }
  console.log(`\n${g.nombre}:`);
  (g.alimentos || []).slice(0, 5).forEach(a => {
    console.log(`  - ${a.alimento}: ${a.porcion || '(sin porción)'}`);
  });
}

// ── Generar TXT ───────────────────────────────────────────────────────────────
const lines = [];
for (const g of grupos) {
  lines.push(`GRUPO: ${g.nombre}`);
  if (g.vacia) { lines.push('  (hoja vacía)'); lines.push(''); continue; }
  if (g.porcionEquivalente) lines.push(`Porción equivalente: ${g.porcionEquivalente}`);
  if (g.calorias || g.proteina || g.grasa || g.cho) {
    lines.push(`Calorías: ${g.calorias || '?'} | Proteína: ${g.proteina || '?'}g | Grasa: ${g.grasa || '?'}g | CHO: ${g.cho || '?'}g`);
  }
  if (g.alimentos && g.alimentos.length > 0) {
    lines.push('');
    lines.push('ALIMENTOS:');
    for (const a of g.alimentos) {
      lines.push(`  - ${a.alimento}${a.porcion ? ': ' + a.porcion : ''}`);
    }
  }
  lines.push('');
}

const txtOut = path.join(outputDir, 'smae-completo.txt');
fs.writeFileSync(txtOut, lines.join('\n'), 'utf8');
console.log(`\n✓ TXT: ${txtOut}`);

// ── Generar JSON ──────────────────────────────────────────────────────────────
const jsonOut = path.join(outputDir, 'smae-completo.json');
fs.writeFileSync(jsonOut, JSON.stringify(grupos, null, 2), 'utf8');
console.log(`✓ JSON: ${jsonOut}`);

// ── Stats ─────────────────────────────────────────────────────────────────────
const totalAlimentos = grupos.reduce((s, g) => s + (g.alimentos?.length || 0), 0);
const corrupted = lines.filter(l => /\b4[0-9]{4}\b/.test(l)).length;
console.log(`\nTotal alimentos: ${totalAlimentos}`);
console.log(`Líneas con seriales de fecha restantes: ${corrupted}`);
