import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function GET() {
  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );

  let mongodb: 'connected' | 'disconnected' | 'not_configured' = 'disconnected';
  const hasMongoUri = !!process.env.MONGODB_URI?.trim();
  if (!hasMongoUri) {
    mongodb = 'not_configured';
  } else {
    try {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      mongodb = 'connected';
    } catch {
      mongodb = 'disconnected';
    }
  }

  const ok = hasGeminiKey && (mongodb === 'connected' || mongodb === 'not_configured');
  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      gemini: hasGeminiKey ? 'configured' : 'missing',
      mongodb,
    },
    { status: ok ? 200 : 503 }
  );
}
