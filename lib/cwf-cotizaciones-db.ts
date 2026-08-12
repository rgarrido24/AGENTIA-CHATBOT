/**
 * Persistencia MongoDB para cotizaciones CWF.
 * Solo importar desde API routes o Server Components.
 */
import { getMongoDb } from '@/lib/mongodb';
import type {
  CotizacionCliente,
  CotizacionEstado,
  CotizacionProducto,
  CwfCotizacion,
} from '@/lib/cwf-cotizaciones';

function mapCwfCotizacionDoc(d: Record<string, unknown>): CwfCotizacion {
  return {
    _id: d._id ? String(d._id) : undefined,
    folio: String(d.folio),
    fecha: d.fecha instanceof Date ? d.fecha : new Date(String(d.fecha)),
    cliente: d.cliente as CotizacionCliente,
    productos: d.productos as CotizacionProducto[],
    subtotal: Number(d.subtotal),
    iva: Number(d.iva),
    envio: Number(d.envio),
    total: Number(d.total),
    precioEspecialDistribuidor: Boolean(d.precioEspecialDistribuidor),
    estado: (d.estado as CotizacionEstado) || 'borrador',
    notas: String(d.notas || ''),
    publicToken: typeof d.publicToken === 'string' ? d.publicToken : undefined,
    publicUrl: typeof d.publicUrl === 'string' ? d.publicUrl : undefined,
    publicExpiresAt:
      d.publicExpiresAt instanceof Date
        ? d.publicExpiresAt
        : d.publicExpiresAt
          ? new Date(String(d.publicExpiresAt))
          : undefined,
  };
}

export async function peekNextCwfFolio(): Promise<string> {
  const year = new Date().getFullYear();
  const db = await getMongoDb();
  const counter = await db.collection<{ _id: string; seq: number }>('cwf_counters').findOne({
    _id: `cotizaciones_${year}`,
  });
  const seq = (counter?.seq ?? 0) + 1;
  return `CWF-${year}-${String(seq).padStart(3, '0')}`;
}

export async function getNextCwfFolio(): Promise<string> {
  const year = new Date().getFullYear();
  const db = await getMongoDb();
  const result = await db.collection<{ _id: string; seq: number }>('cwf_counters').findOneAndUpdate(
    { _id: `cotizaciones_${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const seq = result?.seq ?? 1;
  return `CWF-${year}-${String(seq).padStart(3, '0')}`;
}

export async function saveCwfCotizacion(doc: Omit<CwfCotizacion, '_id'>): Promise<CwfCotizacion> {
  const db = await getMongoDb();
  const payload = { ...doc, updatedAt: new Date() };
  await db.collection('cwf_cotizaciones').updateOne(
    { folio: doc.folio },
    { $set: payload, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  const saved = await db.collection('cwf_cotizaciones').findOne({ folio: doc.folio });
  if (!saved) return doc;
  return mapCwfCotizacionDoc(saved as Record<string, unknown>);
}

export async function listCwfCotizaciones(limit = 10): Promise<CwfCotizacion[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection('cwf_cotizaciones')
    .find({})
    .sort({ fecha: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map((d) => mapCwfCotizacionDoc(d as Record<string, unknown>));
}

export async function getCwfCotizacionByFolio(folio: string): Promise<CwfCotizacion | null> {
  const db = await getMongoDb();
  const d = await db.collection('cwf_cotizaciones').findOne({ folio });
  if (!d) return null;
  return mapCwfCotizacionDoc(d as Record<string, unknown>);
}
