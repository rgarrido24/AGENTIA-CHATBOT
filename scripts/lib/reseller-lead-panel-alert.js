'use strict';

/**
 * Alerta reseller (Luciano): plantilla oficial WhatsApp Cloud API `nuevo_lead_alerta`.
 */

const LUCIANO_PANEL_HEADER_IMAGE =
  'https://res.cloudinary.com/dcy5a39tm/image/upload/v1782579834/WhatsApp_Image_2026-06-27_at_11.03.20_AM_tzq2rn.jpg';

function formatLeadDateDdMmYyyy(value) {
  const dt = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(dt.getTime())) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

function normalizeWhatsAppTo(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function buildPortalLink(resellerId, clientSlug) {
  const rid = String(resellerId || 'luciano').trim().toLowerCase() || 'luciano';
  const slug = String(clientSlug || '').trim();
  if (slug) {
    return `https://agentia.software/portal/${encodeURIComponent(rid)}/cliente/${encodeURIComponent(slug)}`;
  }
  return `https://agentia.software/portal/${encodeURIComponent(rid)}/dashboard`;
}

/**
 * @param {object} opts
 * @param {string} opts.alertNumber - dígitos E.164 sin +
 * @param {string} opts.portalLink
 * @param {string} [opts.phoneNumberId]
 * @param {string} [opts.accessToken]
 * @param {string} [opts.logPrefix]
 */
async function sendResellerLeadPanelTemplate(opts) {
  const logPrefix = opts.logPrefix || '[reseller-alert]';
  const phoneId = String(opts.phoneNumberId || process.env.AGENTIA_WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const cwfPhoneId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  if (cwfPhoneId && phoneId === cwfPhoneId) {
    console.error(
      `${logPrefix} Las alertas reseller deben enviarse solo desde AGENTIA_WHATSAPP_PHONE_NUMBER_ID, no CWF`
    );
    return false;
  }
  const token = String(opts.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const to = normalizeWhatsAppTo(opts.alertNumber);

  if (!phoneId || !token) {
    console.error(`${logPrefix} AGENTIA_WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN no configurados`);
    return false;
  }
  if (!to || to.length < 8) {
    console.warn(`${logPrefix} Número destino inválido para plantilla nuevo_lead_alerta`);
    return false;
  }

  const portalLink = String(opts.portalLink || buildPortalLink('luciano', '')).trim();

  const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: 'nuevo_lead_alerta',
        language: { code: 'es' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: { link: LUCIANO_PANEL_HEADER_IMAGE },
              },
            ],
          },
          {
            type: 'body',
            parameters: [{ type: 'text', parameter_name: 'portal_link', text: portalLink }],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`${logPrefix} Graph API nuevo_lead_alerta error:`, res.status, errText.slice(0, 500));
    return false;
  }

  console.log(`${logPrefix} Plantilla nuevo_lead_alerta enviada → ${to}`);
  return true;
}

module.exports = {
  formatLeadDateDdMmYyyy,
  normalizeWhatsAppTo,
  buildPortalLink,
  sendResellerLeadPanelTemplate,
};
