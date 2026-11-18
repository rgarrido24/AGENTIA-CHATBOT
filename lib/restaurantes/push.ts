/**
 * Avisos push del equipo (Web Push). Las llaves VAPID se generan solas la primera vez y se guardan
 * en Mongo (`<prefijo>_push`), así no hay variables de entorno que configurar.
 * Cada dispositivo se suscribe con su perfil de vista (mesero, cocina, barra, caja).
 */
import webpush from 'web-push';
import { getMongoDb } from '@/lib/mongodb';
import type { ServidorConfig } from './servidor';

export type VistaPush = 'mesero' | 'cocina' | 'barra' | 'caja';
export const VISTAS_PUSH: VistaPush[] = ['mesero', 'cocina', 'barra', 'caja'];
export type AvisoPush = { title: string; body: string; tag?: string };

type SubDoc = { _id: string; rol: VistaPush; sub: { endpoint: string; keys: { p256dh: string; auth: string } }; ua?: string; u: number };

export function crearPush(cfg: ServidorConfig) {
  const COLL = `${cfg.prefijo}_push`;
  const col = async () => (await getMongoDb()).collection<any>(COLL);
  let vapid: { publicKey: string; privateKey: string } | null = null;

  async function llaves() {
    if (vapid) return vapid;
    const c = await col();
    let d = await c.findOne({ _id: 'vapid' });
    if (!d) {
      const k = webpush.generateVAPIDKeys();
      await c.updateOne({ _id: 'vapid' }, { $setOnInsert: { publicKey: k.publicKey, privateKey: k.privateKey } }, { upsert: true });
      d = await c.findOne({ _id: 'vapid' });
    }
    vapid = { publicKey: d.publicKey, privateKey: d.privateKey };
    return vapid;
  }

  async function clavePublica() {
    return (await llaves()).publicKey;
  }

  async function suscribir(rol: VistaPush, sub: any, ua?: string) {
    if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || sub.endpoint.length > 600) return false;
    if (!sub.keys || typeof sub.keys.p256dh !== 'string' || typeof sub.keys.auth !== 'string') return false;
    const c = await col();
    const doc: Omit<SubDoc, '_id'> = { rol, sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, ua: String(ua || '').slice(0, 160), u: Date.now() };
    await c.updateOne({ _id: sub.endpoint }, { $set: doc }, { upsert: true });
    return true;
  }

  async function quitar(endpoint: string) {
    const c = await col();
    await c.deleteOne({ _id: endpoint });
  }

  async function enviarA(s: SubDoc, aviso: AvisoPush, url: string) {
    const k = await llaves();
    try {
      await webpush.sendNotification(s.sub, JSON.stringify({ ...aviso, url }), {
        vapidDetails: { subject: 'mailto:admin@agentia.software', publicKey: k.publicKey, privateKey: k.privateKey },
        TTL: 300,
        urgency: 'high',
      });
      return true;
    } catch (e: any) {
      if (e && (e.statusCode === 404 || e.statusCode === 410)) await quitar(s._id).catch(() => {});
      else console.error(`[restaurante:${cfg.slug}/push]`, e?.statusCode || e);
      return false;
    }
  }

  /** Manda el aviso a todos los dispositivos suscritos a esas vistas. No lanza errores. */
  async function avisar(roles: VistaPush[], aviso: AvisoPush, url: string) {
    try {
      if (!roles.length) return;
      const c = await col();
      const subs: SubDoc[] = await c.find({ rol: { $in: roles } }).limit(60).toArray();
      await Promise.all(subs.map((s) => enviarA(s, aviso, url)));
    } catch (e) {
      console.error(`[restaurante:${cfg.slug}/push avisar]`, e);
    }
  }

  async function prueba(endpoint: string, url: string) {
    const c = await col();
    const s: SubDoc | null = await c.findOne({ _id: endpoint });
    if (s) await enviarA(s, { title: 'Avisos activados', body: `Recibirás los avisos de ${s.rol}.`, tag: 'prueba' }, url);
  }

  return { clavePublica, suscribir, quitar, avisar, prueba };
}

/* ---------- qué avisos genera un cambio en un pedido ---------- */
const liberado = (o: any) => !!o && !o.hold && !o.aprobar && !o.cancel;
const dondeEs = (o: any) => {
  const m = /^m(\d{1,2})$/.exec(String(o?.mesa || ''));
  if (o?.canal === 'mesa' && m) return `Mesa ${Number(m[1])}`;
  if (o?.canal === 'mesa') return 'Mesa';
  return o?.canal === 'llevar' ? 'Para llevar' : 'Entrega a domicilio';
};

export function avisosDePedido(antes: any, ahora: any): { roles: VistaPush[]; aviso: AvisoPush }[] {
  const out: { roles: VistaPush[]; aviso: AvisoPush }[] = [];
  if (!ahora || ahora.cancel || !Array.isArray(ahora.lines)) return out;
  const donde = dondeEs(ahora);
  // 1) Pedido de un cliente que el mesero debe confirmar
  if (ahora.aprobar && !ahora.hold && !(antes && antes.aprobar)) {
    out.push({ roles: ['mesero'], aviso: { title: 'Pedido por confirmar', body: `${donde} · #${ahora.id}`, tag: `ord-${ahora.id}` } });
  }
  // 2) Comanda nueva en cocina / barra
  if (liberado(ahora) && !liberado(antes)) {
    for (const st of ['cocina', 'barra'] as const) {
      const ls = ahora.lines.filter((l: any) => (l.station || 'cocina') === st);
      if (!ls.length) continue;
      const piezas = ls.reduce((a: number, l: any) => a + (Number(l.qty) || 0), 0);
      out.push({ roles: [st], aviso: { title: st === 'cocina' ? 'Nueva comanda' : 'Nuevo pedido en barra', body: `${donde} · ${piezas} ${piezas === 1 ? 'pieza' : 'piezas'}`, tag: `ord-${ahora.id}-${st}` } });
    }
  }
  // 3) Algo quedó listo para llevar
  const antesLinea = new Map<string, string>((antes?.lines || []).map((l: any) => [String(l.uid), String(l.status)]));
  const listos = ahora.lines.filter((l: any) => l.status === 'listo' && antesLinea.get(String(l.uid)) !== 'listo');
  if (listos.length) {
    const nombres = listos.slice(0, 2).map((l: any) => `${l.qty}× ${String(l.name || '').slice(0, 30)}`).join(', ');
    out.push({ roles: ['mesero'], aviso: { title: 'Listo para llevar', body: `${donde} · ${nombres}${listos.length > 2 ? '…' : ''}`, tag: `listo-${ahora.id}` } });
  }
  return out;
}
