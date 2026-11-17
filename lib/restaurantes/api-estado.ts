/**
 * Estado compartido de un restaurante entre dispositivos (mesero, cocina, caja, dueño, clientes).
 * Fábrica: `crearEstadoApi(servidorCfg)` devuelve { GET, POST }. Cada restaurante usa su propia
 * colección, su propio secreto y sus propios PIN.
 *
 *   GET  ?since=<rev>&epoch=<n>   → cambios posteriores a <rev> (delta)
 *   POST { since, epoch, cols, kv, pin?, accion? }
 *        cols: { orders|tickets|mermas|movs|reviews: [{ k, u, d }] }   (se une por k, gana la u mayor)
 *        kv:   { clave: { u, v } }                                     (gana la u mayor)
 *        accion: "reset" | "produccion"  (requieren PIN del dueño)
 *
 * Un solo documento en `<prefijo>_estado`. Cada entrada guarda `r` (rev en que cambió)
 * para mandar solo lo nuevo. `epoch` sube con un reset: los clientes tiran su copia local.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { crearPins, ROLES_PIN, type Rol } from './pins';
import { crearAuth, puede, ipDe, type Perfil } from './auth';
import { colEstado, type ServidorConfig } from './servidor';

const ID = 'main';
const COLS = ['orders', 'tickets', 'mermas', 'movs', 'reviews', 'gastos'] as const;
const KV_DUENO = /^(menu|avail\||settings\|)/; // solo el dueño puede cambiarlas
const AJUSTES_PUBLICOS_BASE = ['pedMesa', 'pedLlevar', 'pedEntrega', 'aprobar', 'lat', 'lng', 'radio', 'cap', 'envio', 'metaPuntos', 'premioTxt'];
const MAX_ENTRIES = 400;
const MAX_BYTES = 200_000;
const KEEP = /^(menu|avail\||settings\|)/; // el reset no borra el menú ni los ajustes del dueño
const safeKey = (k: unknown) => typeof k === 'string' && /^[\w|:-]{1,80}$/.test(k);
const isCid = (c: unknown): c is string => typeof c === 'string' && /^[\w-]{8,40}$/.test(c);

type Doc = {
  _id: string;
  rev: number;
  epoch: number;
  prod: boolean;
  cols: Record<string, Record<string, { d: any; u: number; r: number }>>;
  kv: Record<string, { v: any; u: number; r: number }>;
};
type Vista = { perfil: Perfil | null; cid: string | null };

export function crearEstadoApi(cfg: ServidorConfig) {
const COLL = colEstado(cfg);
const pins = crearPins(cfg);
const auth = crearAuth(cfg);
const { pinOk, pinPorDefecto, cambiarPin, pinDebil } = pins;
const { firmarToken, perfilDeRequest, tokenMesa, bloqueado, registrarFallo, limpiarFallos } = auth;
const PUB_SETTINGS = new RegExp('^settings\\|(' + AJUSTES_PUBLICOS_BASE.concat(cfg.ajustesPublicos || []).join('|') + ')$');
const pubKv = (k: string) => k === 'menu' || k.startsWith('avail|') || k.startsWith('likes|') || k.startsWith('rate|') || PUB_SETTINGS.test(k);

async function load(): Promise<Doc> {
  const db = await getMongoDb();
  const c = db.collection<Doc>(COLL);
  const d = await c.findOne({ _id: ID });
  const forzar = process.env[`${cfg.env}_PRODUCCION`] === '1' || cfg.produccionPorDefecto;
  if (d) {
    if (forzar && !d.prod) {
      const kv: Doc['kv'] = {};
      for (const [k, e] of Object.entries(d.kv || {})) if (/^(menu|avail)/.test(k)) kv[k] = e;
      const nuevo = { prod: true, cols: {}, kv, epoch: (d.epoch || 1) + 1, rev: (d.rev || 0) + 1 };
      await c.updateOne({ _id: ID, prod: { $ne: true } }, { $set: nuevo });
      return (await c.findOne({ _id: ID })) || d;
    }
    return d;
  }
  const fresh: Doc = { _id: ID, rev: 0, epoch: 1, prod: forzar, cols: {}, kv: {} };
  await c.updateOne({ _id: ID }, { $setOnInsert: fresh }, { upsert: true });
  return (await c.findOne({ _id: ID })) || fresh;
}

/** Qué columnas puede ver cada quien. Sin sesión (cliente) solo ve sus pedidos y las reseñas. */
function colVisible(name: string, e: { d: any }, v: Vista): boolean {
  if (!v.perfil) {
    if (name === 'reviews') return true;
    return name === 'orders' && !!v.cid && e.d?.cid === v.cid;
  }
  if (name === 'gastos') return v.perfil === 'dueno';
  if (name === 'tickets' || name === 'movs') return puede(v.perfil, 'caja');
  return true;
}

