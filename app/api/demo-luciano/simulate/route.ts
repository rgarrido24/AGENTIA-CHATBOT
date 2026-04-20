import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST() {
  const nombre = 'Cliente Prueba Luciano';
  const utm_campaign = 'Campaña Test Córdoba';
  const correo = 'cliente.prueba@gmail.com';

  // Córdoba mobile: +54 9 351 random — wa.me format: 54935XXXXXXX
  const suffix = Math.floor(1000000 + Math.random() * 9000000);
  const telefono = `549351${suffix}`;

  try {
    const db = await getMongoDb();
    const result = await db.collection('demo_luciano_leads').insertOne({
      nombre,
      telefono,
      correo,
      utm_campaign,
      isDemo: true,
      isNew: true,
      createdAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      lead: { id: String(result.insertedId), nombre, telefono, correo, utm_campaign },
    });
  } catch (err) {
    console.error('[demo-luciano/simulate] ERROR:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
