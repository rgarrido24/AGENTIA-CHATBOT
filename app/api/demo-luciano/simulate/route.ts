import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const NOMBRES = [
  'Alejandro Soto', 'Mariana López', 'Héctor Fuentes', 'Daniela Vargas',
  'Emilio Reyes', 'Natalia Cruz', 'Ricardo Peña', 'Sofía Mendez',
  'Adrián Castillo', 'Camila Torres', 'Sebastián Ruiz', 'Valeria Nava',
  'Eduardo Flores', 'Fernanda Ramos', 'Óscar Guerrero',
];

const CAMPAIGNS = [
  'Barberías CDMX — Leads Q2',
  'Spas & Estéticas GDL',
  'Restaurantes MTY Retargeting',
  'Dentistas CDMX — Awareness',
  'Nutriólogos — Intereses Salud',
  'Talleres Mecánicos — Norte',
];

const DOMINIOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.mx'];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone() {
  const suffix = Math.floor(1000000000 + Math.random() * 9000000000);
  return `521${suffix}`;
}

function toSlug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z.]/g, '');
}

export async function POST() {
  const nombre = rand(NOMBRES);
  const utm_campaign = rand(CAMPAIGNS);
  const correo = `${toSlug(nombre)}@${rand(DOMINIOS)}`;
  const telefono = randomPhone();

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
}
