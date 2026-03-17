/**
 * sale-closure-flow.js
 * Flujo de Cierre de Venta y Manejo de Documentos – izzi / Agentia
 * Coloca este archivo en: src/lib/
 *
 * Dependencias esperadas en variables de entorno (.env):
 *   LEADS_API_BASE_URL       → Base URL de tu API de leads  (ej: https://api.tuapp.com)
 *   ALERT_WHATSAPP_NUMBER    → Número WA para alertas       (ej: 521XXXXXXXXXX)
 *   WHATSAPP_SEND_URL        → URL para enviar mensajes WA  (ej: https://…/api/messages/send)
 *   WHATSAPP_API_TOKEN       → Token de autorización WA
 *   GEMINI_API_KEY           → API key de Google Gemini (visión)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─────────────────────────────────────────────
// 0. CONFIGURACIÓN DESDE ENV
// ─────────────────────────────────────────────
const CONFIG = {
  leadsApiBase:        process.env.LEADS_API_BASE_URL      ?? "",
  alertWhatsapp:       process.env.ALERT_WHATSAPP_NUMBER   ?? "",
  whatsappSendUrl:     process.env.WHATSAPP_SEND_URL       ?? "",
  whatsappToken:       process.env.WHATSAPP_API_TOKEN      ?? "",
  maxDocumentAttempts: 2,
};

// ─────────────────────────────────────────────
// 1. ESTADOS DEL PIPELINE
// ─────────────────────────────────────────────
export const PIPELINE_STATES = {
  // ── Columnas reales del pipeline ──────────────────────────────────────
  FRIO:       "Frío",       // Sin interacción o sin respuesta
  TIBIO:      "Tibio",      // Respondió, hay interés inicial
  CALIENTE:   "Caliente",   // Muy interesado, en proceso de cierre activo
  CERRADO:    "Cerrado",    // Doc recibido + OCR validado + cliente confirmó ✅
  CANCELADO:  "Cancelado",  // Perdió interés o no respondió

  // ── Aliases internos → apuntan a la columna correspondiente ──────────
  DOC_PENDIENTE:  "Caliente",
  DOC_VALIDADO:   "Caliente",
  CONFIRMACION:   "Caliente",
  BOT_PAUSADO:    "Caliente",
  EN_PROCESO:     "Tibio",
};

// ─────────────────────────────────────────────
// 2. MENSAJES DEL BOT
// ─────────────────────────────────────────────
export const MESSAGES = {
  pedirDocumento: (intento) =>
    intento === 1
      ? "Para continuar con tu solicitud, necesito que me envíes una foto clara de tu identificación oficial (INE/Pasaporte) por favor. 📄"
      : "No he recibido tu identificación aún. Por favor envíame una foto clara de tu INE o pasaporte para poder continuar. Es el último paso antes de procesar tu solicitud. 📸",

  pedirComprobante: () =>
    "¿Tienes a la mano un comprobante de domicilio reciente? Si lo tienes, envíamelo y lo usaré para tu dirección. Si no, usaré la dirección de tu INE sin problema. 🏠",

  procesamdoDocumento: () =>
    "Perfecto, estoy verificando tu documento, dame un momento... ⏳",

  errorOCR: () =>
    "No pude leer correctamente el documento. ¿Podrías enviarme una foto más clara, con buena iluminación y sin reflejos? 🙏",

  confirmacionDatos: (datos) =>
    `He validado tus datos correctamente:\n\n` +
    `👤 *Nombre:* ${datos.nombre}\n` +
    `🏠 *Dirección:* ${datos.direccion}\n` +
    `🪪 *CURP/RFC:* ${datos.rfc}\n` +
    `📞 *Teléfono:* ${datos.telefono}\n` +
    `📧 *Correo:* ${datos.correo}\n\n` +
    `¿Es correcto para proceder con tu solicitud? Responde *Sí* para confirmar o *No* para corregir. ✅`,

  ventaConfirmada: () =>
    "¡Excelente! Tu solicitud ha sido registrada exitosamente. Un asesor de izzi se pondrá en contacto contigo muy pronto para coordinar la instalación. 🎉",

  datosIncorrectos: () =>
    "Entendido. Por favor dime qué dato necesitas corregir y te ayudo a actualizarlo. ✏️",

  botPausado: () =>
    "He notado que no has podido enviarnos el documento. He pausado este proceso y un asesor humano se comunicará contigo en breve para ayudarte a completar tu solicitud. 👨‍💼",

  alertaPausado: (lead) =>
    `⚠️ *ALERTA AGENTIA – Bot Pausado*\n\n` +
    `El lead *${lead.nombre ?? lead.telefono}* (ID: ${lead.id}) no envió su documento tras ${CONFIG.maxDocumentAttempts} intentos.\n` +
    `📞 Teléfono: ${lead.telefono}\n` +
    `🕐 ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}\n\n` +
    `Por favor contáctalo manualmente.`,

  alertaCierre: (lead, datos) =>
    `✅ *NUEVO CIERRE – izzi / Agentia*\n\n` +
    `👤 *Nombre:* ${datos.nombre}\n` +
    `🏠 *Dirección:* ${datos.direccion}\n` +
    `🪪 *CURP/RFC:* ${datos.rfc}\n` +
    `📞 *Teléfono:* ${datos.telefono ?? lead.telefono}\n` +
    `📧 *Correo:* ${datos.correo ?? lead.correo}\n` +
    `🆔 *Lead ID:* ${lead.id}\n` +
    `🕐 ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}\n\n` +
    `El cliente confirmó sus datos y fue movido a *Cerrado* en el pipeline.`,
};

// ─────────────────────────────────────────────
// 3. CAPA DE API – LEADS
// ─────────────────────────────────────────────

/**
 * Obtiene el estado actual del lead desde la API.
 * @param {string} leadId
 * @returns {Promise<object|null>}
 */
