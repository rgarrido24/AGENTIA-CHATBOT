import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function cleanStr(v: unknown, max = 200): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function cleanBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v === 'true' || v === 'si' || v === 'sí';
  return false;
}

function clientIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    ''
  );
}

/**
 * Normaliza un teléfono a sólo dígitos (para wa.me).
 * Si no trae lada, antepone 52 (México) cuando son 10 dígitos.
 */
function normalizeWaNumber(raw: string): string {
  const digits = (raw || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

/**
 * Envía un mensaje vía Agentia Bridge (mismo endpoint que sale-closure-flow).
 * Si las env vars no están configuradas, hace no-op y loggea.
 */
async function sendWhatsAppDirect(to: string, body: string): Promise<boolean> {
  const url = process.env.WHATSAPP_SEND_URL ?? '';
  const token = process.env.WHATSAPP_API_TOKEN ?? '';
  if (!url || !to || !body) {
    console.warn('[fotos-escuela/submit] WhatsApp send skipped (missing url/to/body)');
    return false;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        to,
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) {
      console.warn('[fotos-escuela/submit] WhatsApp bridge HTTP', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[fotos-escuela/submit] WhatsApp bridge error:', (err as Error)?.message);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const tipo = cleanStr(body.tipo, 30); // 'anuario' | 'fiesta'
    const tutorNombre = cleanStr(body.tutorNombre, 120);
    const tutorWhatsapp = cleanStr(body.tutorWhatsapp, 60);
    const alumnoNombre = cleanStr(body.alumnoNombre, 120);
    const colegio = cleanStr(body.colegio, 160);
    const grupo = cleanStr(body.grupo, 60);
    const email = cleanStr(body.email, 160);
    const paquete = cleanStr(body.paquete, 60);
    const notas = cleanStr(body.notas, 800);
    const aportacion = cleanStr(body.aportacion, 800);
    const page = cleanStr(body.page, 200);
    const esVocal = cleanBool(body.esVocal);

    if (tipo !== 'anuario' && tipo !== 'fiesta') {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
    if (!tutorNombre || !tutorWhatsapp) {
      return NextResponse.json({ error: 'Faltan nombre y WhatsApp' }, { status: 400 });
    }
    if (tipo === 'anuario') {
      if (!colegio || !grupo) {
        return NextResponse.json({ error: 'Faltan colegio y grupo' }, { status: 400 });
      }
    } else if (!alumnoNombre) {
      return NextResponse.json({ error: 'Falta nombre del alumno' }, { status: 400 });
    }

    const ip = clientIP(req) || null;
    const ua = req.headers.get('user-agent') ?? null;
    const now = new Date();

    const db = await getMongoDb();

    // 1. Persistencia primaria: colección histórica de leads de demo
    await db.collection('demo_fotos_escuela_forms').insertOne({
      tipo,
      tutorNombre,
      tutorWhatsapp,
      alumnoNombre: alumnoNombre || null,
      colegio: colegio || null,
      grupo: grupo || null,
      esVocal: tipo === 'anuario' ? esVocal : null,
      email: email || null,
      paquete: paquete || null,
      notas: notas || null,
      aportacion: aportacion || null,
      page: page || null,
      ip,
      ua,
      createdAt: now,
    });

    // 2. Colección dedicada para la operación: registros_escolares
    //    (sólo para tipo "anuario", flujo D2C activo)
    if (tipo === 'anuario') {
      await db.collection('registros_escolares').insertOne({
        nombrePapa: tutorNombre,
        whatsappPapa: tutorWhatsapp,
        whatsappPapaNorm: normalizeWaNumber(tutorWhatsapp),
        colegio,
        grupo,
        esVocal,
        page: page || null,
        ip,
        ua,
        estado: 'pendiente', // pendiente | confirmado | sesion_agendada
        notificadoAdmin: false,
        notificadoUsuario: false,
        createdAt: now,
      });
    }

    // 3. Webhooks Agentia Bridge — al papá y al admin (fire-and-forget pero
    //    esperamos resultado para reflejar el estado en la collection).
    const adminNumber = process.env.ALERT_WHATSAPP_NUMBER || process.env.RODOLFO_WHATSAPP || '';
    const papaNumber = normalizeWaNumber(tutorWhatsapp);

    let notificadoAdmin = false;
    let notificadoUsuario = false;

    if (tipo === 'anuario') {
      // Acción 1 — Confirmación al papá
      const msgPapa =
        `¡Registro exitoso! Ya eres parte del grupo de ${grupo} (${colegio}). ` +
        `En cuanto lleguemos a los 10 papás registrados, te avisaremos para coordinar la Sesión Fotográfica. ` +
        `\n\nGracias por confiar en Agentia 💛`;
      notificadoUsuario = await sendWhatsAppDirect(papaNumber, msgPapa);

      // Acción 2 — Alerta al admin
      const msgAdmin =
        `📸 *Nuevo registro escolar — Agentia Fotos*\n` +
        `\n👤 ${tutorNombre}` +
        `\n📞 ${tutorWhatsapp}` +
        `\n🏫 ${colegio}` +
        `\n📚 ${grupo}` +
        (esVocal ? `\n⭐ Vocal del salón` : '') +
        `\n🕐 ${now.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;
      notificadoAdmin = await sendWhatsAppDirect(adminNumber, msgAdmin);

      // Actualizamos el estado de notificación en la collection (best-effort)
      try {
        await db.collection('registros_escolares').updateOne(
          { whatsappPapa: tutorWhatsapp, colegio, grupo, createdAt: now },
          { $set: { notificadoAdmin, notificadoUsuario } },
        );
      } catch (e) {
        console.warn('[fotos-escuela/submit] update notificado flags failed:', (e as Error)?.message);
      }
    }

    // 4. Link a WhatsApp que el frontend abre en nueva pestaña.
    //    El usuario manda al canal de Agentia un mensaje pre-llenado para
    //    cerrar el loop ("acabo de registrar..." → respuesta humana/bot).
    const waBody =
      tipo === 'anuario'
        ? `Hola Agentia, acabo de registrar al grupo ${grupo} del colegio ${colegio}. Avísenme cuando seamos 10 papás para la sesión.`
        : `Hola Agentia, me acabo de registrar para la fiesta de kinder.`;
    const waTarget = adminNumber || '';
    const whatsappLink = waTarget
      ? `https://wa.me/${waTarget}?text=${encodeURIComponent(waBody)}`
      : `https://wa.me/?text=${encodeURIComponent(waBody)}`;

    return NextResponse.json({
      ok: true,
      whatsappLink,
      notificadoAdmin,
      notificadoUsuario,
    });
  } catch (e) {
    console.error('[demo/fotos-escuela/submit]', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
