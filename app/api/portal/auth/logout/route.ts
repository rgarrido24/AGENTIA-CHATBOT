import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/reseller-auth';

export async function GET(req: NextRequest) {
  const resellerId = req.nextUrl.searchParams.get('resellerId') ?? '';
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.redirect(new URL(`/portal/${resellerId}`, req.url));
}
