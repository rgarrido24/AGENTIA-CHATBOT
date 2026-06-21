import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';
import { ANUARIO_COOKIE, anuarioAdminPassword } from '@/lib/anuario-k3/paths';

export async function POST(request) {
  const cookieStore = cookies();
  const expected = anuarioAdminPassword();
  const auth = cookieStore.get(ANUARIO_COOKIE)?.value;
  if (!expected || auth !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { token } = await request.json();
  await connectDB();
  await Alumno.findOneAndUpdate({ token }, { formularioEnviado: false });
  return NextResponse.json({ ok: true });
}
