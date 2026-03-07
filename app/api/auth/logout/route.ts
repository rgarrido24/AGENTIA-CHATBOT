import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_auth';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  const url = new URL(request.url);
  const origin = url.origin;
  return NextResponse.redirect(origin + '/login');
}
