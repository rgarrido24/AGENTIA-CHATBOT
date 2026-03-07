import { NextResponse } from 'next/server';

export async function GET() {
  const hasGeminiKey = !!(
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()
  );
  return NextResponse.json({
    ok: true,
    hasGeminiKey,
  });
}
