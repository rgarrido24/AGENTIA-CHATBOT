import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Public endpoint — returns only cosmetic brand fields (no sensitive data)
export async function GET(
  _req: NextRequest,
  { params }: { params: { resellerId: string } }
) {
  try {
    const db       = await getMongoDb();
    const reseller = await db
      .collection('resellers')
      .findOne(
        { resellerId: params.resellerId, status: 'activo' },
        { projection: { brandLogo: 1, brandName: 1, brandColor: 1, _id: 0 } }
      );
    if (!reseller) return NextResponse.json({});
    return NextResponse.json({
      brandLogo:  reseller.brandLogo  || null,
      brandName:  reseller.brandName  || null,
      brandColor: reseller.brandColor || null,
    });
  } catch {
    return NextResponse.json({});
  }
}
