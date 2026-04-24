import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getMongoDb();
    const docs = await db
      .collection('leads')
      .find({ clientId: 'agentia-ventas' })
      .sort({ createdAt: -1 })
      .limit(100)
      .project({
        leadId: 1,
        nombre: 1,
        senderName: 1,
        telefono: 1,
        senderId: 1,
        email: 1,
        campana: 1,
        adset: 1,
        canal_origen: 1,
        status_vendedor: 1,
        status: 1,
        createdAt: 1,
        _id: 0,
      })
      .toArray();

    const leads = docs.map((d) => ({
      id:           d.leadId as string,
      nombre:       (d.nombre || d.senderName || d.senderId || 'Sin nombre') as string,
      telefono:     (d.telefono || d.senderId || '') as string,
      email:        (d.email || '') as string,
      campana:      (d.campana || '') as string,
      adset:        (d.adset || '') as string,
      canal_origen: (d.canal_origen || 'whatsapp') as string,
      estado:       mapEstado(d.status_vendedor as string | undefined),
      createdAt:    (d.createdAt as Date).toISOString(),
    }));

    return NextResponse.json({ leads });
  } catch (err) {
    console.error('[demo/luciano/leads] Error:', err);
    return NextResponse.json({ leads: [] }, { status: 500 });
  }
}

function mapEstado(sv: string | undefined): 'nuevo' | 'contactado' | 'en_seguimiento' {
  if (!sv || sv === 'nuevo') return 'nuevo';
  if (sv === 'contactado' || sv === 'en_negociacion' || sv === 'vio_demo') return 'contactado';
  if (sv === 'interesado' || sv === 'sin_respuesta') return 'en_seguimiento';
  if (sv === 'cerrado' || sv === 'perdido') return 'en_seguimiento';
  return 'nuevo';
}
