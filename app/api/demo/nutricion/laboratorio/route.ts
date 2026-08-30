import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const patientId = searchParams.get('patientId') || 'ana-garcia';
  try {
    const db = await getMongoDb();
    const results = await db
      .collection('nutrition_lab_results')
      .find({ patientId })
      .sort({ fecha: -1 })
      .limit(10)
      .toArray();
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getMongoDb();
    const doc = {
      patientId:  body.patientId  || 'ana-garcia',
      fecha:      new Date(),
      sexo:       body.sexo       || 'femenino',
      valores:    body.valores    || {},
      semaforos:  body.semaforos  || {},
      resumen:    body.resumen    || '',
      createdAt:  new Date(),
    };
    const result = await db.collection('nutrition_lab_results').insertOne(doc);
    return NextResponse.json({ ok: true, id: result.insertedId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
