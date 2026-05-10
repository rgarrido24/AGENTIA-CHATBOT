import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'admin_auth';
const DASHBOARD_COOKIE_NAME = 'dashboard_auth';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(DASHBOARD_COOKIE_NAME);
  const url = new URL(request.url);
  const origin = url.origin;
  return NextResponse.redirect(origin + '/login');
}
