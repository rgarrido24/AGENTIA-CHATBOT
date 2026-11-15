import { NextResponse } from 'next/server';
import { estadoPromo } from '@/lib/lealtad-promo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const e = await estadoPromo();
    return NextResponse.json(e, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[lealtad/promo]', err);
    return NextResponse.json({ activa: false, restantes: 0 }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
