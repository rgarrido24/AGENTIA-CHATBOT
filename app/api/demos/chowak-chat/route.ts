import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

type Turn = { role: 'user' | 'assistant'; content: string };

/**
 * Proxy del demo Chowak: mismo stack que el resto de Agentia (Gemini vía @ai-sdk/google).
 * Variables: GEMINI_API_KEY o GOOGLE_GENERATIVE_AI_API_KEY; opcional GEMINI_MODEL.
 * Respuesta compatible con el cliente estático: { content: [{ text }] }.
 */
export async function POST(req: NextRequest) {
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        content: [
          {
            text:
              'El asistente demo no está configurado (falta GEMINI_API_KEY en el servidor). Escríbenos por WhatsApp: +52 999 118 56 38.',
          },
        ],
      },
      { status: 200 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const rawMessages = body.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || rawMessages.length > 40) {
    return NextResponse.json({ error: 'messages inválido' }, { status: 400 });
  }

  const messages: Turn[] = [];
  for (const m of rawMessages) {
    if (!m || typeof m !== 'object') continue;
    const o = m as Record<string, unknown>;
    const role = o.role === 'assistant' ? 'assistant' : o.role === 'user' ? 'user' : null;
    const content = typeof o.content === 'string' ? o.content : '';
    if (!role || !content.trim()) continue;
    messages.push({ role, content });
  }

  if (messages.length === 0) {
    return NextResponse.json({ error: 'messages vacío' }, { status: 400 });
  }

  const system =
    typeof body.system === 'string' && body.system.trim()
      ? body.system.trim()
      : 'Eres un asistente útil en español.';

  const modelId = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const { text } = await generateText({
      model: google(modelId),
      system,
      messages,
    });
    const reply = (text ?? '').trim() || '…';
    return NextResponse.json({ content: [{ text: reply }] });
  } catch (e) {
    console.error('[api/demos/chowak-chat]', e);
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json(
      {
        content: [
          {
            text: `No pude generar respuesta (${msg}). Escríbenos por WhatsApp: +52 999 118 56 38.`,
          },
        ],
      },
      { status: 200 }
    );
  }
}
