import { getMongoDb } from '../../lib/mongodb';

const isCoberturaFile = (filename: string, content?: string) => {
  if (/cobertura|coverage|d_codigo|codigo|postal|^cp\.|_cp\.|codigos/i.test(filename))
    return true;
  if (content && /### CP con Internet y TV|### Lista completa CP|### CP con solo TV|### CP sin venta directa/i.test(content))
    return true;
  return false;
};

type CoverageResult =
  | { found: true; tipo: 'on_net'; cp: string }
  | { found: true; tipo: 'off_net'; cp: string }
  | { found: true; tipo: 'no_venta'; cp: string }
  | { found: false; cp: string };

/** Sanitiza valor de celda: minúsculas, solo a-z0-9. "On Net" → "onnet" */
function sanitizeCell(val: unknown): string {
  return String(val ?? '')
    .replace(/\u00A0/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeCP(val: unknown): string {
  const s = String(val ?? '').trim();
  const digits = s.replace(/\D/g, '');
  return digits.length >= 5 ? digits.slice(-5) : digits;
}

function isOnNet(tipo: string): boolean {
  const s = sanitizeCell(tipo);
  return s.includes('onnet');
}

function isOffNet(tipo: string): boolean {
  const s = sanitizeCell(tipo);
  return s.includes('offnet') || s.includes('offred');
}

function isVentaDirecta(tipo: string): boolean {
  const s = sanitizeCell(tipo);
  return s.includes('ventadirecta');
}

function isCPHeader(sanitized: string): boolean {
  return (
    sanitized === 'dcodigo' ||
    sanitized.includes('codigopostal') ||
    sanitized === 'cp' ||
    sanitized.includes('codigo') ||
    sanitized.includes('postal')
  );
}

function isTipoPlazaHeader(sanitized: string): boolean {
  return (
    sanitized.includes('tipoplaza') ||
    sanitized.includes('cobertura') ||
    sanitized === 'red' ||
    sanitized.includes('estatus')
  );
}

function isTipoInstalacHeader(sanitized: string): boolean {
  return (
    sanitized.includes('tipoinstalac') ||
    sanitized.includes('tipoinsta') ||
    sanitized.includes('instalac') ||
    sanitized === 'insta'
  );
}

/**
 * Busca un CP en los archivos de cobertura del cliente.
 * Solo lee de la DB y busca en memoria; NO inyecta el archivo completo al prompt.
 */
export async function lookupCoverageByCP(
  clientId: string,
  cp: string
): Promise<CoverageResult> {
  const normalized = String(clientId ?? '').trim().toLowerCase();
  const cpClean = normalizeCP(cp);
  if (!normalized || !cpClean || cpClean.length < 5) {
    console.log(`🔍 [coverage-lookup] CP rechazado (inválido o corto): "${cp}" → "${cpClean}"`);
    return { found: false, cp: cpClean || String(cp).trim() };
  }

  const db = await getMongoDb();
  const docs = await db
    .collection<{ clientId: string; filename: string; content: string }>('knowledge_docs')
    .find({ clientId: normalized })
    .toArray();

  const coverageDocs = docs
    .filter((d) => isCoberturaFile(d.filename, d.content))
    .sort((a, b) => ((b as { uploadedAt?: Date }).uploadedAt?.getTime() ?? 0) - ((a as { uploadedAt?: Date }).uploadedAt?.getTime() ?? 0));
  console.log(`📊 [coverage-lookup] Documentos de cobertura encontrados en la BD: ${coverageDocs.length} (total docs: ${docs.length})`);
  if (coverageDocs.length > 0) {
    coverageDocs.forEach((d, i) =>
      console.log(`   Doc ${i + 1}: "${d.filename}" (${(d.content || '').length} chars)`)
    );
  }

  if (coverageDocs.length === 0) {
    console.log(`✅ [coverage-lookup] Resultado para CP ${cpClean}: no encontrado (sin docs de cobertura)`);
    return { found: false, cp: cpClean };
  }

  const results: CoverageResult[] = [];
  for (const doc of coverageDocs) {
    const content = String(doc.content ?? '').trim();
    const result = parseCoverageContent(content, cpClean);
    if (result) {
      results.push(result);
      const tipoLabel = 'tipo' in result ? result.tipo : '?';
      console.log(`   → "${doc.filename}": ${tipoLabel}`);
    }
  }

  if (results.length === 0) {
    console.log(`✅ [coverage-lookup] Resultado para CP ${cpClean}: no encontrado (no match en ningún doc)`);
    return { found: false, cp: cpClean };
  }

  const onNet = results.find((r) => r.found && r.tipo === 'on_net');
  const offNet = results.find((r) => r.found && r.tipo === 'off_net');
  const noVenta = results.find((r) => r.found && r.tipo === 'no_venta');
  const final = onNet ?? offNet ?? noVenta ?? results[0];
  console.log(`✅ [coverage-lookup] Resultado para CP ${cpClean}: ${final.found ? final.tipo : 'no encontrado'} (priorizado on_net)`);
  return final;
}

function parseCoverageContent(content: string, cp: string): CoverageResult | null {
  const cpStr = normalizeCP(cp);

  const noVentaSection = content.match(/### CP sin venta directa\s*\n([\s\S]*?)(?=\n###|$)/i);
  const onNetSection = content.match(/### CP con Internet y TV \(on net\)\s*\n([\s\S]*?)(?=\n###|$)/i);
  const offNetSection = content.match(/### CP con solo TV \(off net[^)]*\)\s*\n([\s\S]*?)(?=\n###|$)/i);
  const listaSection = content.match(/### Lista completa CP[^\n]*\n([\s\S]*?)(?=\n###|$)/i);

  if (noVentaSection) {
    const list = noVentaSection[1].replace(/\s+/g, ' ').trim();
    const cpsInList = list.split(/[;,]+/).map((s) => normalizeCP(s.trim())).filter(Boolean);
    if (cpsInList.includes(cpStr)) return { found: true, tipo: 'no_venta', cp: cpStr };
  }

  if (onNetSection) {
    const list = onNetSection[1].replace(/\s+/g, ' ').trim();
    const cpsInList = list.split(/[;,]+/).map((s) => normalizeCP(s.trim())).filter(Boolean);
    if (cpsInList.includes(cpStr)) return { found: true, tipo: 'on_net', cp: cpStr };
    if (cpsInList.length > 0 && cpsInList.length <= 20) {
      console.log(`🔍 [coverage-lookup] CP ${cpStr} NO en onNet. Lista tiene: [${cpsInList.join(', ')}]`);
    }
  }

  if (offNetSection) {
    const list = offNetSection[1].replace(/\s+/g, ' ').trim();
    const cpsInList = list.split(/[;,]+/).map((s) => normalizeCP(s.trim())).filter(Boolean);
    if (cpsInList.includes(cpStr)) return { found: true, tipo: 'off_net', cp: cpStr };
  }

  if (listaSection) {
    const lines = listaSection[1].split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx < 0) continue;
      const lineCp = normalizeCP(trimmed.slice(0, colonIdx));
      const tipo = trimmed.slice(colonIdx + 1).trim();
      if (lineCp === cpStr && tipo) {
        if (isVentaDirecta(tipo)) return { found: true, tipo: 'no_venta', cp: cpStr };
        if (isOnNet(tipo)) return { found: true, tipo: 'on_net', cp: cpStr };
        if (isOffNet(tipo)) return { found: true, tipo: 'off_net', cp: cpStr };
        return { found: true, tipo: 'on_net', cp: cpStr };
      }
    }
  }

  const rawResult = parseRawCsvContent(content, cpStr);
  if (rawResult) return rawResult;

  return null;
}

/** Detecta el delimitador dominante de una línea CSV (tab, punto y coma, coma). */
function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    '\t': (line.match(/\t/g) ?? []).length,
    ';': (line.match(/;/g) ?? []).length,
    ',': (line.match(/,/g) ?? []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ',';
}

function parseRawCsvContent(content: string, cp: string): CoverageResult | null {
  const cleanContent = content.replace(/^\uFEFF/, '').trim();
  const allLines = cleanContent.split(/\r?\n/).filter(Boolean);
  if (allLines.length < 2) return null;

  // Auto-detectar delimitador usando la primera línea con varios tokens
  const delimChar = detectDelimiter(allLines.slice(0, 5).join('\n'));
  const delimRe = new RegExp(delimChar === '\t' ? '\t' : delimChar === ';' ? ';' : ',');

  // Buscar la fila de encabezados: la primera que tenga al menos 2 columnas
  let headerIdx = 0;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(5, allLines.length); i++) {
    const cols = allLines[i].split(delimRe).map((h) => sanitizeCell(h));
    if (cols.length >= 2) { headers = cols; headerIdx = i; break; }
  }
  if (headers.length === 0) {
    // Una sola columna - puede ser CSV con delimitador diferente; loguear y salir
    console.log(`🔍 [coverage-lookup] CSV raw: no columna CP. Headers(sanit)=[${allLines[0].split(delimRe).map(sanitizeCell).join(', ')}] delim="${delimChar === '\t' ? '\\t' : delimChar}"`);
    return null;
  }

  const lines = allLines.slice(headerIdx + 1);

  const cpIdx = headers.findIndex(isCPHeader);
  const tipoPlazaIdx = headers.findIndex(isTipoPlazaHeader);
  const tipoInstalacIdx = headers.findIndex(isTipoInstalacHeader);

  if (cpIdx < 0) {
    console.log(`🔍 [coverage-lookup] CSV raw: no columna CP. Headers(sanit)=[${headers.join(', ')}] delim="${delimChar === '\t' ? '\\t' : delimChar}"`);
    return null;
  }

  console.log(`🔍 [coverage-lookup] CSV raw: cpIdx=${cpIdx} tipoPlazaIdx=${tipoPlazaIdx} instalacIdx=${tipoInstalacIdx} filas=${lines.length} delim="${delimChar === '\t' ? '\\t' : delimChar}"`);

  const tipoCol = tipoPlazaIdx >= 0 ? tipoPlazaIdx : cpIdx + 1;
  const instalacCol = tipoInstalacIdx >= 0 ? tipoInstalacIdx : cpIdx + 2;

  const cpSanitized = normalizeCP(cp);
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(delimRe).map((c) => String(c ?? '').replace(/\u00A0/g, ' ').trim());
    const rowCp = normalizeCP(cols[cpIdx]);
    if (rowCp !== cpSanitized) continue;

    const tipoPlazaRaw = cols[tipoCol] ?? cols[cpIdx + 1] ?? '';
    const tipoInstalacRaw = cols[instalacCol] ?? cols[cpIdx + 2] ?? '';
    const tipoPlazaSanit = sanitizeCell(tipoPlazaRaw);
    const tipoInstalacSanit = sanitizeCell(tipoInstalacRaw);

    const rawLineDebug = [...rawLine].map((ch) => (ch.charCodeAt(0) < 32 || ch.charCodeAt(0) > 126 ? `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}` : ch)).join('');
    console.log(
      [
        '╔═══════════════════════════════════════════════════════════════════════════════════',
        '║ LÍNEA CRUDA CSV QUE COINCIDE CON CP ' + cpSanitized,
        '╠═══════════════════════════════════════════════════════════════════════════════════',
        '║ RAW: "' + rawLineDebug + '"',
        '║ LEN: ' + rawLine.length + ' chars',
        '║ Plaza(sanit)="' + tipoPlazaSanit + '" Instalac(sanit)="' + tipoInstalacSanit + '"',
        '╚═══════════════════════════════════════════════════════════════════════════════════',
      ].join('\n')
    );

    if (isVentaDirecta(tipoInstalacRaw)) return { found: true, tipo: 'no_venta', cp: cpSanitized };
    if (isOnNet(tipoPlazaRaw) || isOnNet(tipoInstalacRaw)) return { found: true, tipo: 'on_net', cp: cpSanitized };
    if (isOffNet(tipoPlazaRaw) || isOffNet(tipoInstalacRaw)) return { found: true, tipo: 'off_net', cp: cpSanitized };
    return { found: true, tipo: 'on_net', cp: cpSanitized };
  }
  return null;
}

/**
 * Genera el fragmento mínimo de contexto para inyectar en el System Prompt.
 * REGLA PERSONA: NUNCA mencionar "asesor humano", "bot", "IA". Actuar 100% como vendedor.
 * LENGUAJE TÉCNICO PROHIBIDO: NUNCA digas "ON NET", "OFF NET" u "OFF RED" al cliente.
 */
export function formatCoverageContext(result: CoverageResult): string {
  if (!result.found) {
    return `## Cobertura (CP ${result.cp})\nEl CP ${result.cp} no está en el archivo de cobertura. Di: "Estamos validando, en un momento te confirmo." Sigue ofreciendo paquetes de internet basados en la BASE_DE_CONOCIMIENTO_IZZI y responde dudas del cliente. NO cambies de tema a TV ni ofrezcas izzitv+ como única opción solo por falta de datos de cobertura. NUNCA digas "asesor", "humano", "bot", "IA", "ON NET", "OFF NET" u "OFF RED".`;
  }
  if (result.tipo === 'no_venta') {
    return `## Cobertura (CP ${result.cp})\nEn esta zona no podemos ofrecer venta directa. Di: "Estamos validando, en un momento te confirmo." NUNCA digas "asesor", "humano", "bot", "IA", "ON NET", "OFF NET" u "OFF RED".`;
  }
  if (result.tipo === 'on_net') {
    return `## Cobertura (CP ${result.cp})\nSÍ hay cobertura total en esta zona. Usa lenguaje comercial: "¡Buenas noticias! Sí tenemos cobertura en tu zona para instalarte Internet, TV y Telefonía." Ofrécele paquetes según las promociones vigentes del conocimiento. Recuerda: estos paquetes están sujetos a validación de cobertura. NUNCA digas "ON NET", "OFF NET", "OFF RED", "asesor" o "humano". NO pidas Google Maps.`;
  }
  return `## Cobertura (CP ${result.cp})\nSolo hay cobertura de TV en esta zona. Usa lenguaje comercial: "En tu zona tenemos disponible nuestro servicio de TV." Ofrécele solo TV. Requisito: mínimo 20 megas de internet (otro proveedor). Recuerda: estos paquetes están sujetos a validación de cobertura. NUNCA digas "ON NET", "OFF NET", "OFF RED", "asesor" o "humano". NO pidas Google Maps.`;
}

/**
 * Extrae el primer CP (5 dígitos) de un texto.
 */
export function extractCPFromText(text: string | null | undefined): string | null {
  const s = String(text ?? '').trim();
  const match = s.match(/\b(\d{5})\b/);
  return match ? String(match[1]).trim() : null;
}
