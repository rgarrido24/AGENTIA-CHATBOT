import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { randomUUID } from 'crypto';

function normalizePhone(raw: string): string {
  const s = (raw || '').trim();
  // Extrae número de links wa.me/52XXXXXXXXXX
  const waMatch = s.match(/wa\.me\/(\d+)/i);
  const digits = waMatch ? waMatch[1] : s.replace(/\D/g, '');
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  if (digits.length === 13 && digits.startsWith('521')) return digits;
  if (digits.length === 11 && digits.startsWith('1')) return `52${digits}`;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { rows, lote, demo } = body as {
      rows: Array<{ nombre: string; propietario?: string; ubicacion?: string; telefono: string; correo?: string }>;
      lote: string;
      demo: string;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'rows requerido' }, { status: 400 });
    }

    const db = await getMongoDb();
    const now = new Date();
    const docs = rows
      .filter((r) => r.nombre && r.telefono)
      .map((r) => ({
        nombre: String(r.nombre || '').trim(),
        propietario: String(r.propietario || '').trim(),
        ubicacion: String(r.ubicacion || '').trim(),
        telefono: String(r.telefono || '').trim(),
        telefonoNorm: normalizePhone(String(r.telefono || '')),
        correo: String(r.correo || '').trim(),
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
      }));

    if (docs.length === 0) {
      return NextResponse.json({ ok: false, error: 'Ninguna fila válida (nombre y teléfono requeridos)' }, { status: 400 });
    }

    const result = await db.collection('prospectos').insertMany(docs);
    return NextResponse.json({ ok: true, inserted: result.insertedCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
