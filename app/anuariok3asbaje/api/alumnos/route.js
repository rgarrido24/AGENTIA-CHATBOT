import { NextResponse } from 'next/server';
import { getAlumnosPublic } from '@/lib/anuario-k3/getAlumnosPublic';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const alumnos = await getAlumnosPublic();
    return NextResponse.json({ alumnos });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'No se pudieron cargar alumnos', alumnos: [] }, { status: 500 });
  }
}
