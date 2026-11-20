/**
 * Lealtad de un restaurante. Usa el motor real de lealtad (mismas funciones que
 * /api/loyalty/[tenant]/*) pero SOLO para el tenant fijo del restaurante (cfg.tenant.key).
 * Fábrica: `crearLealtadApi(servidorCfg)` devuelve { GET, POST }.
 *
 *   GET  ?telefono=10dígitos          → cliente y saldo
 *   GET  ?lista=1                     → clientes de la demo
 *   POST { accion: "alta" | "venta" | "canje", ... }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import {
  altaCliente,
  canjearPuntos,
  diasInactividad,
  findClienteByTelefono,
  listClientes,
  normalizeSabucanTelefono,
  registrarVenta,
} from '@/lib/sabucan-clientes';
import { syncWalletPuntosByObjectId } from '@/lib/wallet-sabucan';
import { tenantObjectId, tenantRecompensa, tenantRewardMeta, type TenantConfig } from '@/lib/wallet-tenant';
import { actualizarCashback, ensureTenant } from './tenant';
import { crearAuth, puede } from './auth';
import { setSessionCookie } from '@/lib/loyalty-session';
import type { ServidorConfig } from './servidor';

const MONTO_MAX = 50_000;


function info(cfg: TenantConfig) {
  const rec = tenantRecompensa(cfg);
  return { nombre: cfg.nombre, modelo: rec.modelo, parametro: rec.parametro, tarro: !!cfg.tarroHero && rec.modelo === 'sellos', premio: cfg.premio, meta: tenantRewardMeta(cfg) };
}

export function crearLealtadApi(cfgS: ServidorConfig) {
const KEY = cfgS.tenant.key;
/** Puntos dobles por reseña en Google: una sola vez por teléfono (el _id único lo garantiza). */
const colGoogle = async () => (await getMongoDb()).collection<{ _id: string; ts: number }>(`${cfgS.prefijo}_google`);
const { perfilDeRequest } = crearAuth(cfgS);

async function syncWallet(cfg: TenantConfig, clienteId: string, puntos: number) {
  try {
    await syncWalletPuntosByObjectId(tenantObjectId(cfg, clienteId), puntos, cfg);
  } catch (e) {
    // El cliente aún puede no tener el pase guardado: no es un error de la venta.
    console.warn(`[restaurante:${KEY}] wallet sync`, e instanceof Error ? e.message : e);
  }
}

async function GET(req: NextRequest) {
  try {
    const cfg = await ensureTenant(cfgS);
    if (!cfg) return NextResponse.json({ error: 'Lealtad no disponible' }, { status: 503 });

    if (req.nextUrl.searchParams.get('lista')) {
      if (!puede(perfilDeRequest(req), 'caja')) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
      const clientes = await listClientes(KEY);
      return NextResponse.json({
        ...info(cfg),
        clientes: clientes.map((c) => ({
          nombre: c.nombre,
          telefono: c.telefono,
          puntos: c.puntos,
          visitas: (c.historial ?? []).filter((h) => h.tipo === 'compra').length,
          diasSinVenir: diasInactividad(c.ultimaVisita),
        })),
      });
    }

    const telefono = normalizeSabucanTelefono(req.nextUrl.searchParams.get('telefono') ?? '');
    if (telefono.length < 10) {
      return NextResponse.json({ error: 'Teléfono inválido (10 dígitos)' }, { status: 400 });
    }
    const cliente = await findClienteByTelefono(KEY, telefono);
    let googleUsado = false;
    try {
      googleUsado = Boolean(await (await colGoogle()).findOne({ _id: telefono }));
    } catch {}
    return NextResponse.json({ ...info(cfg), found: Boolean(cliente), telefono, cliente, googleUsado });
  } catch (e) {
    console.error(`[restaurante:${KEY}/lealtad GET]`, e);
    return NextResponse.json({ error: 'No se pudo consultar la lealtad' }, { status: 500 });
  }
}

