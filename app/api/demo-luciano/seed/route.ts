import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

const MOCK_LEADS = [
  { nombre: 'Carlos Mendoza',    telefono: '5215512345678', correo: 'carlos.mendoza@gmail.com',    utm_campaign: 'Barberías CDMX — Leads Q2' },
  { nombre: 'Ana Sofía Reyes',   telefono: '5215587654321', correo: 'anasofia.reyes@hotmail.com',  utm_campaign: 'Spas & Estéticas GDL' },
  { nombre: 'Roberto Villarreal',telefono: '5215533221144', correo: 'roberto.v@gmail.com',         utm_campaign: 'Barberías CDMX — Leads Q2' },
  { nombre: 'Fernanda Castro',   telefono: '5215544332211', correo: 'fcastro@outlook.com',         utm_campaign: 'Restaurantes MTY Retargeting' },
  { nombre: 'Miguel Ángel Torres',telefono:'5215566778899', correo: 'ma.torres@gmail.com',         utm_campaign: 'Talleres Mecánicos — Norte' },
  { nombre: 'Valeria Guzmán',    telefono: '5215511223344', correo: 'valeria.guzman@gmail.com',    utm_campaign: 'Spas & Estéticas GDL' },
  { nombre: 'Jorge Hernández',   telefono: '5215599887766', correo: 'jhernandez@protonmail.com',   utm_campaign: 'Dentistas CDMX — Awareness' },
  { nombre: 'Luisa Ramírez',     telefono: '5215577665544', correo: 'luisa.ramirez@gmail.com',     utm_campaign: 'Barberías CDMX — Leads Q2' },
  { nombre: 'Diego Morales',     telefono: '5215522334455', correo: 'dmorales@gmail.com',          utm_campaign: 'Restaurantes MTY Retargeting' },
  { nombre: 'Paola Jiménez',     telefono: '5215588990011', correo: 'paola.jimenez@hotmail.com',   utm_campaign: 'Nutriólogos — Intereses Salud' },
];

export async function POST() {
  const db = await getMongoDb();
  const coll = db.collection('demo_luciano_leads');

  await coll.deleteMany({});

  const now = new Date();
  const docs = MOCK_LEADS.map((lead, i) => ({
    ...lead,
    isDemo: true,
    createdAt: new Date(now.getTime() - (MOCK_LEADS.length - i) * 3 * 60 * 1000),
  }));

  await coll.insertMany(docs);
  return NextResponse.json({ ok: true, inserted: docs.length });
}
