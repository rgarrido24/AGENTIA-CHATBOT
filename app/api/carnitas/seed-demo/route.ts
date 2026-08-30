/**
 * TEMPORAL — carga datos de prueba en carnitas_clientes para capturas de la
 * landing. Escribe los valores exactos que se le pasan, sin pasar por el flujo
 * de venta y sin sincronizar Google Wallet.
 *
 * No se llama desde ningún botón de la UI: es solo para uso manual.
 *
 *   POST /api/carnitas/seed-demo   { "clientes": [ ... ] }
 *   DELETE /api/carnitas/seed-demo  → borra únicamente lo insertado por aquí
 *
 * Requiere la cookie de sesión de /carnitas/login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  CARNITAS_AUTH_COOKIE,
  expectedCarnitasAuthToken,
  isCarnitasAuthConfigured,
} from '@/lib/carnitas-auth';
import { getMongoDb } from '@/lib/mongodb';
import { normalizeSabucanTelefono, parseFechaNacimiento } from '@/lib/sabucan-clientes';
import { roundPuntos } from '@/lib/wallet-sabucan-points';
import { TENANTS, tenantCashbackPct } from '@/lib/wallet-tenant';

export const dynamic = 'force-dynamic';

const TENANT = TENANTS.carnitas_granada;
/** Marca para poder limpiar después solo estos registros. */
const SEED_FLAG = 'seedDemo';

type SeedInput = {
  nombre?: unknown;
  telefono?: unknown;
  fechaNacimiento?: unknown;
  saldo?: unknown;
  ultimaVisita?: unknown;
};

async function requireAuth(): Promise<NextResponse | null> {
  if (!isCarnitasAuthConfigured()) {
    return NextResponse.json(
      { error: 'Auth no configurado (CARNITAS_ADMIN_USER / CARNITAS_ADMIN_PASSWORD)' },
      { status: 500 },
    );
  }
  const expected = await expectedCarnitasAuthToken();
  const token = (await cookies()).get(CARNITAS_AUTH_COOKIE)?.value;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return null;
}

function parseFecha(raw: unknown, campo: string): string {
  const s = String(raw ?? '').trim();
  if (!s) throw new Error(`${campo} requerida`);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00.000Z`) : new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`${campo} inválida: ${s}`);
  return d.toISOString();
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => null)) as
      | { clientes?: SeedInput[] }
      | SeedInput[]
      | null;
    const lista = Array.isArray(body) ? body : body?.clientes;
    if (!Array.isArray(lista) || lista.length === 0) {
      return NextResponse.json(
        { error: 'Envía un array de clientes (o { clientes: [...] })' },
        { status: 400 },
      );
    }

    const pct = tenantCashbackPct(TENANT);
    const ahora = new Date().toISOString();

    const docs = lista.map((raw, i) => {
      const nombre = String(raw.nombre ?? '').trim();
      if (!nombre) throw new Error(`Cliente ${i + 1}: nombre requerido`);

      const telefono = normalizeSabucanTelefono(String(raw.telefono ?? ''));
      if (telefono.length !== 10) {
        throw new Error(`Cliente ${i + 1} (${nombre}): teléfono debe tener 10 dígitos`);
      }

      const saldo = roundPuntos(Number(raw.saldo));
      if (!Number.isFinite(saldo) || saldo < 0) {
        throw new Error(`Cliente ${i + 1} (${nombre}): saldo inválido`);
      }

      const fechaNacimiento = parseFechaNacimiento(String(raw.fechaNacimiento ?? ''));
      const ultimaVisita = parseFecha(raw.ultimaVisita, `Cliente ${i + 1} ultimaVisita`);

      // Historial coherente con el saldo: la compra que lo habría generado.
      const monto = pct > 0 ? Math.round((saldo * 100) / pct) : 0;
      const historial =
        saldo > 0
          ? [{ fecha: ultimaVisita, monto, puntosGanados: saldo, tipo: 'compra' as const }]
          : [];

      return {
        telefono,
        nombre,
        nombreCompleto: nombre,
        fechaNacimiento,
        ultimaVisita,
        puntos: saldo,
        historial,
        [SEED_FLAG]: true,
        created_at: ahora,
        updated_at: ahora,
      };
    });

    const db = await getMongoDb();
    const coll = db.collection(TENANT.collection);

    let insertados = 0;
    let actualizados = 0;
    for (const doc of docs) {
      const res = await coll.updateOne(
        { telefono: doc.telefono },
        { $set: doc },
        { upsert: true },
      );
      if (res.upsertedCount > 0) insertados += 1;
      else actualizados += 1;
    }

    return NextResponse.json({
      ok: true,
      coleccion: TENANT.collection,
      insertados,
      actualizados,
      total: docs.length,
      nota: 'Datos de prueba. Para limpiar: DELETE /api/carnitas/seed-demo',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al cargar datos de prueba';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE() {
  const denied = await requireAuth();
  if (denied) return denied;

  const db = await getMongoDb();
  const coll = db.collection(TENANT.collection);
  const res = await coll.deleteMany({ [SEED_FLAG]: true });

  return NextResponse.json({
    ok: true,
    coleccion: TENANT.collection,
    eliminados: res.deletedCount ?? 0,
  });
}
