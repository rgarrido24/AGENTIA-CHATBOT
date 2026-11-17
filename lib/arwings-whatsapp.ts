/**
 * Chatbot de WhatsApp de ARWINGS (pedidos a domicilio / para llevar, entrega propia).
 *
 * - Habla con Gemini usando el menú REAL (precios, salsas y disponibilidad salen del sistema del restaurante).
 * - Recuerda al cliente: pedidos anteriores, salsa favorita, qué suele pedir y cuánto lleva sin pedir.
 * - Cuando el cliente confirma, crea el pedido en el MISMO sistema que la app (`rest_arwings_estado`):
 *   entra "por confirmar" (hold + aprobar), el equipo lo acepta, se prepara y se cobra al entregar en Caja
 *   (ahí se suma el saldo de lealtad). El precio lo calcula el servidor, nunca el modelo.
 */
import { getMongoDb } from '@/lib/mongodb';
import { ARWINGS } from '@/lib/restaurantes/arwings';
import { SERVIDOR, colEstado } from '@/lib/restaurantes/servidor';
import { generateGeminiReply } from '@/src/lib/gemini';
import type { Producto, Salsa } from '@/lib/restaurantes/tipos';

const ID = 'main';
const SESION_MS = 6 * 3600_000;
const MAX_MSGS = 14;

type Doc = {
  _id: string;
  rev: number;
  epoch: number;
  prod: boolean;
  cols: Record<string, Record<string, { d: any; u: number; r: number }>>;
  kv: Record<string, { v: any; u: number; r: number }>;
};

const SESIONES = 'arwings_wa_sessions';

export const telDe = (senderId: string) => String(senderId || '').replace(/\D/g, '').slice(-10);

async function cargarDoc(): Promise<Doc> {
  const db = await getMongoDb();
  const c = db.collection<Doc>(colEstado(SERVIDOR.arwings));
  let d = await c.findOne({ _id: ID });
  if (!d) {
    await c.updateOne({ _id: ID }, { $setOnInsert: { _id: ID, rev: 0, epoch: 1, prod: true, cols: {}, kv: {} } as Doc }, { upsert: true });
    d = (await c.findOne({ _id: ID })) as Doc;
  }
  return d;
}

const m = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');

function ajustes(doc: Doc) {
  const kv = (k: string, def: any) => (doc.kv?.[`settings|${k}`] ? doc.kv[`settings|${k}`].v : def);
  return {
    entrega: !!kv('pedEntrega', ARWINGS.ajustes?.pedEntrega),
    llevar: !!kv('pedLlevar', ARWINGS.ajustes?.pedLlevar),
    envio: Number(kv('envio', ARWINGS.ajustes?.envio ?? 0)) || 0,
    dos: !!kv('dosSabores', false),
  };
}

function menuVivo(doc: Doc): { prods: (Producto & { agotado: boolean })[]; salsas: (Salsa & { avail?: boolean })[] } {
  const cfg = doc.kv?.menu?.v || {};
  const edits = cfg.edits || {};
  const prods = ARWINGS.menu.map((p) => {
    const e = edits[p.id] || {};
    const v = p.v.map((x, i) => ({ ...x, p: e.price && Number(e.price[i]) > 0 ? Number(e.price[i]) : x.p }));
    const av = doc.kv?.[`avail|${p.id}`];
    return { ...p, name: e.name || p.name, v, agotado: av ? !av.v : false };
  });
  const custom = (cfg.custom || []).map((c: any) => ({ ...c, agotado: doc.kv?.[`avail|${c.id}`] ? !doc.kv[`avail|${c.id}`].v : false }));
  const ov = cfg.salsas || {};
  const salsas = (ARWINGS.salsas || []).map((s) => ({ ...s, ...(ov[s.id] || {}) })).filter((s) => s.avail !== false);
  return { prods: [...prods, ...custom], salsas };
}

