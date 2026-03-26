import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/** Temporal — quitar al terminar la migración. */
const TEMP_TOKEN = 'agentia-migrate-2025';

/**
 * Migración temporal: pipeline Izzi → Agentia.
 * GET /api/admin/migrate-pipeline?key=agentia-migrate-2025
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')?.trim();

  if (key !== TEMP_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const result = await db.collection('prospectos').updateMany(
      { pipeline: 'Izzi' },
      { $set: { pipeline: 'Agentia' } }
    );
    return NextResponse.json({ ok: true, actualizados: result.modifiedCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
