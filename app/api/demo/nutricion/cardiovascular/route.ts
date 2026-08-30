import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getMongoDb();
    const doc = {
      patientId:      body.patientId      || 'ana-garcia',
      fecha:          new Date(),
      edad:           body.edad,
      sexo:           body.sexo,
      colesterolTotal: body.colesterolTotal,
      hdl:            body.hdl,
      presionSistolica: body.presionSistolica,
      enTratamiento:  body.enTratamiento,
      fumador:        body.fumador,
      riesgo10a:      body.riesgo10a,
      clasificacion:  body.clasificacion,
      promedioEdad:   body.promedioEdad,
      createdAt:      new Date(),
    };
    await db.collection('nutrition_cardiovascular').insertOne(doc);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