/** Lo que sabemos del cliente por sus pedidos anteriores. */
export function contextoCliente(doc: Doc, tel: string) {
  const mios = Object.values(doc.cols?.orders || {})
    .map((e) => e.d)
    .filter((o) => o && !o.cancel && String(o.cliente?.tel || '') === tel)
    .sort((a, b) => (b.created || 0) - (a.created || 0));
  if (!mios.length) return null;
  const salsa: Record<string, number> = {};
  const prod: Record<string, number> = {};
  for (const o of mios) {
    for (const l of o.lines || []) {
      prod[`${l.name} ${l.v}`] = (prod[`${l.name} ${l.v}`] || 0) + (l.qty || 1);
      for (const md of l.mods || []) if (md.g === 'Salsa') salsa[md.l.replace(/^Salsa /, '')] = (salsa[md.l.replace(/^Salsa /, '')] || 0) + (l.qty || 1);
    }
  }
  const top = (r: Record<string, number>, n: number) => Object.entries(r).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);
  const ultimo = mios[0];
  return {
    nombre: ultimo.cliente?.name || '',
    direccion: mios.find((o) => o.addr)?.addr || '',
    pedidos: mios.length,
    diasSinPedir: Math.floor((Date.now() - (ultimo.created || Date.now())) / 86400000),
    salsasFavoritas: top(salsa, 2),
    suelePedir: top(prod, 3),
    ultimo: (ultimo.lines || []).map((l: any) => `${l.qty} × ${l.name} ${l.v}${(l.mods || []).length ? ' (' + l.mods.map((x: any) => x.l).join(', ') + ')' : ''}`).join('; '),
  };
}

function sistema(doc: Doc, ctx: ReturnType<typeof contextoCliente>, nombreWa?: string) {
  const a = ajustes(doc);
  const { prods, salsas } = menuVivo(doc);
  const lista = prods
    .map((p) => `- ${p.id} | ${p.name} | ${p.v.map((x) => `${x.l}: ${m(x.p)}`).join(' / ')}${(p as any).salsas ? ' | LLEVA SALSA' : ''}${p.agotado ? ' | AGOTADO HOY' : ''}`)
    .join('\n');
  const sal = salsas.map((s) => `${s.id} = ${s.nombre} (picor ${s.picor}/5${s.extra ? `, +${m(s.extra)}` : ''})`).join('; ');
  const cli = ctx
    ? `CLIENTE RECURRENTE: ${ctx.nombre || nombreWa || 'sin nombre'}. ${ctx.pedidos} pedido(s). Último hace ${ctx.diasSinPedir} día(s): ${ctx.ultimo}. Salsa(s) favorita(s): ${ctx.salsasFavoritas.join(', ') || 'aún no se sabe'}. Suele pedir: ${ctx.suelePedir.join(', ')}. Dirección usada: ${ctx.direccion || 'no registrada'}. Salúdalo por su nombre y ofrécele "lo de siempre" (su último pedido) con un mensaje corto.${ctx.diasSinPedir >= 21 ? ' Lleva tiempo sin pedir: dile con cariño que ya lo extrañaban, sin presionar ni inventar promociones.' : ''}`
    : `CLIENTE NUEVO${nombreWa ? ` (nombre en WhatsApp: ${nombreWa})` : ''}. Dale la bienvenida y pregúntale qué se le antoja.`;
  return `Eres el asistente de WhatsApp de ARWINGS ("El sabor tiene alas"), restaurante de alitas, boneless, hamburguesas, snacks y bebidas. Atiendes pedidos a domicilio y para llevar. Habla en español de México, cálido, breve (mensajes cortos de WhatsApp), con algo de picardía; máximo 1 emoji por mensaje.

REGLAS:
- Usa SOLO este menú y estos precios. Nunca inventes productos, promociones, tiempos de entrega ni horarios. Si no sabes algo (horarios, zonas de entrega, tiempo), di que lo confirma el equipo al aceptar el pedido.
- Alitas y boneless llevan UNA salsa obligatoria${a.dos ? ' (en 10 pz puede elegir una segunda salsa)' : ' (solo una salsa por pedido; no se mezclan sabores)'}. Si no sabe cuál, recomiéndale según qué tanto aguanta el picante (picor de 1 a 5) y su historial.
- Sugiere UNA cosa extra a la vez, natural (papas con alitas, bebida con boneless). No insistas si dice que no.
- Servicio a domicilio: ${a.entrega ? 'sí' + (a.envio ? ` (envío ${m(a.envio)})` : ' (el costo de envío lo confirma el equipo)') : 'NO disponible ahora'}. Para llevar: ${a.llevar ? 'sí' : 'NO disponible ahora'}. Se paga al recibir (efectivo o terminal). No pidas datos de tarjeta ni transferencias.
- Para cerrar necesitas: productos con cantidad (y salsa donde aplique), si es domicilio o para llevar, nombre y, si es domicilio, dirección con referencias. Antes de confirmar, resume el pedido con total y pregunta "¿lo confirmo?".
- Solo cuando el cliente confirme de forma clara (sí, va, confírmalo…), agrega AL FINAL de tu mensaje una línea exacta: ###PEDIDO{"items":[{"pid":"ali","v":"10 pz","salsa":"hab","salsa2":null,"qty":1,"nota":""}],"canal":"entrega","nombre":"...","direccion":"..."}###
  (pid y salsa son los ids de abajo; v es la presentación exacta; canal es "entrega" o "llevar"). El sistema calcula el total; tú solo describe el pedido. No pongas esa línea antes de la confirmación.
- Si piden algo fuera del menú, dilo con amabilidad y ofrece lo más parecido. Si es queja o algo delicado, dile que un humano del equipo le escribe pronto.

MENÚ (id | nombre | presentaciones y precio):
${lista}

SALSAS: ${sal}

${cli}`;
}

