import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

/**
 * Migración temporal: prospectos sin `pipeline` → Izzi + giro Barbería.
 * GET /api/admin/migrate-pipeline?key=TU_ADMIN_PASSWORD
 */
export async function GET(request: NextRequest) {
  const secret = process.env.ADMIN_PASSWORD?.trim();
  const key = request.nextUrl.searchParams.get('key')?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'ADMIN_PASSWORD no configurado' }, { status: 503 });
  }
  if (key !== secret) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const db = await getMongoDb();
    const result = await db.collection('prospectos').updateMany(
      { pipeline: { $exists: false } },
      { $set: { pipeline: 'Izzi', giro: 'Barbería' } }
    );
    return NextResponse.json({ ok: true, actualizados: result.modifiedCount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
