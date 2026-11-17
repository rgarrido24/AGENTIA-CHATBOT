/**
 * Estado compartido de Tostichelas entre dispositivos (mesero, cocina, caja, dueño, clientes).
 *
 *   GET  ?since=<rev>&epoch=<n>   → cambios posteriores a <rev> (delta)
 *   POST { since, epoch, cols, kv, pin?, accion? }
 *        cols: { orders|tickets|mermas|movs|reviews: [{ k, u, d }] }   (se une por k, gana la u mayor)
 *        kv:   { clave: { u, v } }                                     (gana la u mayor)
 *        accion: "reset" | "produccion"  (requieren PIN del dueño)
 *
 * Un solo documento en `demo_tostichelas_estado`. Cada entrada guarda `r` (rev en que cambió)
 * para mandar solo lo nuevo. `epoch` sube con un reset: los clientes tiran su copia local.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const COLL = 'demo_tostichelas_estado';
const ID = 'main';
const COLS = ['orders', 'tickets', 'mermas', 'movs', 'reviews', 'gastos'] as const;
const KV_DUENO = /^(menu|avail\||settings\|)/; // solo el dueño puede cambiarlas
const MAX_ENTRIES = 400;
const MAX_BYTES = 200_000;

const pinDueno = () => process.env.TOSTICHELAS_PIN_DUENO || process.env.TOSTICHELAS_DUENO_PIN || '2222';
const pinCaja = () => process.env.TOSTICHELAS_PIN_CAJA || '1111';
const pinMesero = () => process.env.TOSTICHELAS_PIN_MESERO || '3333';
const pinCocina = () => process.env.TOSTICHELAS_PIN_COCINA || '4444';
const KEEP = /^(menu|avail\||settings\|)/; // el reset no borra el menú ni los ajustes del dueño
const safeKey = (k: unknown) => typeof k === 'string' && /^[\w|:-]{1,80}$/.test(k);

type Doc = {
  _id: string;
  rev: number;
  epoch: number;
  prod: boolean;
  cols: Record<string, Record<string, { d: unknown; u: number; r: number }>>;
  kv: Record<string, { v: unknown; u: number; r: number }>;
};

async function load(): Promise<Doc> {
  const db = await getMongoDb();
  const c = db.collection<Doc>(COLL);
  const d = await c.findOne({ _id: ID });
  if (d) return d;
  const fresh: Doc = { _id: ID, rev: 0, epoch: 1, prod: false, cols: {}, kv: {} };
  await c.updateOne({ _id: ID }, { $setOnInsert: fresh }, { upsert: true });
  return (await c.findOne({ _id: ID })) || fresh;
}

function delta(doc: Doc, since: number) {
  const cols: Record<string, { k: string; u: number; d: unknown }[]> = {};
  for (const name of COLS) {
    const rows = Object.entries(doc.cols?.[name] || {})
      .filter(([, e]) => e.r > since)
      .map(([k, e]) => ({ k, u: e.u, d: e.d }));
    if (rows.length) cols[name] = rows;
  }
  const kv: Record<string, { u: number; v: unknown }> = {};
  for (const [k, e] of Object.entries(doc.kv || {})) if (e.r > since) kv[k] = { u: e.u, v: e.v };
  return { rev: doc.rev, epoch: doc.epoch, prod: doc.prod, cols, kv };
}

export async function GET(req: NextRequest) {
  try {
    const doc = await load();
    const since = Number(req.nextUrl.searchParams.get('since') || 0);
    const epoch = Number(req.nextUrl.searchParams.get('epoch') || 0);
    if (epoch !== doc.epoch) return NextResponse.json({ ...delta(doc, 0), reset: true });
    if (since >= doc.rev) return NextResponse.json({ rev: doc.rev, epoch: doc.epoch, prod: doc.prod, cols: {}, kv: {} });
    return NextResponse.json(delta(doc, since));
  } catch (e) {
    console.error('[tostichelas/estado GET]', e);
    return NextResponse.json({ error: 'Sin conexión con la base de datos' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BYTES) return NextResponse.json({ error: 'Solicitud muy grande' }, { status: 413 });
    const body = JSON.parse(raw || '{}');
    const esDueno = body.pin === pinDueno();
    const db = await getMongoDb();
    const c = db.collection<Doc>(COLL);

    if (body.accion === 'pin') {
      const rol = ['caja', 'mesero', 'cocina'].includes(body.rol) ? body.rol : 'dueno';
      const pins: Record<string, string> = { caja: pinCaja(), mesero: pinMesero(), cocina: pinCocina(), dueno: pinDueno() };
      const envs: Record<string, any> = { caja: process.env.TOSTICHELAS_PIN_CAJA, mesero: process.env.TOSTICHELAS_PIN_MESERO, cocina: process.env.TOSTICHELAS_PIN_COCINA, dueno: process.env.TOSTICHELAS_PIN_DUENO || process.env.TOSTICHELAS_DUENO_PIN };
      const ok = body.pin === pins[rol];
      const defecto = !envs[rol];
      return NextResponse.json({ ok, defecto });
    }

    if (body.accion === 'reset' || body.accion === 'produccion') {
      if (!esDueno) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 403 });
      const doc = await load();
      const kv = Object.fromEntries(Object.entries(doc.kv || {}).filter(([k]) => KEEP.test(k)));
      await c.updateOne(
        { _id: ID },
        { $set: { cols: {}, kv, prod: body.accion === 'produccion' ? true : doc.prod }, $inc: { epoch: 1, rev: 1 } },
      );
      return NextResponse.json(delta(await load(), 0));
    }

    const since = Number(body.since || 0);
    const epoch = Number(body.epoch || 0);
    for (let intento = 0; intento < 4; intento++) {
      const doc = await load();
      if (epoch !== doc.epoch) return NextResponse.json({ ...delta(doc, 0), reset: true });
      const rev = doc.rev + 1;
      const set: Record<string, unknown> = {};
      let n = 0;

      for (const name of COLS) {
        const rows = Array.isArray(body.cols?.[name]) ? body.cols[name] : [];
        for (const row of rows) {
          if (++n > MAX_ENTRIES) break;
          if (!safeKey(String(row?.k)) || typeof row.u !== 'number') continue;
          const k = String(row.k);
          const cur = doc.cols?.[name]?.[k];
          if (cur && cur.u >= row.u) continue;
          set[`cols.${name}.${k}`] = { d: row.d, u: row.u, r: rev };
        }
      }
      for (const [k, e] of Object.entries<{ u: number; v: unknown }>(body.kv || {})) {
        if (++n > MAX_ENTRIES) break;
        if (!safeKey(k) || typeof e?.u !== 'number') continue;
        if (KV_DUENO.test(k) && !esDueno) continue;
        const cur = doc.kv?.[k];
        if (cur && cur.u >= e.u) continue;
        set[`kv.${k.replace(/\./g, '_')}`] = { v: e.v, u: e.u, r: rev };
      }

      if (!Object.keys(set).length) return NextResponse.json(delta(doc, since));
      set.rev = rev;
      const ok = await c.findOneAndUpdate({ _id: ID, rev: doc.rev }, { $set: set });
      if (ok) return NextResponse.json(delta(await load(), since));
    }
    return NextResponse.json({ error: 'Reintenta' }, { status: 409 });
  } catch (e) {
    console.error('[tostichelas/estado POST]', e);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}
