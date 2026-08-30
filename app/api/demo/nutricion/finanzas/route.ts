import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const patientId = searchParams.get('patientId') || 'ana-garcia';
  try {
    const db = await getMongoDb();
    const payments = await db
      .collection('nutrition_payments')
      .find({ patientId })
      .sort({ fecha: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ payments: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getMongoDb();

    if (body.action === 'marcar_pagado' && body.id) {
      await db.collection('nutrition_payments').updateOne(
        { _id: new ObjectId(body.id) },
        { $set: { status: 'pagado', pagadoEn: new Date() } }
      );
      return NextResponse.json({ ok: true });
    }

    const doc = {
      patientId:  body.patientId  || 'ana-garcia',
      monto:      Number(body.monto),
      concepto:   body.concepto   || 'Consulta',
      fecha:      body.fecha ? new Date(body.fecha) : new Date(),
      status:     body.status     || 'pendiente',
      createdAt:  new Date(),
    };
    const result = await db.collection('nutrition_payments').insertOne(doc);
    return NextResponse.json({ ok: true, id: result.insertedId });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
