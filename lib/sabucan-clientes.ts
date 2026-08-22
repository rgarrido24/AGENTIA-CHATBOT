import { ObjectId, type Collection } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { calcularPuntos } from '@/lib/wallet-sabucan-points';

export const SABUCAN_CLIENTES_COLLECTION = 'sabucan_clientes';

export type SabucanHistorialTipo = 'compra' | 'canje';

export type SabucanCompra = {
  fecha: string;
  monto: number;
  /** En compra: puntos sumados. En canje: puntos restados. */
  puntosGanados: number;
  /** Registros viejos sin tipo = compra */
  tipo?: SabucanHistorialTipo;
};

export type SabucanCliente = {
  id: string;
  telefono: string;
  nombre: string;
  puntos: number;
  historial: SabucanCompra[];
};

type SabucanClienteDoc = {
  _id?: ObjectId;
  telefono: string;
  nombre: string;
  puntos: number;
  historial: SabucanCompra[];
  created_at?: string;
  updated_at?: string;
};

let indexReady = false;

/** Solo dígitos; si viene con 52 y 12+ dígitos, se queda el nacional de 10. */
export function normalizeSabucanTelefono(raw: string): string {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('52') && digits.length >= 12) {
    digits = digits.slice(-10);
  }
  return digits;
}

function docToCliente(doc: SabucanClienteDoc & { _id: ObjectId }): SabucanCliente {
  return {
    id: doc._id.toString(),
    telefono: doc.telefono,
    nombre: doc.nombre,
    puntos: doc.puntos ?? 0,
    historial: Array.isArray(doc.historial) ? doc.historial : [],
  };
}

async function collection(): Promise<Collection<SabucanClienteDoc>> {
  const db = await getMongoDb();
  const coll = db.collection<SabucanClienteDoc>(SABUCAN_CLIENTES_COLLECTION);
  if (!indexReady) {
    try {
      await coll.createIndex({ telefono: 1 }, { unique: true });
      indexReady = true;
    } catch (e) {
      console.warn('[sabucan_clientes] index:', e instanceof Error ? e.message : e);
      indexReady = true;
    }
  }
  return coll;
}

export async function findSabucanByTelefono(telefonoRaw: string): Promise<SabucanCliente | null> {
  const telefono = normalizeSabucanTelefono(telefonoRaw);
  if (telefono.length < 10) return null;
  const coll = await collection();
  const doc = await coll.findOne({ telefono });
  if (!doc?._id) return null;
  return docToCliente(doc as SabucanClienteDoc & { _id: ObjectId });
}

export async function findSabucanById(id: string): Promise<SabucanCliente | null> {
  if (!ObjectId.isValid(id)) return null;
  const coll = await collection();
  const doc = await coll.findOne({ _id: new ObjectId(id) });
  if (!doc?._id) return null;
  return docToCliente(doc as SabucanClienteDoc & { _id: ObjectId });
}

export type RegistrarVentaInput = {
  telefono: string;
  monto: number;
  /** Obligatorio si el cliente no existe */
  nombre?: string;
};

export type RegistrarVentaResult = {
  cliente: SabucanCliente;
  puntosGanados: number;
  esNuevo: boolean;
};

export async function registrarVentaSabucan(
  input: RegistrarVentaInput,
): Promise<RegistrarVentaResult> {
  const telefono = normalizeSabucanTelefono(input.telefono);
  if (telefono.length < 10) {
    throw new Error('Teléfono inválido (mínimo 10 dígitos)');
  }
  const monto = Number(input.monto);
  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error('Monto inválido');
  }

  const puntosGanados = calcularPuntos(monto);
  const now = new Date().toISOString();
  const compra: SabucanCompra = { fecha: now, monto, puntosGanados, tipo: 'compra' };
  const coll = await collection();
  const existing = await coll.findOne({ telefono });

  if (existing?._id) {
    const result = await coll.findOneAndUpdate(
      { _id: existing._id },
      {
        $inc: { puntos: puntosGanados },
        $push: { historial: { $each: [compra], $position: 0 } },
        $set: { updated_at: now },
      },
      { returnDocument: 'after' },
    );
    if (!result?._id) throw new Error('No se pudo actualizar el cliente');
    return {
      cliente: docToCliente(result as SabucanClienteDoc & { _id: ObjectId }),
      puntosGanados,
      esNuevo: false,
    };
  }

  const nombre = String(input.nombre ?? '').trim();
  if (!nombre) {
    throw new Error('Nombre requerido para cliente nuevo');
  }

  const insert: SabucanClienteDoc = {
    telefono,
    nombre,
    puntos: puntosGanados,
    historial: [compra],
    created_at: now,
    updated_at: now,
  };
  const { insertedId } = await coll.insertOne(insert);
  return {
    cliente: {
      id: insertedId.toString(),
      telefono,
      nombre,
      puntos: puntosGanados,
      historial: [compra],
    },
    puntosGanados,
    esNuevo: true,
  };
}

export type CanjearPuntosResult = {
  cliente: SabucanCliente;
  puntosCanjeados: number;
  descuentoMxn: number;
};

/** 1 punto = $1 MXN. Cualquier cantidad ≤ saldo. */
export async function canjearPuntosSabucan(
  telefonoRaw: string,
  puntosRaw: number,
): Promise<CanjearPuntosResult> {
  const telefono = normalizeSabucanTelefono(telefonoRaw);
  if (telefono.length < 10) {
    throw new Error('Teléfono inválido (mínimo 10 dígitos)');
  }

  const puntosCanjeados = Math.floor(Number(puntosRaw));
  if (!Number.isFinite(puntosCanjeados) || puntosCanjeados <= 0) {
    throw new Error('Cantidad de puntos inválida');
  }

  const coll = await collection();
  const existing = await coll.findOne({ telefono });
  if (!existing?._id) {
    throw new Error('Cliente no encontrado');
  }
  if ((existing.puntos ?? 0) < puntosCanjeados) {
    throw new Error(`Saldo insuficiente (${existing.puntos}/${puntosCanjeados} pts)`);
  }

  const now = new Date().toISOString();
  const descuentoMxn = puntosCanjeados; // 1 punto = $1 MXN
  const registro: SabucanCompra = {
    fecha: now,
    monto: descuentoMxn,
    puntosGanados: puntosCanjeados,
    tipo: 'canje',
  };

  const result = await coll.findOneAndUpdate(
    { _id: existing._id, puntos: { $gte: puntosCanjeados } },
    {
      $inc: { puntos: -puntosCanjeados },
      $push: { historial: { $each: [registro], $position: 0 } },
      $set: { updated_at: now },
    },
    { returnDocument: 'after' },
  );

  if (!result?._id) {
    throw new Error('No se pudo canjear (saldo insuficiente o error de actualización)');
  }

  return {
    cliente: docToCliente(result as SabucanClienteDoc & { _id: ObjectId }),
    puntosCanjeados,
    descuentoMxn,
  };
}
