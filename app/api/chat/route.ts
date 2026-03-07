import { NextRequest, NextResponse } from 'next/server';
import { handleChat } from '@/src/api/chat-handler';

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/chat',
    methods: ['GET', 'POST'],
    expects: {
      clientId: 'string',
      platform: 'facebook|instagram|whatsapp',
      entryType: 'comment|dm',
      message: 'string',
    },
  });
}

export async function POST(request: NextRequest) {
  const headers = request.headers;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }
  try {
    const result = await handleChat({ body: body as any, headers });
    return NextResponse.json(result.json, { status: result.status });
  } catch (err) {
    console.log("=== ERROR FATAL EN API CHAT (Route) ===");
    console.error(err);
    console.log("Stack:", err instanceof Error ? err.stack : "(no stack)");
    console.log("=======================");
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
