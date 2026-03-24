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
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  if (digits.length === 13 && digits.startsWith('521')) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return `52${digits}`;
  return digits;
}

type StatsShape = {
  total: number;
  pendiente: number;
  contactado: number;
  demo_vista: number;
  interesado: number;
  negociacion: number;
  cerrado: number;
  no_interesado: number;
};

function emptyStats(): StatsShape {
  return {
    total: 0,
    pendiente: 0,
    contactado: 0,
    demo_vista: 0,
    interesado: 0,
    negociacion: 0,
    cerrado: 0,
    no_interesado: 0,
  };
}

function buildProspectoFilter(
  searchParams: URLSearchParams,
  opts: { includeStatus: boolean }
): Record<string, unknown> {
  const status = searchParams.get('status') || '';
  const lote = searchParams.get('lote') || '';
  const vendedor = searchParams.get('vendedor') || '';
  const search = searchParams.get('search') || '';
  const demo = searchParams.get('demo') || '';
  const pipeline = searchParams.get('pipeline') || '';
  const giro = searchParams.get('giro') || '';
  const canalOrigen = searchParams.get('canalOrigen') || '';

  const filter: Record<string, unknown> = {};
  if (pipeline) filter.pipeline = pipeline;
  if (giro) filter.giro = giro;
  if (canalOrigen) filter.canalOrigen = canalOrigen;
  if (lote) filter.lote = lote;
  if (vendedor) filter.asignadoA = vendedor;
  if (demo) filter.demo = demo;
  if (opts.includeStatus && status) filter.status = status;
  if (search) {
    filter.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { propietario: { $regex: search, $options: 'i' } },
      { ubicacion: { $regex: search, $options: 'i' } },
      { telefono: { $regex: search, $options: 'i' } },
    ];
  }
  return filter;
}

function mapDocToProspecto(d: Record<string, unknown>) {
  return {
    id: String(d._id),
    nombre: d.nombre ?? '',
    propietario: d.propietario ?? '',
    ubicacion: d.ubicacion ?? '',
    telefono: d.telefono ?? '',
    correo: d.correo ?? '',
    demo: d.demo ?? 'barberia',
    lote: d.lote ?? '',
    pipeline: (d.pipeline as string) ?? PIPELINE_DEFAULT,
    giro: (d.giro as string) ?? 'Otro',
    canalOrigen: (d.canalOrigen as string) ?? 'Manual',
    status: d.status ?? 'pendiente',
    asignadoA: d.asignadoA ?? '',
    contactadoAt: d.contactadoAt ?? null,
    contactadoPor: d.contactadoPor ?? '',
    plantillaEnviada: d.plantillaEnviada ?? '',
    mensajesEnviados: d.mensajesEnviados ?? 0,
    demoAbierta: d.demoAbierta ?? false,
    demoAbiertaAt: d.demoAbiertaAt ?? null,
    notas: d.notas ?? '',
    trackToken: d.trackToken ?? '',
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const db = await getMongoDb();
    const listFilter = buildProspectoFilter(searchParams, { includeStatus: true });
    const statsFilter = buildProspectoFilter(searchParams, { includeStatus: false });

    const [docs, lotes, demos, statsDocs] = await Promise.all([
      db.collection('prospectos').find(listFilter).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection('prospectos').distinct('lote', statsFilter),
      db.collection('prospectos').distinct('demo', statsFilter),
      db.collection('prospectos').find(statsFilter).toArray(),
    ]);

    const stats = emptyStats();
    for (const d of statsDocs) {
      stats.total++;
      const s = String(d.status ?? '');
      if (s && s !== 'total' && s in stats) {
        (stats as Record<string, number>)[s]++;
      }
    }

    return NextResponse.json({
      ok: true,
      prospectos: docs.map((d) => mapDocToProspecto(d as Record<string, unknown>)),
      stats,
      lotes: (lotes as string[]).filter(Boolean),
      demos: (demos as string[]).filter(Boolean),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      nombre,
      propietario,
      ubicacion,
      telefono,
      correo,
      demo,
      lote,
      pipeline: pipelineRaw,
      giro: giroRaw,
      canalOrigen: canalRaw,
    } = body as {
      nombre?: string;
      propietario?: string;
      ubicacion?: string;
      telefono?: string;
      correo?: string;
      demo?: string;
      lote?: string;
      pipeline?: string;
      giro?: string;
      canalOrigen?: string;
    };
    if (!nombre || !telefono) {
      return NextResponse.json({ ok: false, error: 'nombre y telefono requeridos' }, { status: 400 });
    }
    const pipeline: ProspectoPipeline = coercePipeline(pipelineRaw);
    const giro: ProspectoGiro = coerceGiro(giroRaw);
    const canalOrigen: ProspectoCanalOrigen = coerceCanalOrigen(canalRaw);

    const db = await getMongoDb();
    const now = new Date();
    const doc = {
      nombre: String(nombre).trim(),
      propietario: String(propietario || '').trim(),
      ubicacion: String(ubicacion || '').trim(),
      telefono: String(telefono).trim(),
      telefonoNorm: normalizePhone(String(telefono)),
      correo: String(correo || '').trim(),
      demo: String(demo || 'barberia').trim(),
      lote: String(lote || '').trim(),
      pipeline,
      giro,
      canalOrigen,
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
    };
    const result = await db.collection('prospectos').insertOne(doc);
    return NextResponse.json({ ok: true, id: String(result.insertedId) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
