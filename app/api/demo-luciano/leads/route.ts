import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
  const db = await getMongoDb();
  const leads = await db
    .collection('demo_luciano_leads')
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({
    leads: leads.map((l) => ({
      id: String(l._id),
      nombre: l.nombre,
      telefono: l.telefono,
      correo: l.correo,
      utm_campaign: l.utm_campaign,
      createdAt: l.createdAt,
    })),
  });
}
