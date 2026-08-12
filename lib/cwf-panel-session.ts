const KEY_CONV = 'cwf-panel:v1:conversaciones';
const KEY_COTIZACION = 'cwf-panel:v1:cotizacion-draft';

export type CwfConversacionesSession = {
  selectedId: string | null;
  replyText: string;
};

export type CwfClienteFormSession = {
  nombre: string;
  negocio: string;
  direccion: string;
  ciudad: string;
  cp: string;
  whatsapp: string;
  rfc: string;
};

export type CwfProductoRowSession = {
  id: string;
  presentacion: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
};

export type CwfCotizacionDraftSession = {
  cliente: CwfClienteFormSession;
  productos: CwfProductoRowSession[];
  envio: number;
  precioEspecial: boolean;
  notas: string;
  showNotas: boolean;
};

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function loadCwfConversacionesSession(): CwfConversacionesSession {
  return readJson<CwfConversacionesSession>(KEY_CONV) ?? { selectedId: null, replyText: '' };
}

export function saveCwfConversacionesSession(data: CwfConversacionesSession) {
  writeJson(KEY_CONV, data);
}

export function loadCwfCotizacionDraft(): CwfCotizacionDraftSession | null {
  return readJson<CwfCotizacionDraftSession>(KEY_COTIZACION);
}

export function saveCwfCotizacionDraft(data: CwfCotizacionDraftSession) {
  writeJson(KEY_COTIZACION, data);
}
