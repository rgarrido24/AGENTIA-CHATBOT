import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const NAMES = [
  'Facundo González',  'Julieta Martínez',  'Lucas Rossi',      'Sofía Díaz',
  'Rodrigo Fernández', 'Micaela Castro',    'Ignacio Pérez',    'Florencia Gómez',
  'Santiago Molina',   'Luciana Torres',    'Franco Ramírez',   'Daniela Medina',
  'Ezequiel Silva',    'Carolina Morales',  'Maximiliano Ruiz', 'Aldana Vega',
  'Leandro Suárez',    'Natalia Bustos',    'Pablo Cisneros',   'Abril Herrera',
];

const CAMPAIGNS = [
  'Emprendedores Córdoba 2026',
  'Inmuebles Centro',
  'Servicios Profesionales',
];

const DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.ar'];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function slug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
}

export async function POST() {
  const nombre      = rand(NAMES);
  const utm_campaign = rand(CAMPAIGNS);
  const correo      = `${slug(nombre)}@${rand(DOMAINS)}`;
  const suffix      = Math.floor(1_000_000 + Math.random() * 9_000_000);
  const telefono    = `549351${suffix}`;

  try {
    const db = await getMongoDb();
    const result = await db.collection('demo_luciano_leads').insertOne({
      nombre, telefono, correo, utm_campaign,
      estado: 'nuevo',
      isDemo: true,
      createdAt: new Date(),
    });
    return NextResponse.json({
      ok: true,
      lead: { id: String(result.insertedId), nombre, utm_campaign },
    });
  } catch (err) {
    console.error('[demo-luciano/simulate] ERROR:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
