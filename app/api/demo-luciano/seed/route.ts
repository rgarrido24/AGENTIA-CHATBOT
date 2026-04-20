import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

type Estado = 'nuevo' | 'contactado' | 'en_seguimiento' | 'cerrado';

const MOCK_LEADS: Array<{
  nombre: string; telefono: string; correo: string;
  utm_campaign: string; estado: Estado; daysAgo: number; hoursAgo?: number;
}> = [
  // Hoy — recientes
  { nombre: 'Facundo González',    telefono: '5493513507812', correo: 'facundo.gonzalez@gmail.com',  utm_campaign: 'FB_LeadAds_Inmuebles_NuevaCordoba', estado: 'nuevo',          daysAgo: 0, hoursAgo: 0 },
  { nombre: 'Julieta Martínez',    telefono: '5493516234891', correo: 'julieta.martinez@hotmail.com', utm_campaign: 'IG_Promo_Estetica_Cerro',           estado: 'nuevo',          daysAgo: 0, hoursAgo: 1 },
  { nombre: 'Lucas Rossi',         telefono: '5493515748203', correo: 'lucas.rossi@gmail.com',       utm_campaign: 'FB_Ventas_Concesionaria_Cba',       estado: 'nuevo',          daysAgo: 0, hoursAgo: 3 },
  { nombre: 'Valentina Ferreyra',  telefono: '5493513901456', correo: 'vale.ferreyra@gmail.com',     utm_campaign: 'FB_LeadAds_Inmuebles_NuevaCordoba', estado: 'contactado',     daysAgo: 0, hoursAgo: 5 },
  // Ayer
  { nombre: 'Matías Herrera',      telefono: '5493516582047', correo: 'mati.herrera@outlook.com',    utm_campaign: 'IG_Promo_Estetica_Cerro',           estado: 'contactado',     daysAgo: 1 },
  { nombre: 'Camila Pereyra',      telefono: '5493515103678', correo: 'cami.pereyra@gmail.com',      utm_campaign: 'FB_Ventas_Concesionaria_Cba',       estado: 'en_seguimiento', daysAgo: 1 },
  { nombre: 'Tomás Álvarez',       telefono: '5493513278934', correo: 'tomas.alvarez@gmail.com',     utm_campaign: 'FB_LeadAds_Inmuebles_NuevaCordoba', estado: 'contactado',     daysAgo: 1 },
  // Hace 2-3 días
  { nombre: 'Agustina López',      telefono: '5493516845201', correo: 'agus.lopez@hotmail.com',      utm_campaign: 'FB_Ventas_Concesionaria_Cba',       estado: 'en_seguimiento', daysAgo: 2 },
  { nombre: 'Nicolás Romero',      telefono: '5493515491823', correo: 'nico.romero@gmail.com',       utm_campaign: 'IG_Promo_Estetica_Cerro',           estado: 'cerrado',        daysAgo: 3 },
  { nombre: 'Sofía Díaz',          telefono: '5493513764509', correo: 'sofi.diaz@gmail.com',         utm_campaign: 'FB_LeadAds_Inmuebles_NuevaCordoba', estado: 'cerrado',        daysAgo: 3 },
];

export async function POST() {
  console.log('[demo-luciano/seed] POST recibido');
  try {
    const db = await getMongoDb();
    const coll = db.collection('demo_luciano_leads');
    await coll.deleteMany({});

    const now = Date.now();
    const MS_DAY = 86_400_000;
    const docs = MOCK_LEADS.map((lead) => {
      const { daysAgo, hoursAgo = Math.floor(Math.random() * 8), ...rest } = lead;
      const offset = daysAgo * MS_DAY + hoursAgo * 3_600_000 + Math.random() * 1_800_000;
      return { ...rest, isDemo: true, createdAt: new Date(now - offset) };
    });

    const result = await coll.insertMany(docs);
    console.log('[demo-luciano/seed] OK, insertedCount:', result.insertedCount);
    return NextResponse.json({ ok: true, inserted: result.insertedCount });
  } catch (err) {
    console.error('[demo-luciano/seed] ERROR:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
