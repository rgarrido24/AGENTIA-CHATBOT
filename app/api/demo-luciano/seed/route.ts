import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

// Córdoba, Argentina — +54 9 351 XXX-XXXX
// wa.me format: 5493516XXXXXX (54 + 9 + 351 + number)
const MOCK_LEADS = [
  {
    nombre: 'Facundo González',
    telefono: '5493513507812',
    correo: 'facundo.gonzalez@gmail.com',
    utm_campaign: 'FB_LeadAds_Inmuebles_NuevaCordoba',
  },
  {
    nombre: 'Julieta Martínez',
    telefono: '5493516234891',
    correo: 'julieta.martinez@hotmail.com',
    utm_campaign: 'IG_Promo_Estetica_Cerro',
  },
  {
    nombre: 'Lucas Rossi',
    telefono: '5493515748203',
    correo: 'lucas.rossi@gmail.com',
    utm_campaign: 'FB_Ventas_Concesionaria_Cba',
  },
  {
    nombre: 'Valentina Ferreyra',
    telefono: '5493513901456',
    correo: 'vale.ferreyra@gmail.com',
    utm_campaign: 'IG_LeadAds_Odontologia_Alberdi',
  },
  {
    nombre: 'Matías Herrera',
    telefono: '5493516582047',
    correo: 'mati.herrera@outlook.com',
    utm_campaign: 'Google_Search_Seguros_GeneralPaz',
  },
  {
    nombre: 'Camila Pereyra',
    telefono: '5493515103678',
    correo: 'cami.pereyra@gmail.com',
    utm_campaign: 'IG_Reel_Gym_BrioVerde',
  },
  {
    nombre: 'Tomás Álvarez',
    telefono: '5493513278934',
    correo: 'tomas.alvarez@gmail.com',
    utm_campaign: 'FB_LeadAds_Inmuebles_NuevaCordoba',
  },
  {
    nombre: 'Agustina López',
    telefono: '5493516845201',
    correo: 'agus.lopez@hotmail.com',
    utm_campaign: 'FB_Ventas_Concesionaria_Cba',
  },
  {
    nombre: 'Nicolás Romero',
    telefono: '5493515491823',
    correo: 'nico.romero@gmail.com',
    utm_campaign: 'Google_Display_Abogados_CbaCapital',
  },
  {
    nombre: 'Sofía Díaz',
    telefono: '5493513764509',
    correo: 'sofi.diaz@gmail.com',
    utm_campaign: 'IG_Promo_Estetica_Cerro',
  },
];

export async function POST() {
  console.log('[demo-luciano/seed] POST recibido');
  try {
    const db = await getMongoDb();
    console.log('[demo-luciano/seed] MongoDB conectado, borrando colección...');
    const coll = db.collection('demo_luciano_leads');

    await coll.deleteMany({});
    console.log('[demo-luciano/seed] deleteMany OK');

    const now = new Date();
    const docs = MOCK_LEADS.map((lead, i) => ({
      ...lead,
      isDemo: true,
      createdAt: new Date(now.getTime() - (MOCK_LEADS.length - i) * 4 * 60 * 1000),
    }));

    const result = await coll.insertMany(docs);
    console.log('[demo-luciano/seed] insertMany OK, insertedCount:', result.insertedCount);
    return NextResponse.json({ ok: true, inserted: result.insertedCount });
  } catch (err) {
    console.error('[demo-luciano/seed] ERROR:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
