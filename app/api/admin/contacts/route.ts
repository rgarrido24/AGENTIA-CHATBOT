import { NextResponse } from 'next/server';

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return NextResponse.json({ contacts: [], error: null });
  }
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();
    const collection = db.collection('contacts');
    const contacts = await collection.find({}).limit(500).toArray();
    await client.close();
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
