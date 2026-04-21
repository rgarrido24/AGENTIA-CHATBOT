import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getMongoDb();
    await db.collection('security_blocked').insertOne({
      ip:        body.ip   ?? 'unknown',
      userAgent: body.ua   ?? '',
      path:      body.path ?? '',
      blockedAt: new Date(),
    });
  } catch { /* silent — logging must never crash the app */ }
  return NextResponse.json({ ok: true });
}