/** Lo más pedido hoy (hora de México), calculado con pedidos reales de todos los clientes. */
function topHoy(doc: Doc) {
  const dia = (t: number) => new Date(t - 6 * 3600_000).toISOString().slice(0, 10);
  const hoy = dia(Date.now());
  const cuenta: Record<string, number> = {};
  for (const e of Object.values(doc.cols?.orders || {})) {
    const d = e.d;
    if (!d || d.cancel || dia(Number(d.created) || e.u) !== hoy) continue;
    if (d.hold && !d.aprobar) continue; // pago pendiente: aún no cuenta
    for (const l of d.lines || []) if (l?.pid && Number.isFinite(l.qty)) cuenta[l.pid] = (cuenta[l.pid] || 0) + l.qty;
  }
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([pid, n]) => ({ pid, n }));
}

function delta(doc: Doc, since: number, v: Vista) {
  const cols: Record<string, { k: string; u: number; d: unknown }[]> = {};
  for (const name of COLS) {
    const rows = Object.entries(doc.cols?.[name] || {})
      .filter(([, e]) => e.r > since && colVisible(name, e, v))
      .map(([k, e]) => ({ k, u: e.u, d: e.d }));
    if (rows.length) cols[name] = rows;
  }
  const kv: Record<string, { u: number; v: unknown }> = {};
  for (const [k, e] of Object.entries(doc.kv || {})) if (e.r > since && (v.perfil || pubKv(k))) kv[k] = { u: e.u, v: e.v };
  return { rev: doc.rev, epoch: doc.epoch, prod: doc.prod, cols, kv, top: topHoy(doc) };
}

const vistaDe = (req: NextRequest): Vista => {
  const c = req.nextUrl.searchParams.get('cid');
  return { perfil: perfilDeRequest(req), cid: isCid(c) ? c : null };
};

async function GET(req: NextRequest) {
  try {
    const doc = await load();
    const v = vistaDe(req);
    const qm = req.nextUrl.searchParams.get('cuenta');
    if (qm) {
      const mesa = String(req.nextUrl.searchParams.get('mesa') || '');
      const mt = String(req.nextUrl.searchParams.get('mt') || '');
      if (!/^[mp]\d{1,2}$/.test(mesa) || (doc.prod && mt !== tokenMesa(mesa))) return NextResponse.json({ cuenta: null });
      const items: { n: string; q: number; t: number; st: string }[] = [];
      let total = 0;
      for (const e of Object.values(doc.cols?.orders || {})) {
        const o = e.d;
        if (!o || o.mesa !== mesa || o.closed || o.cancel || o.hold || o.aprobar) continue;
        for (const l of Array.isArray(o.lines) ? o.lines : []) {
          const t = (Number(l.unit) || 0) * (Number(l.qty) || 0);
          total += t;
          items.push({ n: String(l.name || '').slice(0, 60), q: Number(l.qty) || 0, t, st: String(l.status || '') });
        }
      }
      return NextResponse.json({ cuenta: { mesa, total, items: items.slice(0, 60) } });
    }
    const since = Number(req.nextUrl.searchParams.get('since') || 0);
    const epoch = Number(req.nextUrl.searchParams.get('epoch') || 0);
    if (epoch !== doc.epoch) return NextResponse.json({ ...delta(doc, 0, v), reset: true });
    if (since >= doc.rev) return NextResponse.json({ rev: doc.rev, epoch: doc.epoch, prod: doc.prod, cols: {}, kv: {} });
    return NextResponse.json(delta(doc, since, v));
  } catch (e) {
    console.error(`[restaurante:${cfg.slug}/estado GET]`, e);
    return NextResponse.json({ error: 'Sin conexión con la base de datos' }, { status: 503 });
  }
}

