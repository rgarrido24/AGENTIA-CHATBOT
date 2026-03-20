import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const redirectTo = '/demo/barber';

  if (token) {
    try {
      const db = await getMongoDb();
      const prospecto = await db.collection('prospectos').findOne({ trackToken: token });
      if (prospecto && !prospecto.demoAbierta) {
        await db.collection('prospectos').updateOne(
          { trackToken: token },
          { $set: { demoAbierta: true, demoAbiertaAt: new Date(), updatedAt: new Date() } }
        );
      }
      // Si el prospecto tiene demo específica, redirigir a esa
      const demoPath = prospecto?.demo === 'barberia' ? '/demo/barber' : '/demo/barber';
      return NextResponse.redirect(new URL(demoPath, request.url));
    } catch {
      // Si hay error, redirigir igual
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
