import type { NextRequest } from 'next/server';
import { proxyAnuarioK3Request } from '@/lib/anuario-k3-proxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteCtx = { params: { path?: string[] } };

async function handle(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx.params.path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
export const OPTIONS = handle;
