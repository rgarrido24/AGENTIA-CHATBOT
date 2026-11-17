/**
 * Lealtad de la demo de Tostichelas. Usa el motor real de lealtad (mismas funciones
 * que /api/loyalty/[tenant]/*) pero SOLO para el tenant fijo "tostichelas".
 *
 *   GET  ?telefono=10dígitos          → cliente y saldo
 *   GET  ?lista=1                     → clientes de la demo
 *   POST { accion: "alta" | "venta" | "canje", ... }
 */
import { NextRequest, NextResponse } from 'next/server';
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
import { tenantObjectId, tenantRecompensa, type TenantConfig } from '@/lib/wallet-tenant';
import { ensureTostichelasTenant, TOSTICHELAS_KEY } from '@/lib/tostichelas-tenant';

export const dynamic = 'force-dynamic';

const MONTO_MAX = 50_000;

function info(cfg: TenantConfig) {
  const rec = tenantRecompensa(cfg);
  return { nombre: cfg.nombre, modelo: rec.modelo, parametro: rec.parametro };
}

async function syncWallet(cfg: TenantConfig, clienteId: string, puntos: number) {
  try {
    await syncWalletPuntosByObjectId(tenantObjectId(cfg, clienteId), puntos, cfg);
  } catch (e) {
    // El cliente aún puede no tener el pase guardado: no es un error de la venta.
    console.warn('[demo/tostichelas] wallet sync', e instanceof Error ? e.message : e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const cfg = await ensureTostichelasTenant();
    if (!cfg) return NextResponse.json({ error: 'Lealtad no disponible' }, { status: 503 });

    if (req.nextUrl.searchParams.get('lista')) {
      const clientes = await listClientes(TOSTICHELAS_KEY);
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
    const cliente = await findClienteByTelefono(TOSTICHELAS_KEY, telefono);
    return NextResponse.json({ ...info(cfg), found: Boolean(cliente), telefono, cliente });
  } catch (e) {
    console.error('[api/demo/tostichelas/lealtad GET]', e);
    return NextResponse.json({ error: 'No se pudo consultar la lealtad' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cfg = await ensureTostichelasTenant();
    if (!cfg) return NextResponse.json({ error: 'Lealtad no disponible' }, { status: 503 });

    const body = (await req.json()) as {
      accion?: string;
      telefono?: string;
      monto?: number;
      puntos?: number;
      nombre?: string;
      fechaNacimiento?: string;
    };
    const telefono = String(body.telefono ?? '');

    if (body.accion === 'alta') {
      const r = await altaCliente(TOSTICHELAS_KEY, {
        telefono,
        nombreCompleto: String(body.nombre ?? ''),
        fechaNacimiento: String(body.fechaNacimiento ?? ''),
      });
      return NextResponse.json({ ...info(cfg), ...r });
    }

    if (body.accion === 'venta') {
      const monto = Number(body.monto);
      if (!Number.isFinite(monto) || monto <= 0 || monto > MONTO_MAX) {
        return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
      }
      const r = await registrarVenta(TOSTICHELAS_KEY, {
        telefono,
        monto,
        nombre: body.nombre,
        fechaNacimiento: body.fechaNacimiento,
      });
      await syncWallet(cfg, r.cliente.id, r.cliente.puntos);
      return NextResponse.json({ ...info(cfg), ok: true, ...r });
    }

    if (body.accion === 'canje') {
      const puntos = Number(body.puntos);
      if (!Number.isFinite(puntos) || puntos <= 0 || puntos > MONTO_MAX) {
        return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 });
      }
      const r = await canjearPuntos(TOSTICHELAS_KEY, telefono, puntos);
      await syncWallet(cfg, r.cliente.id, r.cliente.puntos);
      return NextResponse.json({ ...info(cfg), ok: true, ...r });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error de lealtad';
    const status =
      /inválid|requerid|Nombre|Fecha|insuficiente|no encontrado|Cantidad|Teléfono/.test(msg) ? 400 : 500;
    if (status === 500) console.error('[api/demo/tostichelas/lealtad POST]', e);
    return NextResponse.json({ error: msg }, { status });
  }
}
