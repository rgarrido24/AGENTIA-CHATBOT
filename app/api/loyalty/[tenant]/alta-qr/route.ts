import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getLoyaltyTenant } from '@/lib/loyalty-tenants';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ tenant: string }> };

function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3010';
  const defaultProto = /localhost|127\.0\.0\.1/i.test(host) ? 'http' : 'https';
  const proto = req.headers.get('x-forwarded-proto') ?? defaultProto;
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { tenant } = await ctx.params;
    const cfg = await getLoyaltyTenant(tenant);
    if (!cfg) return NextResponse.json({ error: 'Tenant inválido' }, { status: 404 });

    const sizeRaw = req.nextUrl.searchParams.get('size');
    const sizeNum = Number(sizeRaw);
    const size = Number.isFinite(sizeNum) ? Math.min(1000, Math.max(360, Math.floor(sizeNum))) : 700;

    const origin = publicOrigin(req);
    const altaUrl = `${origin}${cfg.basePath}/alta`;

    const buffer = await QRCode.toBuffer(altaUrl, {
      type: 'png',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return new Response(buffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="qr-alta-${cfg.id}.png"`,
      },
    });
  } catch (e) {
    console.error('[api/loyalty/alta-qr]', e);
    return NextResponse.json({ error: 'No se pudo generar el QR' }, { status: 500 });
  }
}

