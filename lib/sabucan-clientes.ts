import { ObjectId, type Collection } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { calcularPuntos, roundPuntos } from '@/lib/wallet-sabucan-points';

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
  /** Nombre completo (UI y Wallet). */
  nombre: string;
  nombreCompleto: string;
  fechaNacimiento: string | null;
  ultimaVisita: string | null;
  puntos: number;
  historial: SabucanCompra[];
};

type SabucanClienteDoc = {
  _id?: ObjectId;
  telefono: string;
  /** Legacy; se mantiene sincronizado con nombreCompleto */
  nombre: string;
  nombreCompleto?: string;
  fechaNacimiento?: string | Date | null;
  ultimaVisita?: string | Date | null;
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

function toIsoDate(value: string | Date | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Acepta YYYY-MM-DD o ISO; guarda ISO UTC a medianoche local aproximada. */
export function parseFechaNacimiento(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) throw new Error('Fecha de nacimiento requerida');
  // date input → YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new Error('Fecha de nacimiento inválida');
    const now = new Date();
    if (d.getTime() > now.getTime()) throw new Error('Fecha de nacimiento inválida');
    return d.toISOString();
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error('Fecha de nacimiento inválida');
  if (d.getTime() > Date.now()) throw new Error('Fecha de nacimiento inválida');
  return d.toISOString();
}

function resolveUltimaVisita(doc: SabucanClienteDoc): string | null {
  const direct = toIsoDate(doc.ultimaVisita ?? null);
  if (direct) return direct;
  const hist = Array.isArray(doc.historial) ? doc.historial : [];
  if (hist[0]?.fecha) {
    const fromHist = toIsoDate(hist[0].fecha);
    if (fromHist) return fromHist;
  }
  return toIsoDate(doc.updated_at ?? doc.created_at ?? null);
}

function docToCliente(doc: SabucanClienteDoc & { _id: ObjectId }): SabucanCliente {
  const nombreCompleto = String(doc.nombreCompleto ?? doc.nombre ?? '').trim();
  return {
    id: doc._id.toString(),
    telefono: doc.telefono,
    nombre: nombreCompleto || String(doc.nombre ?? '').trim(),
    nombreCompleto: nombreCompleto || String(doc.nombre ?? '').trim(),
    fechaNacimiento: toIsoDate(doc.fechaNacimiento ?? null),
    ultimaVisita: resolveUltimaVisita(doc),
    puntos: roundPuntos(doc.puntos ?? 0),
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

export async function listSabucanClientes(): Promise<SabucanCliente[]> {
  const coll = await collection();
  const docs = await coll.find({}).toArray();
  const clientes = docs
    .filter((d): d is SabucanClienteDoc & { _id: ObjectId } => Boolean(d._id))
    .map(docToCliente);

  clientes.sort((a, b) => {
    const ta = a.ultimaVisita ? new Date(a.ultimaVisita).getTime() : 0;
    const tb = b.ultimaVisita ? new Date(b.ultimaVisita).getTime() : 0;
    // Sin visita → al final del “más inactivo” (timestamp 0 = más antiguo)
    return ta - tb;
  });

  return clientes;
}

export type RegistrarVentaInput = {
  telefono: string;
  monto: number;
  /** Obligatorio si el cliente no existe */
  nombre?: string;
  nombreCompleto?: string;
  fechaNacimiento?: string;
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
        $set: { updated_at: now, ultimaVisita: now },
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

  const nombreCompleto = String(input.nombreCompleto ?? input.nombre ?? '').trim();
  if (!nombreCompleto) {
    throw new Error('Nombre completo requerido para cliente nuevo');
  }
  if (!input.fechaNacimiento) {
    throw new Error('Fecha de nacimiento requerida para cliente nuevo');
  }
  const fechaNacimiento = parseFechaNacimiento(input.fechaNacimiento);

  const insert: SabucanClienteDoc = {
    telefono,
    nombre: nombreCompleto,
    nombreCompleto,
    fechaNacimiento,
    ultimaVisita: now,
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
      nombre: nombreCompleto,
      nombreCompleto,
      fechaNacimiento,
      ultimaVisita: now,
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

  const puntosCanjeados = roundPuntos(Number(puntosRaw));
  if (!Number.isFinite(puntosCanjeados) || puntosCanjeados <= 0) {
    throw new Error('Cantidad de puntos inválida');
  }

  const coll = await collection();
  const existing = await coll.findOne({ telefono });
  if (!existing?._id) {
    throw new Error('Cliente no encontrado');
  }
  const saldo = roundPuntos(existing.puntos ?? 0);
  if (saldo < puntosCanjeados) {
    throw new Error(`Saldo insuficiente (${saldo}/${puntosCanjeados} pts)`);
  }

  const now = new Date().toISOString();
  const descuentoMxn = puntosCanjeados; // 1 punto = $1 MXN (con decimales)
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
      $set: { updated_at: now, ultimaVisita: now },
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

/** Días desde ultimaVisita (o Infinity si no hay fecha). */
export function diasInactividad(ultimaVisita: string | null | undefined): number {
  if (!ultimaVisita) return Number.POSITIVE_INFINITY;
  const t = new Date(ultimaVisita).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  const ms = Date.now() - t;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export type SemaforoInactividad = 'verde' | 'amarillo' | 'rojo';

export function semaforoInactividad(dias: number): SemaforoInactividad {
  if (dias <= 7) return 'verde';
  if (dias <= 15) return 'amarillo';
  return 'rojo';
}