export async function getLeadStatus(leadId) {
  try {
    const res = await fetch(
      `${CONFIG.leadsApiBase}/api/leads/status?id=${encodeURIComponent(leadId)}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("[getLeadStatus] Error:", err.message);
    return null;
  }
}

/**
 * Actualiza campos del lead en la API.
 * @param {string} leadId
 * @param {object} payload  Ej: { estado_pipeline: "Cerrado", documento_identificacion: true }
 * @returns {Promise<boolean>}
 */
export async function updateLead(leadId, payload) {
  try {
    const res = await fetch(`${CONFIG.leadsApiBase}/api/leads/${encodeURIComponent(leadId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error("[updateLead] Error:", err.message);
    return false;
  }
}

// ─────────────────────────────────────────────
// 4. CAPA OCR – GEMINI
// ─────────────────────────────────────────────

/**
 * Extrae datos del documento usando Gemini OCR.
 * @param {string} imageBase64   Imagen en base64 (data URL o base64 crudo)
 * @param {"ine"|"comprobante"}  tipoDocumento
 * @returns {Promise<{nombre:string, direccion:string, rfc:string}|null>}
 */
export async function extractDocumentData(imageBase64, tipoDocumento = "ine") {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("[extractDocumentData] Falta GEMINI_API_KEY en el entorno.");
    return null;
  }

  // Limpia posible prefijo data:mime;base64,
  const base64Match = String(imageBase64 || "").match(/^data:[^;]+;base64,(.+)$/);
  const base64 = (base64Match ? base64Match[1] : imageBase64 || "").trim();

  const prompt =
    tipoDocumento === "ine"
      ? `Analiza esta imagen de una INE mexicana y extrae exclusivamente los siguientes campos en formato JSON sin texto adicional:
{
  "nombre": "<nombre completo como aparece en el documento>",
  "direccion": "<dirección completa: calle, número, colonia, municipio, estado, CP>",
  "rfc": "<RFC o CURP si aparece>",
  "vigente": <true|false según fecha de vigencia>
}
Si algún campo no está visible, usa null.`
      : `Analiza esta imagen de un comprobante de domicilio mexicano y extrae exclusivamente los siguientes campos en formato JSON sin texto adicional:
{
  "direccion": "<dirección completa: calle, número, colonia, municipio, estado, CP>",
  "fecha_emision": "<fecha del comprobante>"
}
Si algún campo no está visible, usa null.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelId = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
    const model = genAI.getGenerativeModel({ model: modelId });

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64,
        },
      },
    ]);

    const response = result.response;
    const texto = response?.text?.()?.trim() || "";
    if (!texto) return null;

    // Limpiar posibles backticks de markdown
    const limpio = texto.replace(/```json|```/g, "").trim();
    return JSON.parse(limpio);
  } catch (err) {
    console.error(
      "[extractDocumentData] Error OCR:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// 5. ENVÍO DE ALERTAS POR WHATSAPP
// ─────────────────────────────────────────────

/**
 * Envía un mensaje de alerta al número configurado en ALERT_WHATSAPP_NUMBER.
 * @param {string} mensaje
 * @returns {Promise<boolean>}
 */
export async function sendAlert(mensaje) {
  if (!CONFIG.alertWhatsapp || !CONFIG.whatsappSendUrl) {
    console.warn("[sendAlert] ALERT_WHATSAPP_NUMBER o WHATSAPP_SEND_URL no configurados.");
    return false;
  }
  try {
    const res = await fetch(CONFIG.whatsappSendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONFIG.whatsappToken}`,
      },
      body: JSON.stringify({
        to: CONFIG.alertWhatsapp,
        type: "text",
        text: { body: mensaje },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error("[sendAlert] Error al enviar alerta WA:", err.message);
    return false;
  }
}

// ─────────────────────────────────────────────
// 6. FLUJO PRINCIPAL DE CIERRE DE VENTA
// ─────────────────────────────────────────────

/**
 * Estado en memoria por sesión (reemplazar por Redis/DB en producción).
 * Clave: leadId  →  Valor: { intentosDocumento, datosOCR, esperandoConfirmacion }
 */
const sessionState = new Map();

function getSession(leadId) {
  if (!sessionState.has(leadId)) {
    sessionState.set(leadId, {
      intentosDocumento:     0,
      datosOCR:              null,
      esperandoConfirmacion: false,
      comprobantePendiente:  false,
    });
  }
  return sessionState.get(leadId);
}

function clearSession(leadId) {
  sessionState.delete(leadId);
}

// ─────────────────────────────────────────────
// 6A. PASO 1 – SOLICITAR DOCUMENTO (con validación anti-bucle)
// ─────────────────────────────────────────────

/**
 * Decide si debe pedir el documento o si ya fue entregado previamente.
 * @param {string} leadId
 * @returns {Promise<{accion: "ya_tiene"|"pedir"|"pausar", mensaje: string|null}>}
 */
export async function handleDocumentRequest(leadId) {
  // 1. Consultar estado real del lead en la API
  const leadStatus = await getLeadStatus(leadId);

  // 2. Si el documento ya está registrado → NO pedir de nuevo (anti-bucle)
  if (leadStatus?.documento_identificacion === true) {
    return { accion: "ya_tiene", mensaje: null };
  }

  const session = getSession(leadId);
  session.intentosDocumento += 1;

  // 3. Si superó el máximo de intentos → pausar y alertar
  if (session.intentosDocumento > CONFIG.maxDocumentAttempts) {
    await updateLead(leadId, { estado_pipeline: "Caliente" });
    await sendAlert(MESSAGES.alertaPausado(leadStatus ?? { id: leadId, telefono: "N/D", nombre: "N/D" }));
    clearSession(leadId);
    return { accion: "pausar", mensaje: MESSAGES.botPausado() };
  }

  // 4. Pedir el documento (intento 1 o 2)
  await updateLead(leadId, { estado_pipeline: "Caliente" });
  return {
    accion: "pedir",
    mensaje: MESSAGES.pedirDocumento(session.intentosDocumento),
  };
}

// ─────────────────────────────────────────────
// 6B. PASO 2 – PROCESAR IMAGEN RECIBIDA (OCR con Gemini)
// ─────────────────────────────────────────────

/**
 * Procesa una imagen enviada por el cliente.
 * Detecta si es INE o comprobante y extrae los datos relevantes.
 *
 * Reglas de dirección:
 *   - Si solo hay INE        → usar dirección del INE
 *   - Si hay comprobante     → usar dirección del comprobante (INE solo aporta nombre y RFC)
 *
 * @param {string}  leadId
 * @param {string}  imageBase64
 * @param {"ine"|"comprobante"} tipoDocumento
 * @param {object}  leadData    Datos base del lead (telefono, correo, etc.)
 * @returns {Promise<{accion: "ocr_ok"|"ocr_error"|"pedir_comprobante", mensaje: string}>}
 */
export async function handleImageReceived(leadId, imageBase64, tipoDocumento = "ine", leadData = {}) {
  const session = getSession(leadId);

  // Notificar que se está procesando
  // (el caller debe enviar este mensaje antes de await)
  const procesando = MESSAGES.procesamdoDocumento();

  const datosExtraidos = await extractDocumentData(imageBase64, tipoDocumento);

  if (!datosExtraidos) {
    return { accion: "ocr_error", mensaje: MESSAGES.errorOCR() };
  }

  if (tipoDocumento === "ine") {
    // Guardar datos del INE en sesión
    session.datosOCR = {
      nombre:    datosExtraidos.nombre    ?? leadData.nombre    ?? "No disponible",
      direccion: datosExtraidos.direccion ?? leadData.direccion ?? "No disponible",
      rfc:       datosExtraidos.rfc       ?? leadData.rfc       ?? "No disponible",
      telefono:  leadData.telefono        ?? "No disponible",
      correo:    leadData.correo          ?? "No disponible",
      fuenteDireccion: "INE",
    };

    // Marcar documento recibido en la API
    await updateLead(leadId, {
      documento_identificacion: true,
      estado_pipeline: "Caliente",
      nombre_ocr:    session.datosOCR.nombre,
      direccion_ocr: session.datosOCR.direccion,
      rfc_ocr:       session.datosOCR.rfc,
    });

    // Nuevo flujo simplificado:
    // Ya NO pedimos comprobante en automático para evitar bucles.
    // Pasamos directo a confirmación de datos con lo extraído del INE
    // y los datos que tengamos del lead (teléfono/correo).
    session.comprobantePendiente = false;
    return await requestConfirmation(leadId, leadData);
  }

  if (tipoDocumento === "comprobante") {
    // Comprobante recibido: actualizar SOLO la dirección, mantener nombre y RFC del INE
    if (session.datosOCR) {
      session.datosOCR.direccion      = datosExtraidos.direccion ?? session.datosOCR.direccion;
      session.datosOCR.fuenteDireccion = "Comprobante";
    }
    session.comprobantePendiente = false;

    await updateLead(leadId, {
      direccion_ocr: session.datosOCR?.direccion,
    });

    // Pasar directo a confirmación
    return await requestConfirmation(leadId, leadData);
  }

  return { accion: "ocr_error", mensaje: MESSAGES.errorOCR() };
}

// ─────────────────────────────────────────────
// 6C. PASO 3 – CLIENTE OMITE COMPROBANTE (usa dirección del INE)
// ─────────────────────────────────────────────

/**
 * Llamar cuando el cliente indica que NO tiene comprobante o no lo envía.
 * Procede con la dirección del INE.
 * @param {string} leadId
 * @param {object} leadData
 * @returns {Promise<{accion: string, mensaje: string}>}
 */
export async function handleNoComprobante(leadId, leadData = {}) {
  const session = getSession(leadId);
  session.comprobantePendiente = false;
  // La dirección del INE ya está en session.datosOCR, no se modifica
  return await requestConfirmation(leadId, leadData);
}

// ─────────────────────────────────────────────
// 6D. PASO 4 – ENVIAR MENSAJE DE CONFIRMACIÓN AL CLIENTE
// ─────────────────────────────────────────────

/**
 * Genera y envía el mensaje de confirmación de datos al cliente.
 * @param {string} leadId
 * @param {object} leadData
 * @returns {Promise<{accion: "confirmar", mensaje: string}>}
 */
async function requestConfirmation(leadId, leadData = {}) {
  const session = getSession(leadId);

  const datos = {
    nombre:    session.datosOCR?.nombre    ?? leadData.nombre    ?? "No disponible",
    direccion: session.datosOCR?.direccion ?? leadData.direccion ?? "No disponible",
    rfc:       session.datosOCR?.rfc       ?? leadData.rfc       ?? "No disponible",
    telefono:  leadData.telefono           ?? session.datosOCR?.telefono ?? "No disponible",
    correo:    leadData.correo             ?? session.datosOCR?.correo   ?? "No disponible",
  };

  session.esperandoConfirmacion = true;
  session.datosParaConfirmar    = datos;

  await updateLead(leadId, { estado_pipeline: "Caliente" });

  return {
    accion:  "confirmar",
    mensaje: MESSAGES.confirmacionDatos(datos),
  };
}

// ─────────────────────────────────────────────
// 6E. PASO 5 – PROCESAR RESPUESTA DE CONFIRMACIÓN
// ─────────────────────────────────────────────

/**
 * Procesa la respuesta del cliente al mensaje de confirmación.
 * Si dice "Sí" → mueve a Cierres y alerta al número configurado.
 * Si dice "No" → permite corrección.
 *
 * @param {string}  leadId
 * @param {string}  respuestaCliente   Texto enviado por el cliente
 * @param {object}  leadData
 * @returns {Promise<{accion: "cierre"|"correccion"|"no_aplica", mensaje: string}>}
 */
export async function handleConfirmationResponse(leadId, respuestaCliente, leadData = {}) {
  const session = getSession(leadId);

  if (!session.esperandoConfirmacion) {
    return { accion: "no_aplica", mensaje: null };
  }

  const texto = respuestaCliente.trim().toLowerCase();
  const esConfirmacion = /^(s[ií]|yes|si|correcto|confirmo|ok|dale|adelante|así es|exacto)$/i.test(texto);
  const esRechazo      = /^(no|incorrecto|error|mal|equivocado|cambiar|corregir)$/i.test(texto);

  if (esConfirmacion) {
    // ── CIERRE DE VENTA → columna "Cerrado" ────────────
    const datos = session.datosParaConfirmar;
    const lead  = { id: leadId, ...leadData };

    // 1. Actualizar pipeline → Cerrado
    await updateLead(leadId, {
      estado_pipeline:           "Cerrado",
      fecha_cierre:              new Date().toISOString(),
      nombre_confirmado:         datos.nombre,
      direccion_confirmada:      datos.direccion,
      rfc_confirmado:            datos.rfc,
    });

    // 2. Enviar alerta de cierre al número configurado
    await sendAlert(MESSAGES.alertaCierre(lead, datos));

    // 3. Limpiar sesión
    clearSession(leadId);

    return { accion: "cierre", mensaje: MESSAGES.ventaConfirmada() };
  }

  if (esRechazo) {
    // ── CORRECCIÓN DE DATOS ──────────────────────────
    session.esperandoConfirmacion = false;
    await updateLead(leadId, { estado_pipeline: "Tibio" });
    return { accion: "correccion", mensaje: MESSAGES.datosIncorrectos() };
  }

  // Respuesta ambigua → re-preguntar
  return {
    accion:  "confirmar",
    mensaje: `No entendí tu respuesta. Por favor responde *Sí* para confirmar o *No* para corregir. 🙏\n\n${MESSAGES.confirmacionDatos(session.datosParaConfirmar)}`,
  };
}

// ─────────────────────────────────────────────
// 6F. CANCELAR LEAD (cliente pierde el interés)
// ─────────────────────────────────────────────

/**
 * Mueve el lead a la columna "Cancelado" cuando el cliente ya no se interesa.
 * Limpia la sesión activa y notifica al número de alerta.
 * @param {string} leadId
 * @param {object} leadData  { nombre, telefono }
 * @param {string} [motivo]  Razón de cancelación (opcional, para el registro)
 * @returns {Promise<{accion: "cancelado", mensaje: string}>}
 */
export async function cancelLead(leadId, leadData = {}, motivo = "Sin motivo especificado") {
  await updateLead(leadId, {
    estado_pipeline: "Cancelado",
    motivo_cancelacion: motivo,
    fecha_cancelacion:  new Date().toISOString(),
  });

  await sendAlert(
    `❌ *LEAD CANCELADO – izzi / Agentia*\n\n` +
    `👤 *Lead:* ${leadData.nombre ?? leadData.telefono ?? leadId}\n` +
    `📞 *Teléfono:* ${leadData.telefono ?? "N/D"}\n` +
    `💬 *Motivo:* ${motivo}\n` +
    `🕐 ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`
  );

  clearSession(leadId);

  return {
    accion:  "cancelado",
    mensaje: "Entendido, no hay problema. Si en algún momento deseas conocer nuestros servicios izzi, con gusto te atendemos. ¡Que tengas un excelente día! 😊",
  };
}

// ─────────────────────────────────────────────
// 7. ORQUESTADOR PRINCIPAL
//    Punto de entrada único para el bridge/webhook
// ─────────────────────────────────────────────

/**
 * Orquesta todo el flujo de cierre según el tipo de evento entrante.
 *
 * @param {object} evento
 * @param {string}  evento.tipo
 *   "solicitar_documento" | "imagen_recibida" | "no_comprobante" | "confirmacion"
 * @param {string}  evento.leadId
 * @param {string}  [evento.imageBase64]
 * @param {"ine"|"comprobante"} [evento.tipoDocumento]
 * @param {string}  [evento.respuestaCliente]
 * @param {object}  [evento.leadData]   { nombre, telefono, correo, direccion, rfc }
 *
 * @returns {Promise<{accion: string, mensaje: string|null}>}
 */
export async function orchestrateSaleClosure(evento) {
  const { tipo, leadId, imageBase64, tipoDocumento, respuestaCliente, leadData = {} } = evento;

  if (!leadId) {
    console.error("[orchestrateSaleClosure] leadId es requerido.");
    return { accion: "error", mensaje: null };
  }

  switch (tipo) {
    case "solicitar_documento":
      return await handleDocumentRequest(leadId);

    case "imagen_recibida":
      if (!imageBase64) return { accion: "ocr_error", mensaje: MESSAGES.errorOCR() };
      return await handleImageReceived(leadId, imageBase64, tipoDocumento ?? "ine", leadData);

    case "no_comprobante":
      return await handleNoComprobante(leadId, leadData);

    case "confirmacion":
      if (!respuestaCliente) return { accion: "no_aplica", mensaje: null };
      return await handleConfirmationResponse(leadId, respuestaCliente, leadData);

    case "cancelar":
      return await cancelLead(leadId, leadData, evento.motivo);

    default:
      console.warn("[orchestrateSaleClosure] Tipo de evento desconocido:", tipo);
      return { accion: "desconocido", mensaje: null };
  }
}

// ─────────────────────────────────────────────
// 8. EJEMPLO DE USO EN EL BRIDGE / WEBHOOK
// ─────────────────────────────────────────────
/*

// ── En tu webhook de WhatsApp ─────────────────

import { orchestrateSaleClosure } from "@/lib/sale-closure-flow";

app.post("/webhook/whatsapp", async (req, res) => {
  const { leadId, mensaje, mediaBase64, mediaType, leadData } = req.body;

  let resultado;

  // ① Cliente envía una imagen
  if (mediaBase64) {
    const tipoDoc = detectarTipoDocumento(mediaType, mensaje); // "ine" | "comprobante"
    resultado = await orchestrateSaleClosure({
      tipo:          "imagen_recibida",
      leadId,
      imageBase64:   mediaBase64,
      tipoDocumento: tipoDoc,
      leadData,
    });
  }

  // ② Cliente responde Sí/No a la confirmación
  else if (estaEnConfirmacion(leadId)) {
    resultado = await orchestrateSaleClosure({
      tipo:             "confirmacion",
      leadId,
      respuestaCliente: mensaje,
      leadData,
    });
  }

  // ③ Cliente indica que no tiene comprobante
  else if (/no tengo|no cuento|sin comprobante/i.test(mensaje)) {
    resultado = await orchestrateSaleClosure({
      tipo:     "no_comprobante",
      leadId,
      leadData,
    });
  }

  // ④ Bot solicita documento al iniciar cierre
  else {
    resultado = await orchestrateSaleClosure({
      tipo:   "solicitar_documento",
      leadId,
      leadData,
    });
  }

  if (resultado.mensaje) {
    await enviarMensajeWA(leadData.telefono, resultado.mensaje);
  }

  res.json({ ok: true, accion: resultado.accion });
});

*/

export default {
  orchestrateSaleClosure,
  handleDocumentRequest,
  handleImageReceived,
  handleNoComprobante,
  handleConfirmationResponse,
  cancelLead,
  extractDocumentData,
  sendAlert,
  getLeadStatus,
  updateLead,
  PIPELINE_STATES,
  MESSAGES,
  CONFIG,
};
