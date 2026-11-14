/** Renovación (pago confirmado) y barrido diario de vencimientos. Solo servidor. */
import { getMongoDb } from '@/lib/mongodb';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';
import { invalidateLoyaltyTenantCache } from '@/lib/loyalty-tenants';
import { notifyOwner } from '@/lib/loyalty-security';
import { calcularTotal, type Periodo } from '@/lib/lealtad-pricing';
import { diasRestantes, extenderVigencia, GRACIA_DIAS_PAGO, vigenciaVencida } from '@/lib/lealtad-suscripcion';
import { publicBase, SOLICITUDES } from '@/lib/lealtad-provision';

function wa(raw: unknown): string {
  const d = String(raw ?? '').replace(/\D/g, '');
  return d.length === 10 ? `52${d}` : d;
}

async function avisarCliente(doc: Record<string, any>, texto: string): Promise<boolean> {
  try {
    if (!doc.whatsapp) return false;
    await bridgeSendMessage(process.env.AGENTIA_ALERTS_SENDER_CLIENT_ID || 'agentia-ventas', wa(doc.whatsapp), texto);
    return true;
  } catch (e) {
    console.error('[lealtad-renovaciones] WhatsApp al cliente falló', e);
    return false;
  }
}

const fmtFecha = (d: Date | string) =>
  new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });

/** Aplica una renovación ya pagada (solicitud tipo 'renovacion' en estado 'pagado'). Idempotente. */
export async function aplicarRenovacion(ref: string): Promise<{ ok: boolean; error?: string }> {
  const db = await getMongoDb();
  const col = db.collection(SOLICITUDES);
  const sol = (await col.findOneAndUpdate(
    { ref, tipo: 'renovacion', estado: 'pagado' },
    { $set: { estado: 'aplicando' } },
    { returnDocument: 'after' },
  )) as Record<string, any> | null;
  if (!sol) return { ok: false, error: 'Solicitud no está pagada o ya se aplicó' };

  try {
    const tenants = db.collection('loyalty_tenants');
    const t = (await tenants.findOne({ key: sol.tenantKey })) as Record<string, any> | null;
    if (!t) throw new Error('Negocio no encontrado');
    const periodo: Periodo = sol.periodo === 'anual' ? 'anual' : 'mensual';
    const nueva = extenderVigencia(t.vigenteHasta, periodo);
    await tenants.updateOne(
      { key: sol.tenantKey },
      {
        $set: {
          panelActivo: true,
          plan: 'base',
          estadoSuscripcion: 'activa',
          vigenteHasta: nueva,
          periodo,
          sucursales: sol.sucursales,
          ultimoPagoAt: new Date(),
        },
        $unset: { avisos: '' },
      },
    );
    invalidateLoyaltyTenantCache(String(sol.tenantKey));
    await col.updateOne({ ref }, { $set: { estado: 'activada', activadaAt: new Date() } });

    await avisarCliente(
      t,
      `✅ ¡Pago recibido, ${t.nombre}! Tu tarjeta de lealtad sigue activa hasta el ${fmtFecha(nueva)}.\n` +
        `Panel: ${publicBase()}/n/${t.key}/login\nGracias por confiar en Agentia 🙌`,
    );
    await notifyOwner(`💰 Pago de ${t.nombre}: $${sol.total} (${periodo}). Vigente hasta ${fmtFecha(nueva)}.`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await col.updateOne({ ref }, { $set: { estado: 'pagado', errorAplicar: msg.slice(0, 200) } });
    await notifyOwner(`❌ No se pudo aplicar el pago de la solicitud ${ref}: ${msg.slice(0, 160)}`);
    return { ok: false, error: msg };
  }
}

function precioTexto(t: Record<string, any>): string {
  const p = calcularTotal('mensual', Number(t.sucursales) || 1, 'SPEI');
  return `$${p.total} al mes (IVA incluido, por SPEI u OXXO)`;
}

/** Barrido diario: avisos previos, suspensión al vencer y avisos al cliente. Seguro de correr varias veces. */
export async function procesarVencimientos(): Promise<Record<string, number>> {
  const db = await getMongoDb();
  const tenants = db.collection('loyalty_tenants');
  const lista = (await tenants
    .find({ origen: 'self-serve', vigenteHasta: { $exists: true } })
    .toArray()) as Array<Record<string, any>>;
  const res = { revisados: lista.length, avisosPrevios: 0, avisosGracia: 0, suspendidos: 0 };
  const now = new Date();

  for (const t of lista) {
    const renovar = `${publicBase()}/n/${t.key}/renovar`;
    const trial = t.plan === 'trial';
    const dias = diasRestantes(t) ?? 0;
    const flags = (t.avisos ?? {}) as Record<string, Date>;

    if (vigenciaVencida(t)) {
      if (t.panelActivo !== false || t.estadoSuscripcion !== 'vencida') {
        await tenants.updateOne({ key: t.key }, { $set: { panelActivo: false, estadoSuscripcion: 'vencida' } });
        invalidateLoyaltyTenantCache(String(t.key));
      }
      if (!flags.suspendido) {
        await avisarCliente(
          t,
          trial
            ? `Hola, terminó tu prueba de 7 días de Agentia Lealtad y tu tarjeta quedó en pausa ⏸️\n` +
                `Tus clientes y sus puntos siguen guardados. Para reactivarla hoy mismo (${precioTexto(t)}):\n${renovar}`
            : `Hola, tu suscripción de Agentia Lealtad venció y tu tarjeta quedó en pausa ⏸️\n` +
                `Tus clientes y sus puntos siguen guardados. Para reactivarla (${precioTexto(t)}):\n${renovar}`,
        );
        await tenants.updateOne({ key: t.key }, { $set: { 'avisos.suspendido': now } });
        await notifyOwner(`⏸️ ${t.nombre}: ${trial ? 'terminó la prueba' : 'venció la suscripción'} y se suspendió. Link de pago enviado.`);
        res.suspendidos++;
      }
    } else if (!trial && dias <= 0) {
      if (!flags.gracia) {
        await avisarCliente(
          t,
          `Hola, tu suscripción de Agentia Lealtad venció. Tienes ${GRACIA_DIAS_PAGO} días para renovar sin que se pause tu tarjeta (${precioTexto(t)}):\n${renovar}`,
        );
        await tenants.updateOne({ key: t.key }, { $set: { 'avisos.gracia': now } });
        res.avisosGracia++;
      }
    } else if (dias >= 1 && dias <= (trial ? 2 : 3) && !flags.previo) {
      await avisarCliente(
        t,
        trial
          ? `Hola, a tu prueba de Agentia Lealtad le quedan ${dias} día${dias === 1 ? '' : 's'} (termina el ${fmtFecha(t.vigenteHasta)}).\n` +
              `Para que tu tarjeta no se pause, contrátala aquí (${precioTexto(t)}):\n${renovar}`
          : `Hola, tu suscripción de Agentia Lealtad vence el ${fmtFecha(t.vigenteHasta)}.\nRenueva aquí (${precioTexto(t)}):\n${renovar}`,
      );
      await tenants.updateOne({ key: t.key }, { $set: { 'avisos.previo': now } });
      res.avisosPrevios++;
    }
  }
  return res;
}
