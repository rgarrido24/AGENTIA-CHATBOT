/**
 * Activación automática de un negocio tras confirmarse el pago.
 * Crea tenant en `loyalty_tenants`, clase de Google Wallet, credenciales del panel
 * y manda todo por WhatsApp. Idempotente: solo corre una vez por solicitud.
 */
import sharp from 'sharp';
import { getMongoDb } from '@/lib/mongodb';
import { bridgeSendMessage } from '@/lib/baileys-bridge-client';
import { uploadPanelAttachment } from '@/lib/cloudinary-panel';
import { loyaltyDocToConfig, invalidateLoyaltyTenantCache } from '@/lib/loyalty-tenants';
import { asegurarClaseWallet } from '@/lib/wallet-class-admin';
import { hashPassword, randomPassword } from '@/lib/loyalty-session';
import { notifyOwner } from '@/lib/loyalty-security';

export const SOLICITUDES = 'lealtad_solicitudes';
const RESERVADOS = new Set([
  'auth', 'demo', 'n', 'api', 'admin', 'lealtad', 'loyalty', 'sabucan', 'carnitas', 'carnitas_granada',
  'cafe', 'barberia', 'abarrotes', 'login', 'dashboard', 'legal', 'brief', 'portal', 'clientes',
]);

export function publicBase(): string {
  return (process.env.PUBLIC_BASE_URL || 'https://agentia.software').replace(/\/$/, '');
}

function slugify(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 36);
}

async function slugLibre(nombre: string): Promise<string> {
  const db = await getMongoDb();
  const base = slugify(nombre) || 'negocio';
  for (let i = 0; i < 50; i++) {
    const cand = i === 0 ? base : `${base}_${i + 1}`;
    if (RESERVADOS.has(cand)) continue;
    if (!(await db.collection('loyalty_tenants').findOne({ key: cand }))) return cand;
  }
  return `${base}_${Date.now().toString(36)}`;
}

