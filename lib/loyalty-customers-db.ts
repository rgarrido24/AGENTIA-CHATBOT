import { getMongoDb } from '@/lib/mongodb';
import type { LoyaltyCustomer, LoyaltyVisit, RedemptionId } from '@/lib/loyalty-restaurant';
import {
  LOYALTY_RESTAURANT_ID,
  REDEMPTION_OPTIONS,
  puntosPorMonto,
} from '@/lib/loyalty-restaurant';

export type LoyaltyCustomerDoc = {
  _id?: import('mongodb').ObjectId;
  nombre: string;
  telefono: string;
  puntos: number;
  visitas: LoyaltyVisit[];
  ultimo_consumo: string | null;
  restaurante_id: string;
  created_at?: string;
  updated_at?: string;
};

const COLLECTION = 'loyalty_customers';

function docToCustomer(doc: LoyaltyCustomerDoc & { _id: import('mongodb').ObjectId }): LoyaltyCustomer {
  return {
    id: doc._id.toString(),
    nombre: doc.nombre,
    telefono: doc.telefono,
    puntos: doc.puntos,
    visitas: doc.visitas ?? [],
    ultimo_consumo: doc.ultimo_consumo,
    restaurante_id: doc.restaurante_id,
  };
}

export async function listLoyaltyCustomers(restauranteId = LOYALTY_RESTAURANT_ID): Promise<LoyaltyCustomer[]> {
  const db = await getMongoDb();
  const docs = await db
    .collection<LoyaltyCustomerDoc>(COLLECTION)
    .find({ restaurante_id: restauranteId })
    .sort({ ultimo_consumo: -1 })
    .toArray();
  return docs.map((d) => docToCustomer(d as LoyaltyCustomerDoc & { _id: import('mongodb').ObjectId }));
}

export async function findByPhone(
  telefono: string,
  restauranteId = LOYALTY_RESTAURANT_ID,
): Promise<LoyaltyCustomer | null> {
  const db = await getMongoDb();
  const doc = await db.collection<LoyaltyCustomerDoc>(COLLECTION).findOne({
    telefono,
    restaurante_id: restauranteId,
  });
  if (!doc?._id) return null;
  return docToCustomer(doc as LoyaltyCustomerDoc & { _id: import('mongodb').ObjectId });
}

export async function upsertLoyaltyCustomer(customer: LoyaltyCustomer): Promise<LoyaltyCustomer> {
  const db = await getMongoDb();
  const now = new Date().toISOString();
  const { ObjectId } = await import('mongodb');

  const payload: Omit<LoyaltyCustomerDoc, '_id'> = {
    nombre: customer.nombre,
    telefono: customer.telefono,
    puntos: customer.puntos,
    visitas: customer.visitas,
    ultimo_consumo: customer.ultimo_consumo,
    restaurante_id: customer.restaurante_id,
    updated_at: now,
  };

  if (customer.id && ObjectId.isValid(customer.id)) {
    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(customer.id) },
      { $set: payload },
    );
    return customer;
  }

  const result = await db.collection<LoyaltyCustomerDoc>(COLLECTION).insertOne({
    ...payload,
    created_at: now,
  });
  return { ...customer, id: result.insertedId.toString() };
}

export async function registerConsumption(
  customerId: string,
  monto: number,
): Promise<LoyaltyCustomer | null> {
  const db = await getMongoDb();
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(customerId)) return null;

  const earned = puntosPorMonto(monto);
  const now = new Date().toISOString();
  const visit: LoyaltyVisit = { fecha: now, monto, puntos: earned, tipo: 'consumo' };

  const result = await db.collection<LoyaltyCustomerDoc>(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(customerId) },
    {
      $inc: { puntos: earned },
      $set: { ultimo_consumo: now, updated_at: now },
      $push: { visitas: { $each: [visit], $position: 0 } },
    },
    { returnDocument: 'after' },
  );

  if (!result?._id) return null;
  return docToCustomer(result as LoyaltyCustomerDoc & { _id: import('mongodb').ObjectId });
}

export async function redeemPoints(
  customerId: string,
  redemptionId: RedemptionId,
): Promise<{ customer: LoyaltyCustomer | null; error?: string }> {
  const option = REDEMPTION_OPTIONS.find((r) => r.id === redemptionId);
  if (!option) return { customer: null, error: 'Premio inválido' };

  const db = await getMongoDb();
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(customerId)) return { customer: null, error: 'Cliente inválido' };

  const existing = await db.collection<LoyaltyCustomerDoc>(COLLECTION).findOne({
    _id: new ObjectId(customerId),
  });
  if (!existing) return { customer: null, error: 'Cliente no encontrado' };
  if (existing.puntos < option.puntos) {
    return { customer: null, error: `Saldo insuficiente (${existing.puntos}/${option.puntos} pts)` };
  }

  const now = new Date().toISOString();
  const visit: LoyaltyVisit = {
    fecha: now,
    monto: 0,
    puntos: option.puntos,
    tipo: 'canje',
    nota: option.label,
  };

  const result = await db.collection<LoyaltyCustomerDoc>(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(customerId) },
    {
      $inc: { puntos: -option.puntos },
      $set: { updated_at: now },
      $push: { visitas: { $each: [visit], $position: 0 } },
    },
    { returnDocument: 'after' },
  );

  if (!result?._id) return { customer: null, error: 'Error al canjear' };
  return { customer: docToCustomer(result as LoyaltyCustomerDoc & { _id: import('mongodb').ObjectId }) };
}
