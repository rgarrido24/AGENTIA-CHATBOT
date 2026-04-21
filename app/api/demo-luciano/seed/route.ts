import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

type Estado = 'nuevo' | 'contactado' | 'en_seguimiento';

const INITIAL_LEADS: Array<{
  nombre: string; telefono: string; correo: string;
  utm_campaign: string; estado: Estado; minsAgo: number;
}> = [
  // 2-3 días atrás
  { nombre: 'Nicolás Romero',     telefono: '5493515491823', correo: 'nico.romero@gmail.com',      utm_campaign: 'Inmuebles Centro',             estado: 'en_seguimiento', minsAgo: 60 * 50 },
  { nombre: 'Agustina López',     telefono: '5493516845201', correo: 'agus.lopez@hotmail.com',     utm_campaign: 'Servicios Profesionales',       estado: 'contactado',     minsAgo: 60 * 42 },
  // Ayer
  { nombre: 'Camila Pereyra',     telefono: '5493515103678', correo: 'cami.pereyra@gmail.com',     utm_campaign: 'Emprendedores Córdoba 2026',    estado: 'contactado',     minsAgo: 60 * 22 },
  { nombre: 'Tomás Álvarez',      telefono: '5493513278934', correo: 'tomas.alvarez@gmail.com',    utm_campaign: 'Inmuebles Centro',             estado: 'en_seguimiento', minsAgo: 60 * 18 },
  // Hace pocas horas
  { nombre: 'Valentina Ferreyra', telefono: '5493513901456', correo: 'vale.ferreyra@gmail.com',    utm_campaign: 'Emprendedores Córdoba 2026',    estado: 'nuevo',          minsAgo: 185 },
  { nombre: 'Matías Herrera',     telefono: '5493516582047', correo: 'mati.herrera@outlook.com',   utm_campaign: 'Servicios Profesionales',       estado: 'nuevo',          minsAgo: 73 },
];

export async function POST() {
  try {
    const db = await getMongoDb();
    const coll = db.collection('demo_luciano_leads');
    await coll.deleteMany({});

    const now = Date.now();
    const docs = INITIAL_LEADS.map(({ minsAgo, ...rest }) => ({
      ...rest,
      isDemo: true,
      createdAt: new Date(now - minsAgo * 60_000),
    }));

    const result = await coll.insertMany(docs);
    return NextResponse.json({ ok: true, inserted: result.insertedCount });
  } catch (err) {
    console.error('[demo-luciano/seed] ERROR:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
