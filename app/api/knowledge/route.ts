import { NextRequest } from 'next/server';
import { addKnowledgeDoc, listKnowledgeDocs, deleteKnowledgeDoc } from '@/src/lib/knowledge-docs';

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return (result?.text ?? '').trim() || '(No se pudo extraer texto del PDF)';
}

/** Sanitiza valor: minúsculas, solo a-z0-9. "On Net" → "onnet" */
function sanitizeCell(val: unknown): string {
  return String(val ?? '')
    .replace(/\u00A0/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const CSV_DELIMITERS = /[;,]/;

function isCPColumn(sanitized: string): boolean {
  return (
    sanitized === 'dcodigo' ||
    sanitized.includes('codigopostal') ||
    sanitized === 'cp' ||
    sanitized.includes('codigo') ||
    sanitized.includes('postal')
  );
}

function isTipoPlazaColumn(sanitized: string): boolean {
  return (
    sanitized.includes('tipoplaza') ||
    sanitized.includes('cobertura') ||
    sanitized === 'red' ||
    sanitized.includes('estatus') ||
    (sanitized.includes('tipo') && sanitized.includes('plaza'))
  );
}

function isTipoInstalacColumn(sanitized: string): boolean {
  return (
    sanitized.includes('tipoinstalac') ||
    sanitized.includes('tipoinsta') ||
    sanitized.includes('instalac') ||
    sanitized === 'insta'
  );
}

function isOnNetValue(sanitized: string): boolean {
  return sanitized.includes('onnet');
}

function isOffNetValue(sanitized: string): boolean {
  return sanitized.includes('offnet') || sanitized.includes('offred');
}

function isVentaDirectaValue(sanitized: string): boolean {
  return sanitized.includes('ventadirecta');
}

function formatCsvForKnowledge(csv: string): string {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return csv;
  const headerLine = lines[0];
  const headers = headerLine.split(CSV_DELIMITERS).map((h) => sanitizeCell(h));
  const rows = lines.slice(1);

  const cpIdx = headers.findIndex(isCPColumn);
  const tipoPlazaIdx = headers.findIndex(isTipoPlazaColumn);
  const tipoInstalacIdx = headers.findIndex(isTipoInstalacColumn);
  const hasIzziFormat = cpIdx >= 0 && (tipoPlazaIdx >= 0 || cpIdx + 1 < headers.length);

  if (hasIzziFormat && rows.length > 0) {
    const tipoPlazaCol = tipoPlazaIdx >= 0 ? tipoPlazaIdx : cpIdx + 1;
    const tipoInstalacCol = tipoInstalacIdx >= 0 ? tipoInstalacIdx : cpIdx + 2;
    const cpSet = new Map<string, string>();
    const noVentaSet = new Set<string>();
    for (const r of rows) {
      const cols = r.split(CSV_DELIMITERS).map((c) => String(c ?? '').replace(/\u00A0/g, ' ').trim());
      const digits = String(cols[cpIdx] ?? '').replace(/\D/g, '');
      const cp = digits.length >= 5 ? digits.slice(-5) : '';
      const tipoPlazaSanit = sanitizeCell(cols[tipoPlazaCol] ?? cols[cpIdx + 1] ?? '');
      const tipoInstalacSanit = sanitizeCell(cols[tipoInstalacCol] ?? cols[cpIdx + 2] ?? '');
      if (!cp) continue;
      if (isVentaDirectaValue(tipoInstalacSanit)) {
        noVentaSet.add(cp);
        continue;
      }
      const tipoPlaza = cols[tipoPlazaCol] ?? cols[cpIdx + 1] ?? '';
      if (tipoPlaza) {
        const prev = cpSet.get(cp);
        if (!prev || isOnNetValue(sanitizeCell(tipoPlaza))) cpSet.set(cp, tipoPlaza);
      }
    }
    for (const cp of noVentaSet) cpSet.delete(cp);
    const onNet: string[] = [];
    const soloTv: string[] = [];
    const noVenta: string[] = [...noVentaSet];
    for (const [c, tipo] of cpSet) {
      const t = sanitizeCell(tipo);
      if (isOnNetValue(t)) onNet.push(c);
      else if (isOffNetValue(t)) soloTv.push(c);
    }
    return [
      '## COBERTURAS IZZI - Archivo de Excel/CSV',
      '',
      '### Uso del archivo',
      '- Este archivo es la referencia de cobertura. Puede tener imprecisiones: a veces en una calle hay y en la de al lado no; el archivo puede indicar que todo el CP tiene. Un asesor humano verificará al cerrar.',
      '- Pregunta el CP cuando puedas: las promociones cambian drásticamente por zona. Si el cliente no lo da: di que puede variar por zona, dale un aproximado y brinda toda la info.',
      '',
      '### Cuando el cliente proporcione CP (5 dígitos)',
      'Consulta esta tabla y adapta la oferta:',
      '',
      '• ON NET: Ofrecer TV + Internet + Teléfono, o Internet + Teléfono.',
      '• OFF NET / OFF RED: Ofrecer INMEDIATAMENTE solo TV. Requisito: cliente debe tener internet de mínimo 20 megas (otro proveedor). Muchos leads son gente mayor que disfruta la TV; ir al grano.',
      '',
      '### CP con Internet y TV (on net)',
      onNet.length > 0 ? onNet.join(', ') : '(ninguno en archivo)',
      '',
      '### CP con solo TV (off net / off red)',
      soloTv.length > 0 ? soloTv.join(', ') : '(ninguno en archivo)',
      '',
      '### CP sin venta directa',
      noVenta.length > 0 ? noVenta.join(', ') : '(ninguno en archivo)',
      '',
      '### Lista completa CP → Tipo',
      ...[...cpSet.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, 500)
        .map(([cp, tipo]) => `${cp}: ${tipo}`),
      cpSet.size > 500 ? `\n... y ${cpSet.size - 500} CP más` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const isCobertura = headers.some(isCPColumn);
  if (isCobertura && rows.length > 0) {
    return [
      '## Coberturas por código postal (CP)',
      '',
      'Este archivo es de cobertura. La consulta por CP se hace dinámicamente.',
      `Total de filas en archivo: ${rows.length}. No se inyecta al prompt.`,
    ].join('\n');
  }
  return csv;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = formData.get('clientId') as string | null;
    const file = formData.get('file') as File | null;

    if (!clientId?.trim()) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }
    if (!file) {
      return Response.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const ext = (file.name.toLowerCase().split('.').pop() ?? '').toLowerCase();
    const allowed = ['txt', 'csv', 'pdf'];
    if (!allowed.includes(ext)) {
      return Response.json({ error: 'Solo se permiten archivos .txt, .csv o .pdf' }, { status: 400 });
    }

    let content: string;
    if (ext === 'pdf') {
      const buf = Buffer.from(await file.arrayBuffer());
      content = await extractTextFromPdf(buf);
    } else {
      content = await file.text();
    }
    if (ext === 'csv') {
      content = formatCsvForKnowledge(content);
    }
    await addKnowledgeDoc({
      clientId: clientId.trim(),
      filename: file.name,
      content,
    });

    return Response.json({ ok: true, filename: file.name });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al subir';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId?.trim()) {
      return Response.json({ error: 'clientId requerido' }, { status: 400 });
    }
    const docs = await listKnowledgeDocs(clientId.trim());
    const serialized = docs.map((d) => ({
      _id: String(d._id ?? ''),
      filename: d.filename,
      uploadedAt: d.uploadedAt?.toISOString?.() ?? new Date().toISOString(),
    }));
    return Response.json({ docs: serialized });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al listar';
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const docId = searchParams.get('id');
    if (!clientId?.trim() || !docId) {
      return Response.json({ error: 'clientId e id requeridos' }, { status: 400 });
    }
    const ok = await deleteKnowledgeDoc(clientId.trim(), docId);
    if (!ok) {
      return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar';
    return Response.json({ error: msg }, { status: 500 });
  }
}
