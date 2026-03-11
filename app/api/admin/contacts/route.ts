import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getMongoDb();
    const collection = db.collection('contacts');
    const contacts = await collection.find({}).limit(500).toArray();
    const normalized = contacts.map((c: Record<string, unknown>) => ({
      _id: String(c._id),
      nombre: c.nombre ?? c.name ?? '',
      email: c.email ?? '',
      telefono: c.telefono ?? c.phone ?? '',
      origen: c.origen ?? c.source ?? '',
      estado: c.estado ?? c.status ?? '',
      fecha: c.fecha ?? c.createdAt ? new Date(c.createdAt as Date).toISOString().slice(0, 10) : '',
    }));
    return NextResponse.json({ contacts: normalized });
  } catch (err) {
    console.error('[api/admin/contacts]', err);
    return NextResponse.json(
      { contacts: [], error: err instanceof Error ? err.message : 'Error de base de datos' },
      { status: 500 }
    );
  }
}
