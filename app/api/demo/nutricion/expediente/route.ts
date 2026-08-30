import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const patientId = searchParams.get('patientId') || 'ana-garcia';
  try {
    const db = await getMongoDb();
    const patient = await db.collection('nutrition_patients').findOne({ patientId });
    return NextResponse.json({ patient: patient ?? null });
  } catch {
    return NextResponse.json({ patient: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getMongoDb();
    const patientId = body.patientId || 'ana-garcia';
    const now = new Date();

    if (body.action === 'add_medicion') {
      await db.collection('nutrition_patients').updateOne(
        { patientId },
        {
          $push: { mediciones: { ...body.medicion, fecha: now } } as never,
          $set: { updatedAt: now },
        }
      );
      return NextResponse.json({ ok: true });
    }

    // Upsert full patient record
    const { action: _a, ...fields } = body;
    await db.collection('nutrition_patients').updateOne(
      { patientId },
      {
        $set: { ...fields, updatedAt: now },
        $setOnInsert: { patientId, createdAt: now, mediciones: [] },
      },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
