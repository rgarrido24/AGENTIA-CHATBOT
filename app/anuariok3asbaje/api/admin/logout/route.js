import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ANUARIO_BASE, ANUARIO_COOKIE, anuarioPath } from '@/lib/anuario-k3/paths';

export async function POST(request) {
  const cookieStore = cookies();
  cookieStore.set(ANUARIO_COOKIE, '', { path: ANUARIO_BASE, maxAge: 0 });
  const url = new URL(anuarioPath('/dashboard/login'), request.url);
  return NextResponse.redirect(url);
}
