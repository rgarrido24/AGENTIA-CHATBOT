import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { verifyClientPanelAuth, jsonUnauthorized } from '@/lib/client-panel-auth';
import { bridgeGetQrRaw } from '@/lib/baileys-bridge-client';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const clientId = params.clientId.toLowerCase();
  if (!verifyClientPanelAuth(request, clientId)) return jsonUnauthorized();

  const accept = request.headers.get('accept') || '';
  const wantsSse = accept.includes('text/event-stream');

  if (!wantsSse) {
    const qr = await bridgeGetQrRaw(clientId);
    let qrDataUrl: string | null = null;
    if (qr) {
      try {
        qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
      } catch {
        /* ignore */
      }
    }
    return Response.json({ qr, qrDataUrl });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        while (!closed) {
          try {
            const qr = await bridgeGetQrRaw(clientId);
            let qrDataUrl: string | null = null;
            if (qr) {
              try {
                qrDataUrl = await QRCode.toDataURL(qr, { width: 280, margin: 2 });
              } catch {
                /* ignore */
              }
            }
            send('qr', { qr, qrDataUrl, at: Date.now() });
          } catch (e) {
            send('error', { message: e instanceof Error ? e.message : 'Error QR' });
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      };

      poll().catch(() => {});
      request.signal.addEventListener('abort', () => {
        closed = true;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
