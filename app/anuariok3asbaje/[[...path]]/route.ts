import type { NextRequest } from 'next/server';
import { proxyAnuarioK3Request } from '@/lib/anuario-k3-proxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteCtx = { params: { path?: string[] } };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}

export async function HEAD(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}

export async function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  return proxyAnuarioK3Request(req, ctx?.params?.path);
}
