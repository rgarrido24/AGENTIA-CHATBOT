import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { randomUUID } from 'crypto';
import {
  PIPELINE_DEFAULT,
  coerceCanalOrigen,
  coerceGiro,
  coercePipeline,
  type ProspectoCanalOrigen,
  type ProspectoGiro,
  type ProspectoPipeline,
} from '@/lib/prospectos-constants';

function normalizePhone(raw: string): string {
  const s = (raw || '').trim();
  const waMatch = s.match(/wa\.me\/(\d+)/i);
  const digits = waMatch ? waMatch[1] : s.replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  if (digits.length === 13 && digits.startsWith('521')) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return `52${digits}`;
  return digits;
}

type ImportRow = {
  nombre: string;
  propietario?: string;
  ubicacion?: string;
  telefono: string;
  correo?: string;
  /** CSV columna pipeline; si vacío se usa defaultPipeline del body */
  pipeline?: string;
  giro?: string;
  canalOrigen?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { rows, lote, demo, defaultPipeline } = body as {
      rows: ImportRow[];
      lote: string;
      demo: string;
      /** Pipeline del selector CRM si el CSV no trae columna pipeline */
      defaultPipeline?: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'rows requerido' }, { status: 400 });
    }

    const db = await getMongoDb();
    const now = new Date();
    const fallbackPipeline: ProspectoPipeline = coercePipeline(defaultPipeline ?? PIPELINE_DEFAULT);

    let errores = 0;
    const candidatos: Array<{
      nombre: string;
      propietario: string;
      ubicacion: string;
      telefono: string;
      telefonoNorm: string;
      correo: string;
      demo: string;
      lote: string;
      pipeline: ProspectoPipeline;
      giro: ProspectoGiro;
      canalOrigen: ProspectoCanalOrigen;
      status: string;
      asignadoA: string;
      contactadoAt: null;
      contactadoPor: string;
      plantillaEnviada: string;
      mensajesEnviados: number;
      demoAbierta: boolean;
      demoAbiertaAt: null;
      notas: string;
      trackToken: string;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    for (const r of rows) {
      if (!r.nombre?.trim() || !r.telefono?.trim()) {
        errores++;
        continue;
      }
      const telefonoNorm = normalizePhone(String(r.telefono || ''));
      const rowPipe = r.pipeline?.trim() ? coercePipeline(r.pipeline) : fallbackPipeline;
      candidatos.push({
        nombre: String(r.nombre || '').trim(),
        propietario: String(r.propietario || '').trim(),
        ubicacion: String(r.ubicacion || '').trim(),
        telefono: String(r.telefono || '').trim(),
        telefonoNorm,
        correo: String(r.correo || '').trim(),
        demo: String(demo || 'barberia').trim(),
        lote: String(lote || '').trim(),
        pipeline: rowPipe,
        giro: coerceGiro(r.giro),
        canalOrigen: coerceCanalOrigen(r.canalOrigen),
        status: 'pendiente',
        asignadoA: '',
        contactadoAt: null,
        contactadoPor: '',
        plantillaEnviada: '',
        mensajesEnviados: 0,
        demoAbierta: false,
        demoAbiertaAt: null,
        notas: '',
        trackToken: randomUUID(),
        createdAt: now,
        updatedAt: now,
      });
    }

    if (candidatos.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Ninguna fila válida (nombre y teléfono requeridos)',
        insertados: 0,
        duplicados: 0,
        errores,
      }, { status: 400 });
    }

    const pipelinesNeeded = [...new Set(candidatos.map((c) => c.pipeline))];
    const existing = await db
      .collection('prospectos')
      .find({ pipeline: { $in: pipelinesNeeded } })
      .project({ telefonoNorm: 1, pipeline: 1 })
      .toArray();

    const dupKey = (phone: string, pipe: string) => `${pipe}::${phone}`;
    const existingSet = new Set<string>();
    for (const e of existing) {
      const p = String((e as { pipeline?: string }).pipeline ?? PIPELINE_DEFAULT);
      const t = String((e as { telefonoNorm?: string }).telefonoNorm ?? '');
      if (t) existingSet.add(dupKey(t, p));
    }

    const docs: typeof candidatos = [];
    let duplicados = 0;
    const seenInBatch = new Set<string>();

    for (const c of candidatos) {
      const k = dupKey(c.telefonoNorm, c.pipeline);
      if (existingSet.has(k) || seenInBatch.has(k)) {
        duplicados++;
        continue;
      }
      seenInBatch.add(k);
      docs.push(c);
    }

    let insertados = 0;
    if (docs.length > 0) {
      const result = await db.collection('prospectos').insertMany(docs);
      insertados = result.insertedCount;
    }

    return NextResponse.json({
      ok: true,
      insertados,
      duplicados,
      errores,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg, insertados: 0, duplicados: 0, errores: 0 }, { status: 500 });
  }
}
