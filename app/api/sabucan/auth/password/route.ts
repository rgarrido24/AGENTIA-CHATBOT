/**
 * POST /api/sabucan/auth/password
 * Cambia la contraseña de Sabucan guardando el override en MongoDB (colección bot_settings).
 * La contraseña de Render sigue funcionando si no hay override guardado.
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/mongodb';
import {
  SABUCAN_AUTH_COOKIE,
  SABUCAN_AUTH_MAX_AGE,
  getSabucanAdminUser,
  getSabucanAdminPassword,
  sabucanAuthToken,
} from '@/lib/sabucan-auth';

export const dynamic = 'force-dynamic';

async function getSabucanPasswordOverride(): Promise<string | null> {
  try {
    const db = await getMongoDb();
    const doc = await db
      .collection('bot_settings')
      .findOne({ _id: 'sabucan_password_override' } as never);
    const d = doc as unknown as { password?: string } | null;
    return typeof d?.password === 'string' ? d.password : null;
  } catch {
    return null;
  }
}

async function setSabucanPasswordOverride(newPassword: string): Promise<void> {
  const db = await getMongoDb();
  await db.collection('bot_settings').updateOne(
    { _id: 'sabucan_password_override' } as never,
    { $set: { password: newPassword, updatedAt: new Date() } } as never,
    { upsert: true },
  );
}

export async function getEffectiveSabucanPassword(): Promise<string> {
  const override = await getSabucanPasswordOverride();
  return override ?? getSabucanAdminPassword();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

  if (!username || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
      { status: 400 },
    );
  }

  const expectedUser = getSabucanAdminUser();
  const effectivePassword = await getEffectiveSabucanPassword();

  if (username !== expectedUser || currentPassword !== effectivePassword) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 });
  }

  await setSabucanPasswordOverride(newPassword);

  // Actualizar la cookie con la nueva contraseña
  const newToken = await sabucanAuthToken(expectedUser, newPassword);
  const cookieStore = await cookies();
  cookieStore.set(SABUCAN_AUTH_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SABUCAN_AUTH_MAX_AGE,
    path: '/',
  });

  return NextResponse.json({ ok: true });
}
