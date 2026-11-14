import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { setSessionCookie, verifyPassword } from '@/lib/loyalty-session';
import { vigenciaVencida } from '@/lib/lealtad-suscripcion';
import { clearFails, lockMinutesLeft, notifyOwner, recordFail, requestIp } from '@/lib/loyalty-security';

export const dynamic = 'force-dynamic';

/** POST /api/loyalty/auth/login — { negocio, username, password } */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const negocio = String(body.negocio ?? '').trim().toLowerCase();
  const username = String(body.username ?? '').trim();
  const password = String(body.password ?? '');
  const ip = requestIp(req);
  if (!negocio) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

  const locked = await lockMinutesLeft(negocio, ip);
  if (locked > 0) {
    return NextResponse.json({ error: `Demasiados intentos. Intenta de nuevo en ${locked} min.` }, { status: 429 });
  }

  const db = await getMongoDb();
  const doc = await db.collection('loyalty_tenants').findOne({ key: negocio });
  const panel = (doc?.panel ?? null) as { user?: string; passHash?: string } | null;
  const nombre = String(doc?.nombre ?? negocio);

  const ok =
    !!doc &&
    !!panel?.user &&
    username.toLowerCase() === String(panel.user).toLowerCase() &&
    verifyPassword(password, panel.passHash);

  if (!ok) {
    const r = await recordFail(negocio, nombre, ip, req.headers.get('user-agent') ?? '', username);
    return NextResponse.json(
      { error: r.locked ? 'Demasiados intentos. Acceso bloqueado por 30 min.' : 'Usuario o contraseña incorrectos' },
      { status: r.locked ? 429 : 401 },
    );
  }

  await clearFails(negocio, ip);
  if (doc!.panelActivo !== false && vigenciaVencida(doc as { vigenteHasta?: Date; plan?: string })) {
    return NextResponse.json(
      { error: `Tu periodo terminó y la tarjeta está en pausa. Reactívala en agentia.software/n/${negocio}/renovar`, suspendido: true },
      { status: 403 },
    );
  }
  if (doc!.panelActivo === false) {
    await notifyOwner(`🔒 ${nombre} — intento de entrada con el panel SUSPENDIDO.\nIP: ${ip}`);
    return NextResponse.json(
      { error: `Servicio suspendido. Para reactivarlo entra a agentia.software/n/${negocio}/renovar o contacta a Agentia.`, suspendido: true },
      { status: 403 },
    );
  }
  await setSessionCookie(negocio);
  return NextResponse.json({ ok: true });
}