/** Valida un pedido o ticket que llega de un cliente (sin sesión). Devuelve el dato limpio o null. */
function pedidoPublico(d: any, cid: string, doc: Doc): any | null {
  if (!d || typeof d !== 'object' || d.src !== 'cliente' || d.cid !== cid) return null;
  if (!Number.isInteger(d.id) || d.id < 100000 || d.id > 99999999) return null;
  if (!['mesa', 'llevar', 'entrega'].includes(d.canal)) return null;
  if (!Array.isArray(d.lines) || !d.lines.length || d.lines.length > 40) return null;
  let total = 0;
  for (const l of d.lines) {
    if (!l || !Number.isFinite(l.qty) || l.qty < 1 || l.qty > 20 || !Number.isFinite(l.unit) || l.unit < 0 || l.unit > 2000) return null;
    total += l.unit * l.qty;
  }
  if (total > 8000) return null;
  if (d.canal === 'mesa') {
    if (typeof d.mesa !== 'string' || !/^[mp]\d{1,2}$/.test(d.mesa)) return null;
    if (doc.prod && d.mt !== tokenMesa(d.mesa)) return null;
  }
  if (JSON.stringify(d).length > 8000) return null;
  return d;
}

async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BYTES) return NextResponse.json({ error: 'Solicitud muy grande' }, { status: 413 });
    const body = JSON.parse(raw || '{}');
    const perfil = perfilDeRequest(req);
    const esDueno = perfil === 'dueno';
    const db = await getMongoDb();
    const c = db.collection<Doc>(COLL);

    if (body.accion === 'pin') {
      const ip = ipDe(req);
      if (await bloqueado(ip)) return NextResponse.json({ error: 'Demasiados intentos. Espera 15 minutos.' }, { status: 429 });
      const rol: Rol = (ROLES_PIN as string[]).includes(body.rol) ? body.rol : 'dueno';
      const ok = await pinOk(rol, body.pin);
      if (!ok) {
        await registrarFallo(ip);
        return NextResponse.json({ ok: false });
      }
      await limpiarFallos(ip);
      return NextResponse.json({ ok: true, defecto: await pinPorDefecto(rol), token: firmarToken(rol) });
    }

    if (body.accion === 'mesatok') {
      if (!perfil) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
      const tokens: Record<string, string> = {};
      for (const k of Array.isArray(body.mesas) ? body.mesas.slice(0, 40) : []) if (/^[mp]\d{1,2}$/.test(String(k))) tokens[k] = tokenMesa(k);
      return NextResponse.json({ ok: true, tokens });
    }

    if (body.accion === 'setpin') {
      if (!esDueno) return NextResponse.json({ error: 'Solo el dueño puede cambiar las contraseñas' }, { status: 403 });
      const nuevos = (body.nuevos || {}) as Record<string, unknown>;
      for (const r of ROLES_PIN) {
        const v = nuevos[r];
        if (v === undefined || v === '') continue;
        if (typeof v !== 'string' || !/^\d{4,8}$/.test(v)) return NextResponse.json({ error: 'Cada contraseña debe ser de 4 a 8 números' }, { status: 400 });
        if (pinDebil(v)) return NextResponse.json({ error: 'Esa contraseña es muy fácil de adivinar (repetidos, secuencias o la inicial). Elige otra' }, { status: 400 });
      }
      const nv = ROLES_PIN.map((r) => nuevos[r]).filter((x) => typeof x === 'string' && x);
      if (new Set(nv).size !== nv.length) return NextResponse.json({ error: 'Cada perfil debe tener una contraseña distinta' }, { status: 400 });
      for (const r of ROLES_PIN) {
        const v = nuevos[r];
        if (typeof v === 'string' && /^\d{4,8}$/.test(v)) await cambiarPin(r, v);
      }
      const defecto = await Promise.all(ROLES_PIN.map((r) => pinPorDefecto(r)));
      return NextResponse.json({ ok: true, defecto: defecto.some(Boolean) });
    }

    if (body.accion === 'reset' || body.accion === 'produccion') {
      if (!esDueno) return NextResponse.json({ error: 'Solo el dueño puede hacer esto' }, { status: 403 });
      const doc = await load();
      const kv = Object.fromEntries(Object.entries(doc.kv || {}).filter(([k]) => KEEP.test(k)));
      await c.updateOne(
        { _id: ID },
        { $set: { cols: {}, kv, prod: body.accion === 'produccion' ? true : doc.prod }, $inc: { epoch: 1, rev: 1 } },
      );
      return NextResponse.json(delta(await load(), 0, { perfil, cid: null }));
    }

    const since = Number(body.since || 0);
    const epoch = Number(body.epoch || 0);
    const cid = isCid(body.cid) ? body.cid : null;
    const vista: Vista = { perfil, cid };
    if (!perfil && !cid) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 });

    for (let intento = 0; intento < 4; intento++) {
      const doc = await load();
      if (epoch !== doc.epoch) return NextResponse.json({ ...delta(doc, 0, vista), reset: true });
      const rev = doc.rev + 1;
      const set: Record<string, unknown> = {};
      const rech: string[] = [];
      let n = 0;

      for (const name of COLS) {
        const rows = Array.isArray(body.cols?.[name]) ? body.cols[name] : [];
        for (const row of rows) {
          if (++n > MAX_ENTRIES) break;
          if (!safeKey(String(row?.k)) || typeof row.u !== 'number') continue;
          const k = String(row.k);
          const cur = doc.cols?.[name]?.[k];
          if (cur && cur.u >= row.u) continue;
          let d = row.d;
          if (perfil) {
            const ok =
              name === 'gastos' ? esDueno : name === 'tickets' || name === 'movs' ? puede(perfil, 'caja') : true;
            if (!ok) continue;
            if (name === 'orders' && cur?.d?.dedap && d && !d.dedap) d = { ...d, dedap: true };
          } else {
            // Cliente sin sesión: solo pedidos propios, reseñas y pagos en línea nuevos
            if (name === 'orders') {
              if (cur && cur.d?.cid !== cid) { rech.push(k); continue; }
              const limpio = pedidoPublico(d, cid as string, doc);
              if (!limpio) { rech.push(k); continue; }
              d = limpio;
              // descuento de insumos del pedido liberado (una sola vez), calculado por el cliente con tope
              if (!d.hold && d.dedo && !cur?.d?.dedap) {
                for (const [ins, q] of Object.entries<number>(d.dedo)) {
                  const ek = 'inv|' + ins;
                  const e = (set[`kv.${ek}`] as any) || doc.kv?.[ek];
                  if (!/^\w{1,20}$/.test(ins) || !e || !Number.isFinite(q) || q <= 0 || q > 100) continue;
                  const v0 = e.v || {};
                  set[`kv.${ek}`] = { v: { ...v0, stock: Math.round((Number(v0.stock || 0) - q) * 100) / 100 }, u: Date.now(), r: rev };
                }
                d = { ...d, dedap: true };
              } else if (cur?.d?.dedap) d = { ...d, dedap: true };
              delete d.dedo;
            } else if (name === 'reviews') {
              if (cur || !d || !Number.isInteger(d.stars) || d.stars < 1 || d.stars > 5 || String(d.text || '').length > 300 || !/^[\w-]{1,40}$/.test(String(d.pid || ''))) continue;
            } else if (name === 'tickets') {
              if (cur || !d || d.method !== 'Link de pago' || !Number.isInteger(d.id) || d.id < 100000 || !Number.isFinite(d.total) || d.total > 8000) continue;
            } else continue;
          }
          set[`cols.${name}.${k}`] = { d, u: row.u, r: rev };
        }
      }
      for (const [k, e] of Object.entries<{ u: number; v: any }>(body.kv || {})) {
        if (++n > MAX_ENTRIES) break;
        if (!safeKey(k) || typeof e?.u !== 'number') continue;
        if (!perfil) {
          if (!(k.startsWith('likes|') || k.startsWith('rate|'))) continue;
          const val = e.v;
          if (k.startsWith('likes|') ? !(Number.isInteger(val) && val >= 0 && val < 1e6) : !(val && Number.isFinite(val.n) && Number.isFinite(val.sum) && val.n >= 0 && val.n < 1e6 && val.sum >= 0 && val.sum <= val.n * 5)) continue;
        } else if (KV_DUENO.test(k) && !esDueno) continue;
        const cur = doc.kv?.[k];
        if (cur && cur.u >= e.u) continue;
        set[`kv.${k.replace(/\./g, '_')}`] = { v: e.v, u: e.u, r: rev };
      }

      if (!Object.keys(set).length) return NextResponse.json({ ...delta(doc, since, vista), ...(rech.length ? { rech } : {}) });
      set.rev = rev;
      const ok = await c.findOneAndUpdate({ _id: ID, rev: doc.rev }, { $set: set });
      if (ok) return NextResponse.json({ ...delta(await load(), since, vista), ...(rech.length ? { rech } : {}) });
    }
    return NextResponse.json({ error: 'Reintenta' }, { status: 409 });
  } catch (e) {
    console.error(`[restaurante:${cfg.slug}/estado POST]`, e);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}

return { GET, POST };
}
