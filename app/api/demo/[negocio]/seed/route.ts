/**
 * Datos de prueba para las demos (capturas y presentaciones).
 * Escribe los valores exactos en la colección del negocio, sin pasar por el
 * flujo de venta y sin sincronizar Google Wallet.
 *
 * No se llama desde ningún botón de la UI: es solo para uso manual.
 *
 *   POST /api/demo/cafe/seed   { "clientes": [ ... ] }
 *   DELETE /api/demo/cafe/seed  → borra únicamente lo insertado por aquí
 *
 * Requiere la cookie del login de demos (uno solo para las 3).
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEMO_AUTH_COOKIE, expectedDemoAuthToken } from '@/lib/demo-auth';
import { getMongoDb } from '@/lib/mongodb';
import { normalizeSabucanTelefono, parseFechaNacimiento } from '@/lib/sabucan-clientes';
import { roundPuntos } from '@/lib/wallet-sabucan-points';
import { getTenant, isDemoNegocio, tenantCashbackPct } from '@/lib/wallet-tenant';

export const dynamic = 'force-dynamic';

/** Marca para poder limpiar después solo estos registros. */
const SEED_FLAG = 'seedDemo';

type Ctx = { params: Promise<{ negocio: string }> };

type SeedInput = {
  nombre?: unknown;
  telefono?: unknown;
  fechaNacimiento?: unknown;
  saldoOPuntos?: unknown;
  saldo?: unknown;
  puntos?: unknown;
  ultimaVisita?: unknown;
};

async function requireAuth(): Promise<NextResponse | null> {
  const expected = await expectedDemoAuthToken();
  const token = (await cookies()).get(DEMO_AUTH_COOKIE)?.value;
  if (token !== expected) {
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

export async function POST(request: NextRequest, ctx: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { negocio } = await ctx.params;
  if (!isDemoNegocio(negocio)) {
    return NextResponse.json({ error: 'Demo inválida' }, { status: 404 });
  }
  const tenant = getTenant(negocio);
  if (!tenant) return NextResponse.json({ error: 'Demo inválida' }, { status: 404 });

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

    const pct = tenantCashbackPct(tenant);
    const ahora = new Date().toISOString();

    const docs = lista.map((raw, i) => {
      const nombre = String(raw.nombre ?? '').trim();
      if (!nombre) throw new Error(`Cliente ${i + 1}: nombre requerido`);

      const telefono = normalizeSabucanTelefono(String(raw.telefono ?? ''));
      if (telefono.length !== 10) {
        throw new Error(`Cliente ${i + 1} (${nombre}): teléfono debe tener 10 dígitos`);
      }

      const saldoRaw = raw.saldoOPuntos ?? raw.saldo ?? raw.puntos;
      const saldo = roundPuntos(Number(saldoRaw));
      if (!Number.isFinite(saldo) || saldo < 0) {
        throw new Error(`Cliente ${i + 1} (${nombre}): saldoOPuntos inválido`);
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
    const coll = db.collection(tenant.collection);

    let insertados = 0;
    let actualizados = 0;
    for (const doc of docs) {
      const res = await coll.updateOne({ telefono: doc.telefono }, { $set: doc }, { upsert: true });
      if (res.upsertedCount > 0) insertados += 1;
      else actualizados += 1;
    }

    return NextResponse.json({
      ok: true,
      negocio,
      coleccion: tenant.collection,
      insertados,
      actualizados,
      total: docs.length,
      nota: `Datos de prueba. Para limpiar: DELETE /api/demo/${negocio}/seed`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error al cargar datos de prueba';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { negocio } = await ctx.params;
  const tenant = isDemoNegocio(negocio) ? getTenant(negocio) : null;
  if (!tenant) return NextResponse.json({ error: 'Demo inválida' }, { status: 404 });

  const db = await getMongoDb();
  const res = await db.collection(tenant.collection).deleteMany({ [SEED_FLAG]: true });

  return NextResponse.json({
    ok: true,
    negocio,
    coleccion: tenant.collection,
    eliminados: res.deletedCount ?? 0,
  });
}
