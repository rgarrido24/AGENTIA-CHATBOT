import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMongoDb } from "../lib/mongodb";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).setHeader("Content-Type", "text/plain").send("Method Not Allowed");
  }

  try {
    const db = await getMongoDb();

    const [leads, messages] = await Promise.all([
      db.collection("leads").find({}).sort({ lastMessageAt: -1 }).limit(200).toArray(),
      db.collection("leads_agentia").find({}).sort({ createdAt: -1 }).limit(300).toArray()
    ]);

    const leadsData = leads.map((l) => ({
      senderName: String(l.senderName ?? "Sin nombre").slice(0, 100),
      clientId: String(l.clientId ?? "").slice(0, 50),
      status: String(l.status ?? "Interesado").slice(0, 20),
      lastMessage: String(l.lastMessage ?? "").slice(0, 500),
      lastReply: String(l.lastReply ?? "").slice(0, 500),
      lastMessageAt: l.lastMessageAt,
      messageCount: Number(l.messageCount ?? 0),
      platform: String(l.platform ?? "").slice(0, 20)
    }));

    const messagesData = messages.map((m) => ({
      clientId: String(m.clientId ?? "").slice(0, 50),
      message: String(m.message ?? "").slice(0, 500),
      reply: String(m.reply ?? "").slice(0, 500),
      createdAt: m.createdAt,
      platform: String(m.platform ?? "").slice(0, 20)
    }));

    const leadsJson = JSON.stringify(leadsData).replace(/</g, "\\u003c");
    const messagesJson = JSON.stringify(messagesData).replace(/</g, "\\u003c");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin - Leads Agentia</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 1rem; background: #0f0f12; color: #e4e4e7; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    .card { background: #18181b; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
    .card h2 { font-size: 1rem; margin: 0 0 0.75rem 0; color: #a1a1aa; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #27272a; }
    th { color: #71717a; font-weight: 500; }
    .msg { max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; }
    .badge-interesado { background: #22c55e33; color: #22c55e; }
    .badge-calificado { background: #3b82f633; color: #60a5fa; }
    .badge-cerrado { background: #a855f733; color: #c084fc; }
    time { color: #71717a; font-size: 0.8rem; }
    .empty { color: #71717a; padding: 1rem; text-align: center; }
  </style>
</head>
<body>
  <h1>Leads y conversaciones</h1>

  <div class="card">
    <h2>Leads (personas que escribieron)</h2>
    <div id="leads-table"></div>
  </div>

  <div class="card">
    <h2>Últimos mensajes (cliente → bot)</h2>
    <div id="messages-table"></div>
  </div>

  <script>
    const leads = ${leadsJson};
    const messages = ${messagesJson};

    function badgeClass(s) {
      if (s === 'Cerrado') return 'badge-cerrado';
      if (s === 'Calificado') return 'badge-calificado';
      return 'badge-interesado';
    }

    function formatDate(d) {
      if (!d) return '-';
      const dt = new Date(d);
      return dt.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    }

    const leadsHtml = leads.length === 0
      ? '<p class="empty">Aún no hay leads registrados.</p>'
      : '<table><thead><tr><th>Nombre</th><th>Cliente</th><th>Estado</th><th>Último mensaje</th><th>Respuesta del bot</th><th>Fecha</th></tr></thead><tbody>' +
        leads.map(l => '<tr><td>' + (l.senderName || 'Sin nombre') + '</td><td>' + (l.clientId || '-') + '</td><td><span class="badge ' + badgeClass(l.status) + '">' + (l.status || 'Interesado') + '</span></td><td class="msg" title="' + (l.lastMessage || '').replace(/"/g, '&quot;') + '">' + (l.lastMessage || '-') + '</td><td class="msg" title="' + (l.lastReply || '').replace(/"/g, '&quot;') + '">' + (l.lastReply || '-') + '</td><td><time>' + formatDate(l.lastMessageAt) + '</time></td></tr>').join('') +
        '</tbody></table>';

    const messagesHtml = messages.length === 0
      ? '<p class="empty">Aún no hay mensajes.</p>'
      : '<table><thead><tr><th>Cliente</th><th>Mensaje del usuario</th><th>Respuesta del bot</th><th>Fecha</th></tr></thead><tbody>' +
        messages.map(m => '<tr><td>' + (m.clientId || '-') + '</td><td class="msg" title="' + (m.message || '').replace(/"/g, '&quot;') + '">' + (m.message || '-') + '</td><td class="msg" title="' + (m.reply || '').replace(/"/g, '&quot;') + '">' + (m.reply || '-') + '</td><td><time>' + formatDate(m.createdAt) + '</time></td></tr>').join('') +
        '</tbody></table>';

    document.getElementById('leads-table').innerHTML = leadsHtml;
    document.getElementById('messages-table').innerHTML = messagesHtml;
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err) {
    console.error("[admin-leads]", err);
    return res.status(500).setHeader("Content-Type", "text/plain").send("Error cargando datos");
  }
}
