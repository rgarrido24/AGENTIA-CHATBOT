// CSPlug REST API client
// Docs: https://docs.csfacturacion.com/emision/csplug/

import { CSPlugEmitirResponse, CSPlugConsultarResponse } from './types';

const CSPLUG_BASE_URL = 'https://www.csfacturacion.com/webservices/cfdi40';

function getCredentials() {
  const user = process.env.CSPLUG_USER;
  const pass = process.env.CSPLUG_PASSWORD;
  if (!user || !pass) {
    throw new Error('CSPlug: faltan CSPLUG_USER o CSPLUG_PASSWORD en variables de entorno');
  }
  return { user, pass };
}

function buildAuthParams(user: string, pass: string) {
  return {
    usuario: user,
    contrasenia: pass,
  };
}

// ─── Emitir CFDI ──────────────────────────────────────────────────────────────

export async function csplugEmitir(payload: object): Promise<CSPlugEmitirResponse> {
  const { user, pass } = getCredentials();

  const body = {
    ...buildAuthParams(user, pass),
    ...payload,
  };

  const res = await fetch(`${CSPLUG_BASE_URL}/emision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CSPlug HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();

  // Normalizar respuesta de CSPlug al formato interno
  if (data.estatus === 'EXITO' || data.status === 'success') {
    return {
      status: 'success',
      uuid: data.UUID || data.uuid,
      folio: data.folio,
      serie: data.serie,
      fechaTimbrado: data.fechaTimbrado || data.fecha,
      xmlUrl: data.urlXML || data.xmlUrl,
      pdfUrl: data.urlPDF || data.pdfUrl,
      cfdiSellado: data.cfdiSellado,
    };
  }

  return {
    status: 'error',
    error: data.mensaje || data.error || 'Error desconocido en CSPlug',
    detalleError: JSON.stringify(data),
  };
}

// ─── Consultar CFDI por UUID ──────────────────────────────────────────────────

export async function csplugConsultar(uuid: string): Promise<CSPlugConsultarResponse> {
  const { user, pass } = getCredentials();

  const res = await fetch(`${CSPLUG_BASE_URL}/consulta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildAuthParams(user, pass),
      uuid,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CSPlug consulta HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();

  return {
    status: 'success',
    uuid,
    estado: data.estado || 'vigente',
    xmlUrl: data.urlXML || data.xmlUrl,
    pdfUrl: data.urlPDF || data.pdfUrl,
  };
}

// ─── Cancelar CFDI ───────────────────────────────────────────────────────────

export async function csplugCancelar(
  uuid: string,
  motivo: '01' | '02' | '03' | '04' = '02',
  uuidSustitucion?: string
): Promise<{ status: 'success' | 'error'; mensaje?: string }> {
  const { user, pass } = getCredentials();

  const body: Record<string, string> = {
    ...buildAuthParams(user, pass),
    uuid,
    motivo,
    // Motivos: 01=comprobante emitido con errores con relación
    //          02=comprobante emitido con errores sin relación
    //          03=no se llevó a cabo la operación
    //          04=operación nominativa relacionada en la factura global
  };

  if (motivo === '01' && uuidSustitucion) {
    body.folioSustitucion = uuidSustitucion;
  }

  const res = await fetch(`${CSPLUG_BASE_URL}/cancelacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CSPlug cancelación HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();

  return {
    status: data.estatus === 'EXITO' ? 'success' : 'error',
    mensaje: data.mensaje,
  };
}