async function POST(req: NextRequest) {
  try {
    const cfg = await ensureTenant(cfgS);
    if (!cfg) return NextResponse.json({ error: 'Lealtad no disponible' }, { status: 503 });

    const body = (await req.json()) as {
      accion?: string;
      telefono?: string;
      monto?: number;
      puntos?: number;
      nombre?: string;
      fechaNacimiento?: string;
      pin?: string;
      parametro?: number;
    };
    const telefono = String(body.telefono ?? '');

    // Entrada directa al panel completo de lealtad (/n/<slug>/...) sin pedir otra contraseña:
    // solo con sesión de caja o dueño del sistema.
    if (body.accion === 'sesion') {
      if (!puede(perfilDeRequest(req), 'caja')) return NextResponse.json({ error: 'Inicia sesión' }, { status: 401 });
      await setSessionCookie(cfg.id);
      return NextResponse.json({ ok: true, base: cfg.basePath });
    }

    if (body.accion === 'config') {
      if (perfilDeRequest(req) !== 'dueno') return NextResponse.json({ error: 'Solo el dueño' }, { status: 403 });
      if (cfg.tarroHero) return NextResponse.json({ error: 'Esta tarjeta funciona por visitas, no por porcentaje' }, { status: 400 });
      const pct = Number(body.parametro);
      if (!Number.isFinite(pct) || pct <= 0) return NextResponse.json({ error: 'Porcentaje inválido' }, { status: 400 });
      const nuevo = await actualizarCashback(cfgS, pct);
      return NextResponse.json(nuevo ? { ...info(nuevo), ok: true } : { error: 'No se pudo guardar' });
    }

    if (body.accion === 'alta') {
      const r = await altaCliente(KEY, {
        telefono,
        nombreCompleto: String(body.nombre ?? ''),
        fechaNacimiento: String(body.fechaNacimiento ?? ''),
      });
      return NextResponse.json({ ...info(cfg), ...r });
    }

    if ((body.accion === 'venta' || body.accion === 'canje') && !puede(perfilDeRequest(req), 'caja')) {
      return NextResponse.json({ error: 'Inicia sesión en Caja' }, { status: 401 });
    }

    if (body.accion === 'venta') {
      const monto = Number(body.monto);
      if (!Number.isFinite(monto) || monto <= 0 || monto > MONTO_MAX) {
        return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
      }
      // Tarjeta por visitas: una visita por día y el tarro lleno espera a que se entregue la recompensa.
      if (tenantRecompensa(cfg).modelo === 'sellos') {
        const tel = normalizeSabucanTelefono(telefono);
        const ex = tel.length >= 10 ? await findClienteByTelefono(KEY, tel) : null;
        if (ex) {
          const dia = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Merida' }) : '');
          const meta = tenantRewardMeta(cfg);
          const lleno = ex.puntos >= meta;
          const yaHoy = dia(ex.ultimaVisita) === dia(new Date().toISOString());
          if (lleno || yaHoy) {
            return NextResponse.json({ ...info(cfg), ok: true, cliente: ex, puntosGanados: 0, esNuevo: false, yaHoy: !lleno && yaHoy, lleno });
          }
        }
      }
      // Puntos dobles por calificar en Google: caja confirma que vio la reseña; solo una vez por cliente.
      const dobles = (body as any).googleDobles === true;
      if (dobles) {
        if (monto * 2 > MONTO_MAX) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        try {
          await (await colGoogle()).insertOne({ _id: telefono, ts: Date.now() });
        } catch {
          return NextResponse.json({ error: 'Este cliente ya usó sus puntos dobles por Google' }, { status: 409 });
        }
      }
      let r;
      try {
        r = await registrarVenta(KEY, {
        telefono,
        monto: dobles ? monto * 2 : monto,
        nombre: body.nombre,
        fechaNacimiento: body.fechaNacimiento,
        });
      } catch (e) {
        if (dobles) await (await colGoogle()).deleteOne({ _id: telefono }).catch(() => {});
        throw e;
      }
      await syncWallet(cfg, r.cliente.id, r.cliente.puntos);
      return NextResponse.json({ ...info(cfg), ok: true, ...r });
    }

    if (body.accion === 'canje') {
      const puntos = Number(body.puntos);
      if (!Number.isFinite(puntos) || puntos <= 0 || puntos > MONTO_MAX) {
        return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
      }
      const r = await canjearPuntos(KEY, telefono, puntos);
      await syncWallet(cfg, r.cliente.id, r.cliente.puntos);
      return NextResponse.json({ ...info(cfg), ok: true, ...r });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de lealtad';
    const status =
      /inválid|requerid|Nombre|Fecha|insuficiente|no encontrado|Cantidad|Teléfono/.test(msg) ? 400 : 500;
    if (status === 500) console.error(`[restaurante:${KEY}/lealtad POST]`, e);
    return NextResponse.json({ error: msg }, { status });
  }
}

return { GET, POST };
}
