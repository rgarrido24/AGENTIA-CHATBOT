import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getMongoDb();
    const leads = await db
      .collection('demo_luciano_leads')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    console.log('[demo-luciano/leads] GET OK, count:', leads.length);
    return NextResponse.json({
      ok: true,
      leads: leads.map((l) => ({
        id: String(l._id),
        nombre: l.nombre,
        telefono: l.telefono,
        correo: l.correo,
        utm_campaign: l.utm_campaign,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error('[demo-luciano/leads] ERROR:', err);
    return NextResponse.json({ ok: false, leads: [], error: String(err) }, { status: 500 });
  }
}