/** Logo provisional (inicial sobre el color de la tarjeta) cuando el cliente no subió uno. */
async function logoProvisional(nombre: string, color: string): Promise<string> {
  const letra = (nombre.trim().charAt(0) || 'L').toUpperCase().replace(/[<>&]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="250" fill="#FFFFFF" fill-opacity="0.95"/><text x="256" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="260" font-weight="700" text-anchor="middle" fill="${color}">${letra}</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const up = await uploadPanelAttachment(png, { folder: 'lealtad-logos', fileName: 'logo-provisional.png', mimeType: 'image/png' });
  return up.url;
}

function telefonoWa(raw: string): string {
  const d = String(raw).replace(/\D/g, '');
  return d.length === 10 ? `52${d}` : d.length === 12 && d.startsWith('52') ? d : d;
}

type Solicitud = Record<string, any>;

export async function activarSolicitud(ref: string): Promise<{ ok: boolean; key?: string; error?: string }> {
  const db = await getMongoDb();
  const col = db.collection(SOLICITUDES);

  // Candado: solo una ejecución puede pasar de 'pagado' a 'activando'.
  const sol = (await col.findOneAndUpdate(
    { ref, estado: { $in: ['pagado', 'error_activacion'] } },
    { $set: { estado: 'activando', activandoAt: new Date() } },
    { returnDocument: 'after' },
  )) as Solicitud | null;
  if (!sol) return { ok: false, error: 'Solicitud no está en estado pagado (ya activada o inexistente)' };

  try {
    const color = /^#[0-9a-fA-F]{6}$/.test(sol.color) ? sol.color : '#123B2A';
    const nombre = String(sol.negocio).trim();
    const key = await slugLibre(nombre);
    const logoUrl = sol.logoUrl || (await logoProvisional(nombre, color));

    const modelo = ['sellos', 'puntos', 'cashback'].includes(sol.modelo) ? sol.modelo : 'puntos';
    const parametro = Number(sol.parametro) > 0 ? Number(sol.parametro) : modelo === 'sellos' ? 10 : 1;
    const usuario = key.replace(/_/g, '').slice(0, 20);
    const password = randomPassword(10);
    const now = new Date();
    const vigente = new Date(now);
    if (sol.periodo === 'anual') vigente.setFullYear(vigente.getFullYear() + 1);
    else vigente.setMonth(vigente.getMonth() + 1);

    const doc = {
      key,
      nombre,
      logoUrl,
      colorPrimario: color,
      colorAcento: '#F2C14E',
      plan: 'base',
      isDemo: false,
      panelActivo: true,
      origen: 'self-serve',
      solicitudRef: ref,
      collection: `${key}_clientes`,
      classSuffix: `${key}_lealtad`,
      objectPrefix: key.replace(/_/g, '-'),
      basePath: `/n/${key}`,
      recompensa: { modelo, parametro },
      rewardMeta: modelo === 'sellos' ? parametro : 10,
      whatsapp: sol.whatsapp ? telefonoWa(sol.whatsapp) : undefined,
      direccion: sol.direccion || undefined,
      horario: sol.horario || undefined,
      giro: sol.giro,
      sucursales: sol.sucursales,
      periodo: sol.periodo,
      vigenteHasta: vigente,
      panel: { user: usuario, passHash: hashPassword(password) },
      createdAt: now,
    };
    await db.collection('loyalty_tenants').insertOne(doc);
    invalidateLoyaltyTenantCache(key);

    const cfg = loyaltyDocToConfig(doc as unknown as Record<string, unknown>);
    const wallet = await asegurarClaseWallet(cfg);

    const panelUrl = `${publicBase()}/n/${key}/login`;
    const qrUrl = `${publicBase()}/api/loyalty/${key}/alta-qr`;
    const altaUrl = `${publicBase()}/n/${key}/alta`;

    const mensaje =
      `¡Listo, ${nombre}! Tu tarjeta de lealtad ya está activa 🎉\n\n` +
      `🖥️ Panel de caja: ${panelUrl}\nUsuario: ${usuario}\nContraseña: ${password}\n\n` +
      `📲 Para que tus clientes se registren y guarden su tarjeta en Google Wallet:\n` +
      `• Link: ${altaUrl}\n• QR para imprimir: ${qrUrl}\n\n` +
      (sol.logoUrl ? '' : '📎 Mándanos tu logo por este chat y lo ponemos en tu tarjeta.\n\n') +
      `Cualquier duda, responde este mensaje.`;

    let enviado = false;
    try {
      await bridgeSendMessage(
        process.env.AGENTIA_ALERTS_SENDER_CLIENT_ID || 'agentia-ventas',
        telefonoWa(sol.whatsapp),
        mensaje,
      );
      enviado = true;
    } catch (e) {
      console.error('[lealtad-provision] WhatsApp al cliente falló', e);
    }

    await col.updateOne(
      { ref },
      {
        $set: {
          estado: 'activada',
          activadaAt: new Date(),
          tenantKey: key,
          walletOk: wallet.ok,
          walletDetalle: wallet.detalle ?? null,
          whatsappEnviado: enviado,
          // Respaldo para mostrarlo en /lealtad/gracias (24 h) si el WhatsApp no sale.
          credTemp: { user: usuario, pass: password, panelUrl, hasta: new Date(Date.now() + 24 * 3600 * 1000) },
        },
      },
    );

    await notifyOwner(
      `✅ Nuevo cliente Agentia Lealtad: ${nombre}\nGiro: ${sol.giro} · ${sol.sucursales} suc · ${sol.periodo} · $${sol.total}\n` +
        `Panel: ${panelUrl}\nWallet: ${wallet.ok ? 'clase lista' : '⚠️ ' + wallet.detalle}\n` +
        `Credenciales al cliente: ${enviado ? 'enviadas por WhatsApp' : '⚠️ NO se pudieron enviar (bridge caído) — se muestran en la página de gracias'}` +
        (sol.logoUrl ? '' : '\nSin logo: pedirlo por WhatsApp.'),
    );
    return { ok: true, key };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[lealtad-provision] error', e);
    await col.updateOne({ ref }, { $set: { estado: 'error_activacion', error: msg.slice(0, 300) } });
    await notifyOwner(`❌ Falló la activación de "${sol.negocio}" (ya pagó $${sol.total}). Reintenta: POST /api/lealtad/activar {ref:"${ref}"}\n${msg.slice(0, 200)}`);
    return { ok: false, error: msg };
  }
}