type Item = { pid?: string; v?: string; salsa?: string | null; salsa2?: string | null; qty?: number; nota?: string };

/** Valida lo que dijo el modelo contra el menú real y arma las líneas con precio del servidor. */
export function armarLineas(doc: Doc, items: Item[]): { lines: any[]; error?: string } {
  const { prods, salsas } = menuVivo(doc);
  const a = ajustes(doc);
  const lines: any[] = [];
  if (!Array.isArray(items) || !items.length || items.length > 15) return { lines, error: 'pedido vacío' };
  for (const it of items) {
    const p = prods.find((x) => x.id === it.pid);
    if (!p) return { lines, error: 'producto desconocido' };
    if (p.agotado) return { lines, error: `${p.name} está agotado` };
    const vi = Math.max(0, p.v.findIndex((x) => x.l.toLowerCase() === String(it.v || '').toLowerCase()));
    const v = p.v[vi];
    const qty = Math.min(20, Math.max(1, Math.floor(Number(it.qty) || 1)));
    const mods: { g: string; l: string; p: number }[] = [];
    if ((p as any).salsas) {
      const s1 = salsas.find((s) => s.id === it.salsa);
      if (!s1) return { lines, error: `falta la salsa de ${p.name}` };
      mods.push({ g: 'Salsa', l: 'Salsa ' + s1.nombre, p: Number(s1.extra) || 0 });
      if (a.dos && v.f >= 2 && it.salsa2) {
        const s2 = salsas.find((s) => s.id === it.salsa2 && s.id !== s1.id);
        if (s2) mods.push({ g: 'Salsa', l: 'Salsa ' + s2.nombre, p: Number(s2.extra) || 0 });
      }
    }
    const unit = v.p + mods.reduce((t, x) => t + x.p, 0);
    lines.push({
      uid: 'w' + Math.random().toString(36).slice(2, 9),
      pid: p.id,
      name: p.name,
      v: v.l,
      s: v.s,
      f: v.f,
      mods,
      unit,
      qty,
      note: String(it.nota || '').slice(0, 120),
      station: p.station,
      status: 'nuevo',
    });
  }
  return { lines };
}

