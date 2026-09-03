import { ObjectId, type Collection } from 'mongodb';
import { getMongoDb } from '@/lib/mongodb';
import { calcularPuntosCashback, roundPuntos } from '@/lib/wallet-sabucan-points';
import { getTenant, tenantCashbackPct, type TenantId } from '@/lib/wallet-tenant';

export const SABUCAN_CLIENTES_COLLECTION = 'sabucan_clientes';

export type SabucanHistorialTipo = 'compra' | 'canje' | 'contacto_reactivacion';

export type SabucanCompra = {
  fecha: string;
  monto: number;
  puntosGanados: number;
  tipo?: SabucanHistorialTipo;
  /** Solo en contacto_reactivacion: qué plantilla usó el dueño. */
  plantilla?: string;
  nota?: string;
};

export type SabucanCliente = {
  id: string;
  telefono: string;
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
  nombre: string;
  nombreCompleto?: string;
  fechaNacimiento?: string | Date | null;
  ultimaVisita?: string | Date | null;
  puntos: number;
  historial: SabucanCompra[];
  created_at?: string;
  updated_at?: string;
};

const indexReadyByCollection = new Set<string>();

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

export function parseFechaNacimiento(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) throw new Error('Fecha de nacimiento requerida');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new Error('Fecha de nacimiento inválida');
    if (d.getTime() > Date.now()) throw new Error('Fecha de nacimiento inválida');
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
  const ultimaTransaccion = hist.find((h) => h.tipo !== 'contacto_reactivacion');
  if (ultimaTransaccion?.fecha) {
    const fromHist = toIsoDate(ultimaTransaccion.fecha);
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

function resolveCollectionName(tenantId?: TenantId | string): string {
  if (!tenantId || tenantId === 'sabucan') return SABUCAN_CLIENTES_COLLECTION;
  const t = getTenant(tenantId);
  if (!t) throw new Error(`Tenant inválido: ${tenantId}`);
  return t.collection;
}

async function collection(tenantId?: TenantId | string): Promise<Collection<SabucanClienteDoc>> {
  const name = resolveCollectionName(tenantId);
  const db = await getMongoDb();
  const coll = db.collection<SabucanClienteDoc>(name);
  if (!indexReadyByCollection.has(name)) {
    try {
      await coll.createIndex({ telefono: 1 }, { unique: true });
    } catch (e) {
      console.warn(`[${name}] index:`, e instanceof Error ? e.message : e);
    }
    indexReadyByCollection.add(name);
  }
  return coll;
}

export async function findClienteByTelefono(
  tenantId: TenantId | string,
  telefonoRaw: string,
): Promise<SabucanCliente | null> {
  const telefono = normalizeSabucanTelefono(telefonoRaw);
  if (telefono.length < 10) return null;
  const coll = await collection(tenantId);
  const doc = await coll.findOne({ telefono });
  if (!doc?._id) return null;
  return docToCliente(doc as SabucanClienteDoc & { _id: ObjectId });
}

export async function findSabucanByTelefono(telefonoRaw: string): Promise<SabucanCliente | null> {
  return findClienteByTelefono('sabucan', telefonoRaw);
}

export async function findClienteById(
  tenantId: TenantId | string,
  id: string,
): Promise<SabucanCliente | null> {
  if (!ObjectId.isValid(id)) return null;
  const coll = await collection(tenantId);
  const doc = await coll.findOne({ _id: new ObjectId(id) });
  if (!doc?._id) return null;
  return docToCliente(doc as SabucanClienteDoc & { _id: ObjectId });
}

export async function findSabucanById(id: string): Promise<SabucanCliente | null> {
  return findClienteById('sabucan', id);
}

export async function listClientes(tenantId: TenantId | string): Promise<SabucanCliente[]> {
  const coll = await collection(tenantId);
  const docs = await coll.find({}).toArray();
  const clientes = docs
    .filter((d): d is SabucanClienteDoc & { _id: ObjectId } => Boolean(d._id))
    .map(docToCliente);
  clientes.sort((a, b) => {
    const ta = a.ultimaVisita ? new Date(a.ultimaVisita).getTime() : 0;
    const tb = b.ultimaVisita ? new Date(b.ultimaVisita).getTime() : 0;
    return ta - tb;
  });
  return clientes;
}

export async function listSabucanClientes(): Promise<SabucanCliente[]> {
  return listClientes('sabucan');
}

export async function resetClientesCollection(tenantId: TenantId | string): Promise<number> {
  const t = getTenant(tenantId);
  if (!t?.isDemo) {
    throw new Error('Solo se pueden reiniciar colecciones de demo');
  }
  const coll = await collection(tenantId);
  const result = await coll.deleteMany({});
  return result.deletedCount ?? 0;
}

export type RegistrarVentaInput = {
  telefono: string;
  monto: number;
  nombre?: string;
  nombreCompleto?: string;
  fechaNacimiento?: string;
};

export type RegistrarVentaResult = {
  cliente: SabucanCliente;
  puntosGanados: number;
  esNuevo: boolean;
};

export async function registrarVenta(
  tenantId: TenantId | string,
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

  const tenantCfg = getTenant(tenantId);
  if (!tenantCfg) throw new Error(`Tenant inválido: ${tenantId}`);
  const puntosGanados = calcularPuntosCashback(monto, tenantCashbackPct(tenantCfg));
  const now = new Date().toISOString();
  const compra: SabucanCompra = { fecha: now, monto, puntosGanados, tipo: 'compra' };
  const coll = await collection(tenantId);
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

export async function registrarVentaSabucan(
  input: RegistrarVentaInput,
): Promise<RegistrarVentaResult> {
  return registrarVenta('sabucan', input);
}

export type AltaClienteInput = {
  telefono: string;
  nombreCompleto: string;
  fechaNacimiento: string;
};

export type AltaClienteResult = {
  cliente: SabucanCliente;
  esNuevo: boolean;
};

/**
 * Auto-registro público para cualquier tenant:
 * - Si el teléfono ya existe, NO crea duplicado y devuelve su saldo actual.
 * - Si no existe, crea el cliente con saldo inicial en 0 puntos.
 */
export async function altaCliente(
  tenantId: TenantId | string,
  input: AltaClienteInput,
): Promise<AltaClienteResult> {
  const telefono = normalizeSabucanTelefono(input.telefono);
  if (telefono.length < 10) {
    throw new Error('Teléfono inválido (mínimo 10 dígitos)');
  }

  const nombreCompleto = String(input.nombreCompleto ?? '').trim();
  if (!nombreCompleto) {
    throw new Error('Nombre completo requerido');
  }

  const fechaNacimiento = parseFechaNacimiento(input.fechaNacimiento);

  const coll = await collection(tenantId);
  const existing = await coll.findOne({ telefono });
  if (existing?._id) {
    return { cliente: docToCliente(existing as SabucanClienteDoc & { _id: ObjectId }), esNuevo: false };
  }

  const now = new Date().toISOString();
  const doc: SabucanClienteDoc = {
    telefono,
    nombre: nombreCompleto,
    nombreCompleto,
    fechaNacimiento,
    ultimaVisita: now,
    puntos: 0,
    historial: [],
    created_at: now,
    updated_at: now,
  };

  try {
    const { insertedId } = await coll.insertOne(doc);
    return {
      cliente: docToCliente({ ...(doc as SabucanClienteDoc), _id: insertedId }),
      esNuevo: true,
    };
  } catch (e) {
    // En caso de concurrencia, el unique index por `telefono` puede fallar.
    // Recuperamos el documento existente y devolvemos su saldo.
    const msg = e instanceof Error ? e.message : String(e ?? '');
    if (/E11000|duplicate key/i.test(msg)) {
      const again = await coll.findOne({ telefono });
      if (again?._id) {
        return { cliente: docToCliente(again as SabucanClienteDoc & { _id: ObjectId }), esNuevo: false };
      }
    }
    throw e;
  }
}

export type CanjearPuntosResult = {
  cliente: SabucanCliente;
  puntosCanjeados: number;
  descuentoMxn: number;
};

export async function canjearPuntos(
  tenantId: TenantId | string,
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

  const coll = await collection(tenantId);
  const existing = await coll.findOne({ telefono });
  if (!existing?._id) {
    throw new Error('Cliente no encontrado');
  }
  const saldo = roundPuntos(existing.puntos ?? 0);
  if (saldo < puntosCanjeados) {
    throw new Error(`Saldo insuficiente (${saldo}/${puntosCanjeados} pts)`);
  }

  const now = new Date().toISOString();
  const descuentoMxn = puntosCanjeados;
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

export async function canjearPuntosSabucan(
  telefonoRaw: string,
  puntosRaw: number,
): Promise<CanjearPuntosResult> {
  return canjearPuntos('sabucan', telefonoRaw, puntosRaw);
}

export type RegistrarContactoInput = {
  telefono: string;
  plantilla: string;
  mensaje?: string;
};

/**
 * Deja constancia de un contacto de reactivación por WhatsApp.
 * No mueve puntos ni `ultimaVisita`: haber escrito al cliente no es una visita.
 */
export async function registrarContacto(
  tenantId: TenantId | string,
  input: RegistrarContactoInput,
): Promise<SabucanCliente> {
  const telefono = normalizeSabucanTelefono(input.telefono);
  if (telefono.length < 10) {
    throw new Error('Teléfono inválido (mínimo 10 dígitos)');
  }
  const plantilla = String(input.plantilla ?? '').trim();
  if (!plantilla) throw new Error('Plantilla requerida');

  const now = new Date().toISOString();
  const registro: SabucanCompra = {
    fecha: now,
    monto: 0,
    puntosGanados: 0,
    tipo: 'contacto_reactivacion',
    plantilla,
    ...(input.mensaje ? { nota: String(input.mensaje).slice(0, 500) } : {}),
  };

  const coll = await collection(tenantId);
  const result = await coll.findOneAndUpdate(
    { telefono },
    {
      $push: { historial: { $each: [registro], $position: 0 } },
      $set: { updated_at: now },
    },
    { returnDocument: 'after' },
  );

  if (!result?._id) throw new Error('Cliente no encontrado');
  return docToCliente(result as SabucanClienteDoc & { _id: ObjectId });
}

export function diasInactividad(ultimaVisita: string | null | undefined): number {
  if (!ultimaVisita) return Number.POSITIVE_INFINITY;
  const t = new Date(ultimaVisita).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
}

export type SemaforoInactividad = 'verde' | 'amarillo' | 'rojo';

export function semaforoInactividad(dias: number): SemaforoInactividad {
  if (dias <= 7) return 'verde';
  if (dias <= 15) return 'amarillo';
  return 'rojo';
}
