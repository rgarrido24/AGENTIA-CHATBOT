import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const filterFormId = searchParams.get('formId') || '';

    const db = await getMongoDb();
    const query: Record<string, unknown> = { clientId: 'agentia-ventas', canal_origen: 'fb-ads' };
    if (filterFormId) query.form_id = filterFormId;

    const docs = await db
      .collection('leads')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(200)
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
        form_id: 1,
        form_name: 1,
        page_name: 1,
        platform_src: 1,
        form_fields: 1,
        status_vendedor: 1,
        status: 1,
        createdAt: 1,
        _id: 0,
      })
      .toArray();

    // Collect unique form_ids across all fb-ads leads (not just filtered page)
    const allDocs = filterFormId
      ? await db.collection('leads').find({ clientId: 'agentia-ventas', canal_origen: 'fb-ads' }).project({ form_id: 1, _id: 0 }).toArray()
      : docs;
    const formIdSet = new Set<string>();
    for (const d of allDocs) {
      if (d.form_id) formIdSet.add(String(d.form_id));
    }
    const formIds = Array.from(formIdSet).sort();

    const leads = docs.map((d) => ({
      id:           d.leadId as string,
      nombre:       (d.nombre || d.senderName || d.senderId || 'Sin nombre') as string,
      telefono:     (d.telefono || d.senderId || '') as string,
      email:        (d.email || '') as string,
      campana:      (d.campana || '') as string,
      adset:        (d.adset || '') as string,
      canal_origen: (d.canal_origen || 'whatsapp') as string,
      form_id:      (d.form_id     || '') as string,
      form_name:    (d.form_name   || '') as string,
      page_name:    (d.page_name   || '') as string,
      platform_src: (d.platform_src || '') as string,
      form_fields:  (d.form_fields || {}) as Record<string, string>,
      estado:       mapEstado(d.status_vendedor as string | undefined),
      createdAt:    (d.createdAt as Date).toISOString(),
    }));

    return NextResponse.json({ leads, formIds });
  } catch (err) {
    console.error('[demo/luciano/leads] Error:', err);
    return NextResponse.json({ leads: [], formIds: [] }, { status: 500 });
  }
}

function mapEstado(sv: string | undefined): 'nuevo' | 'contactado' | 'en_seguimiento' {
  if (!sv || sv === 'nuevo') return 'nuevo';
  if (sv === 'contactado' || sv === 'en_negociacion' || sv === 'vio_demo') return 'contactado';
  if (sv === 'interesado' || sv === 'sin_respuesta') return 'en_seguimiento';
  if (sv === 'cerrado' || sv === 'perdido') return 'en_seguimiento';
  return 'nuevo';
}
