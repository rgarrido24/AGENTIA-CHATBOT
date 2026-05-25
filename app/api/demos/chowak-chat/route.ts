import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Proxy del demo Chowak: el HTML estático no puede llamar a Anthropic desde el navegador
 * (sin API key ni cabeceras). La clave vive solo en el servidor (Render: ANTHROPIC_API_KEY).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      {
        content: [
          {
            text:
              'El asistente demo no está configurado en el servidor (falta ANTHROPIC_API_KEY). Mientras tanto, escríbenos por WhatsApp: +52 999 118 56 38.',
          },
        ],
      },
      { status: 200 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const rawMessages = b.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length > 40) {
    return NextResponse.json({ error: 'messages inválido' }, { status: 400 });
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: typeof b.model === 'string' ? b.model : 'claude-sonnet-4-20250514',
      max_tokens: typeof b.max_tokens === 'number' ? Math.min(b.max_tokens, 4096) : 1024,
      system: typeof b.system === 'string' ? b.system : '',
      messages: rawMessages,
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
