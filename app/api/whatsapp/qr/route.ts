import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import QRCode from 'qrcode';

/**
 * GET /api/whatsapp/qr
 * Devuelve el código QR actual para vincular WhatsApp.
 * - ?format=png → imagen PNG
 * - ?format=html → página HTML para escanear desde el celular
 * - ?format=json → { qr: "data:image/png;base64,..." }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'html';
    const clientId = (searchParams.get('clientId') ?? 'agentia').trim().toLowerCase() || 'agentia';

    const db = await getMongoDb();
    // Try clientId first, fall back to legacy 'current' doc for backwards compat
    const doc = await db.collection<{ qr?: string; updatedAt?: Date }>('whatsapp_qr').findOne(
      { _id: clientId as any }
    ) ?? (clientId === 'agentia'
      ? await db.collection<{ qr?: string; updatedAt?: Date }>('whatsapp_qr').findOne({ _id: 'current' as any })
      : null);
    const qrData = doc?.qr;

    if (!qrData) {
      if (format === 'html') {
        return new Response(
          `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WhatsApp - Agentia</title>
  <style>
    body{font-family:system-ui;background:#0a0a0a;color:#fff;margin:0;padding:2rem;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .box{background:rgba(79,157,116,0.1);border:1px solid rgba(79,157,116,0.4);border-radius:1rem;padding:2rem;max-width:420px;text-align:left}
    h1{color:#4f9d74;font-size:1.25rem;margin-bottom:1rem}
    p{color:#94a3b8;font-size:0.9rem;line-height:1.6}
    code{background:rgba(0,0,0,0.3);padding:0.2rem 0.4rem;border-radius:0.25rem;font-size:0.85rem}
    ol{margin:0.5rem 0;padding-left:1.25rem;color:#94a3b8;font-size:0.9rem;line-height:1.8}
    .refresh{background:#4f9d74;color:#000;padding:0.5rem 1rem;border-radius:0.5rem;border:none;cursor:pointer;font-weight:600;margin-top:1rem}
    .refresh:hover{background:#173814;color:#fff}
  </style>
</head>
<body>
  <div class="box">
    <h1>📱 Vincular WhatsApp</h1>
    <p>El QR aún no está disponible. Sigue estos pasos:</p>
    <ol>
      <li>Abre una <strong>terminal nueva</strong> (aparte de la que corre la app).</li>
      <li>En la raíz del proyecto ejecuta: <code>npm run whatsapp</code></li>
      <li>Espera a que aparezca "QR enviado al API" en la terminal.</li>
      <li>Recarga esta página o haz clic abajo.</li>
    </ol>
    <p style="font-size:0.8rem;margin-top:0.5rem">Revisa que <code>AGENTIA_CHATBOT_API_URL</code> en .env apunte a tu app (ej: http://localhost:3010) y que MongoDB esté configurado.</p>
    <button class="refresh" onclick="location.reload()">Recargar página</button>
  </div>
</body>
</html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      return Response.json({ error: 'QR no disponible. Ejecuta el WhatsApp Bridge (npm run whatsapp).' }, { status: 404 });
    }

    const pngBuffer = await QRCode.toBuffer(qrData, { width: 300, margin: 2 });

    if (format === 'png') {
      return new Response(pngBuffer as any, {
        headers: { 'Content-Type': 'image/png' },
      });
    }

    const dataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });

    if (format === 'json') {
      return Response.json({ qr: dataUrl, updatedAt: doc?.updatedAt });
    }

    return new Response(
      `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Escanea el QR - Agentia WhatsApp</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:system-ui;background:#0a0a0a;color:#fff;margin:0;padding:1.5rem;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .card{background:linear-gradient(135deg,rgba(79,157,116,0.15),rgba(23,56,20,0.2));border:1px solid rgba(79,157,116,0.4);border-radius:1.25rem;padding:2rem;text-align:center;box-shadow:0 0 30px rgba(79,157,116,0.15);max-width:360px}
    h1{color:#4f9d74;font-size:1.25rem;margin:0 0 0.5rem 0}
    .warning{background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.4);border-radius:0.5rem;padding:0.75rem;margin:1rem 0;font-size:0.85rem;color:#fca5a5;text-align:left}
    .warning strong{color:#f87171}
    img{width:256px;height:256px;border-radius:0.75rem;background:#fff;padding:0.5rem;margin:1rem 0}
    .steps{text-align:left;margin:1rem 0;padding:0 1rem;font-size:0.9rem;color:#94a3b8;line-height:1.9}
    .steps strong{color:#e2e8f0}
  </style>
</head>
<body>
  <div class="card">
    <h1>📱 Vincular WhatsApp</h1>
    <div class="warning">
      <strong>⚠️ No uses la cámara ni un lector QR normal.</strong> Si escaneas con eso verás letras sin sentido. Debes usar el escáner <strong>dentro de WhatsApp</strong>.
    </div>
    <img src="${dataUrl}" alt="QR para vincular WhatsApp" />
    <p class="steps">
      <strong>1.</strong> Abre WhatsApp en tu celular<br>
      <strong>2.</strong> Menú (⋮) → <strong>Dispositivos vinculados</strong><br>
      <strong>3.</strong> Toca <strong>Vincular dispositivo</strong><br>
      <strong>4.</strong> Escanea este QR con el escáner de WhatsApp
    </p>
  </div>
</body>
</html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