async function crearPedido(tel: string, p: { items: Item[]; canal?: string; nombre?: string; direccion?: string }) {
  const doc0 = await cargarDoc();
  const a = ajustes(doc0);
  const canal = p.canal === 'llevar' ? 'llevar' : 'entrega';
  if (canal === 'entrega' && !a.entrega) return { error: 'Por ahora no tomamos pedidos a domicilio por aquí.' };
  if (canal === 'llevar' && !a.llevar) return { error: 'Por ahora no tomamos pedidos para llevar por aquí.' };
  const nombre = String(p.nombre || '').trim().slice(0, 60);
  const direccion = String(p.direccion || '').trim().slice(0, 200);
  if (!nombre) return { error: 'Me falta tu nombre.' };
  if (canal === 'entrega' && direccion.length < 8) return { error: 'Me falta tu dirección con referencias.' };
  const db = await getMongoDb();
  const c = db.collection<Doc>(colEstado(SERVIDOR.arwings));
  for (let intento = 0; intento < 4; intento++) {
    const doc = intento === 0 ? doc0 : await cargarDoc();
    const { lines, error } = armarLineas(doc, p.items);
    if (error) return { error: 'No pude armar el pedido: ' + error + '.' };
    let id = 100000 + Math.floor(Math.random() * 89_000_000);
    while (doc.cols?.orders?.[String(id)]) id++;
    const envio = canal === 'entrega' ? ajustes(doc).envio : 0;
    const orden = {
      id,
      mesa: null,
      canal,
      lines,
      cliente: { name: nombre, tel },
      hold: true,
      aprobar: true,
      porConfirmar: false,
      src: 'whatsapp',
      addr: canal === 'entrega' ? direccion : '',
      envio,
      created: Date.now(),
      closed: false,
      cancel: false,
      stage: 'cocina',
      done: false,
    };
    const rev = (doc.rev || 0) + 1;
    const ok = await c.findOneAndUpdate({ _id: ID, rev: doc.rev }, { $set: { [`cols.orders.${id}`]: { d: orden, u: Date.now(), r: rev }, rev } });
    if (ok) return { orden, total: lines.reduce((t, l) => t + l.unit * l.qty, 0) + envio };
  }
  return { error: 'No pude guardar el pedido, intenta de nuevo en un momento.' };
}

async function sesion(tel: string) {
  const db = await getMongoDb();
  const s = await db.collection(SESIONES).findOne({ _id: tel as any });
  if (s && Date.now() - new Date(s.updatedAt).getTime() < SESION_MS) return (s.msgs || []) as { role: 'user' | 'assistant'; content: string }[];
  return [];
}
async function guardar(tel: string, msgs: { role: 'user' | 'assistant'; content: string }[]) {
  const db = await getMongoDb();
  await db.collection(SESIONES).updateOne({ _id: tel as any }, { $set: { msgs: msgs.slice(-MAX_MSGS), updatedAt: new Date() } }, { upsert: true });
}

const RE_PEDIDO = /###PEDIDO(\{[\s\S]*?\})###/;

export async function handleArwingsMessage(params: { message: string; senderId: string; senderName?: string }): Promise<{ handled: boolean; reply?: string }> {
  const tel = telDe(params.senderId);
  if (tel.length !== 10) return { handled: false };
  const doc = await cargarDoc();
  const ctx = contextoCliente(doc, tel);
  const hist = await sesion(tel);
  let raw = '';
  try {
    raw = await generateGeminiReply({
      userMessage: params.message,
      systemInstruction: sistema(doc, ctx, params.senderName),
      messages: hist,
    });
  } catch (e) {
    console.error('[arwings-whatsapp] gemini:', e instanceof Error ? e.message : e);
    return { handled: true, reply: 'Se me cruzaron los cables un momento. Escríbeme de nuevo en un minuto o llámanos al 55 6115 9340.' };
  }
  let reply = raw.replace(RE_PEDIDO, '').trim();
  const mt = raw.match(RE_PEDIDO);
  if (mt) {
    let datos: any = null;
    try {
      datos = JSON.parse(mt[1]);
    } catch {
      datos = null;
    }
    if (!datos) {
      reply = 'Casi lo tengo, ¿me confirmas otra vez tu pedido?';
    } else {
      const r = await crearPedido(tel, datos);
      if ('error' in r && r.error) {
        reply = r.error + ' ¿Me ayudas con ese dato?';
      } else if ('orden' in r && r.orden) {
        const o = r.orden;
        reply =
          `¡Listo, ${o.cliente.name}! Recibí tu pedido #${o.id}:\n` +
          o.lines.map((l: any) => `• ${l.qty} × ${l.name} ${l.v}${l.mods.length ? ' (' + l.mods.map((x: any) => x.l).join(', ') + ')' : ''} — ${m(l.unit * l.qty)}`).join('\n') +
          (o.envio ? `\nEnvío: ${m(o.envio)}` : '') +
          `\nTotal a pagar al recibir: ${m(r.total!)}` +
          `\nEl equipo lo confirma contigo en un momento.`;
      }
    }
  }
  await guardar(tel, [...hist, { role: 'user', content: params.message }, { role: 'assistant', content: reply }]).catch(() => {});
  return { handled: true, reply };
}
