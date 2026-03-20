import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { randomUUID } from 'crypto';

function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  if (digits.length === 13 && digits.startsWith('521')) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return `52${digits}`;
  return digits;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const lote = searchParams.get('lote') || '';
    const vendedor = searchParams.get('vendedor') || '';
    const search = searchParams.get('search') || '';
    const demo = searchParams.get('demo') || '';

    const db = await getMongoDb();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (lote) filter.lote = lote;
    if (vendedor) filter.asignadoA = vendedor;
    if (demo) filter.demo = demo;
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { propietario: { $regex: search, $options: 'i' } },
        { ubicacion: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } },
      ];
    }

    const [docs, lotes, demos] = await Promise.all([
      db.collection('prospectos').find(filter).sort({ createdAt: -1 }).limit(1000).toArray(),
      db.collection('prospectos').distinct('lote'),
      db.collection('prospectos').distinct('demo'),
    ]);

    const stats = {
      total: 0, pendiente: 0, contactado: 0, demo_vista: 0,
      interesado: 0, negociacion: 0, cerrado: 0, no_interesado: 0,
    };
    const allDocs = await db.collection('prospectos').find({}).toArray();
    for (const d of allDocs) {
      stats.total++;
      const s = d.status as keyof typeof stats;
      if (s in stats) stats[s]++;
    }

    return NextResponse.json({
      ok: true,
      prospectos: docs.map((d) => ({
        id: String(d._id),
        nombre: d.nombre ?? '',
        propietario: d.propietario ?? '',
        ubicacion: d.ubicacion ?? '',
        telefono: d.telefono ?? '',
        correo: d.correo ?? '',
        demo: d.demo ?? 'barberia',
        lote: d.lote ?? '',
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
      })),
      stats,
      lotes: lotes.filter(Boolean),
      demos: demos.filter(Boolean),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { nombre, propietario, ubicacion, telefono, correo, demo, lote } = body;
    if (!nombre || !telefono) {
      return NextResponse.json({ ok: false, error: 'nombre y telefono requeridos' }, { status: 400 });
    }
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
