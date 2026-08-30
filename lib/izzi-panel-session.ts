const KEY_CONV = 'izzi-panel:v1:conversaciones';

export type IzziConversacionesSession = {
  selectedId: string | null;
  replyText: string;
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

export function loadIzziConversacionesSession(): IzziConversacionesSession {
  return readJson<IzziConversacionesSession>(KEY_CONV) ?? { selectedId: null, replyText: '' };
}

export function saveIzziConversacionesSession(data: IzziConversacionesSession) {
  writeJson(KEY_CONV, data);
}
