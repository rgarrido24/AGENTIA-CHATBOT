import { GoogleGenerativeAI } from '@google/generative-ai';

const OCR_PROMPT = `Extrae los siguientes datos de la imagen (INE, comprobante de domicilio o documentos similares).

REGLA CRITICA: Extrae UNICAMENTE el texto que sea visible y legible en la imagen. ESTA ESTRICTAMENTE PROHIBIDO inventar, deducir o autocompletar direcciones, nombres o numeros. Si un dato no esta claro o no aparece, usa "NO_LEIBLE" para ese campo.

INSTRUCCIONES ESTRICTAS:
- Nombre Completo: TODO EN MAYUSCULAS Y SIN ACENTOS (ej: JOSE MARIA LOPEZ GARCIA). Solo lo que este escrito en el documento.
- CURP: exactamente como aparece, sin modificar.
- Direccion: usa la del comprobante si hay, si no la del INE. TODO EN MAYUSCULAS Y SIN ACENTOS. Solo lo que este escrito.
- Correo electronico: en minusculas. Solo si aparece en la imagen.
- Telefono: solo si aparece en la imagen; si no, usa "NO_LEIBLE" (el tecnico lo tomara del numero desde el que escribe)

Responde UNICAMENTE en formato JSON valido, sin markdown ni texto extra:
{"nombre":"NOMBRE EN MAYUSCULAS","curp":"CURP","direccion":"DIRECCION EN MAYUSCULAS","telefono":"NUMERO O NO_LEIBLE","correo":"correo@ejemplo.com"}

Si no puedes leer algun dato o no aparece en la imagen, usa "NO_LEIBLE" para ese campo. NUNCA inventes datos.`;

function getApiKey(): string {
  const value = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!value) throw new Error('Falta GEMINI_API_KEY');
  return value;
}

export type ExtractedDocData = {
  nombre: string;
  curp: string;
  direccion: string;
  telefono: string;
  correo: string;
  paquete: string;
  promocion: string;
};

/** Quita prefijo data:...;base64, si existe (Gemini espera base64 crudo) */
function cleanBase64(data: string): string {
  const match = data.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1].trim() : data.trim();
}

export async function extractDocDataFromImage(
  mediaBase64: string,
  mimeType: string,
  _userPhone?: string
): Promise<ExtractedDocData> {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const base64 = cleanBase64(mediaBase64);

  console.log('[OCR] imageBase64 length:', mediaBase64?.length, 'mimeType:', mimeType);

  const result = await model.generateContent([
    {
      text: `${OCR_PROMPT}\n\nSi el telefono NO aparece en la imagen, usa "NO_LEIBLE". No inventes numeros.`,
    },
    {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: base64,
      },
    },
  ]);

  const response = result.response;
  const text = response.text?.()?.trim() || '';

  console.log('[OCR] respuesta Gemini (primeros 500 chars):', text.slice(0, 500));

  const raw = text.replace(/```json\n?|\n?```/g, '').trim();
  try {
    let parsed: Record<string, string>;
    try {
      // Intento directo
      parsed = JSON.parse(raw) as Record<string, string>;
    } catch (e) {
      // Gemini a veces devuelve texto extra alrededor del JSON; intentamos extraer solo el bloque { ... }
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw e;
      parsed = JSON.parse(match[0]) as Record<string, string>;
    }
    const toUpper = (s: string) => (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const telefonoRaw = (parsed.telefono || '').trim();
    const telefono = telefonoRaw && telefonoRaw !== 'NO_LEIBLE'
      ? telefonoRaw
      : 'NO_LEIBLE';
    return {
      nombre: toUpper(parsed.nombre || 'NO_LEIBLE'),
      curp: (parsed.curp || 'NO_LEIBLE').toUpperCase(),
      direccion: toUpper(parsed.direccion || 'NO_LEIBLE'),
      telefono,
      correo: (parsed.correo || 'NO_LEIBLE').toLowerCase(),
      paquete: 'NO_ESPECIFICADO',
      promocion: 'N/A',
    };
  } catch {
    return {
      nombre: 'NO_LEIBLE',
      curp: 'NO_LEIBLE',
      direccion: 'NO_LEIBLE',
      telefono: 'NO_LEIBLE',
      correo: 'NO_LEIBLE',
      paquete: 'NO_ESPECIFICADO',
      promocion: 'N/A',
    };
  }
}

export function formatConfirmationMessage(data: ExtractedDocData): string {
  return `📝 Por favor, revisa que todo esté perfecto:

NOMBRE: ${data.nombre}
CURP: ${data.curp}
DIRECCIÓN: ${data.direccion}
TELÉFONO: ${data.telefono}
CORREO: ${data.correo}

PAQUETE: ${data.paquete}
PROMOCIÓN: ${data.promocion}

¿Son correctos tus datos y el paquete que estás contratando? (Responde Sí o No)`;
}

export const CONFIRMATION_SUCCESS_REPLY =
  '¡Excelente! Para agendar tu instalación, ¿cuál es tu preferencia de fecha y hora? Normalmente instalamos de un día para otro con horarios matutinos de 9 a 2 y vespertino de 2 a 6.';

export const PARTIAL_DOCUMENT_REPLY =
  '¡Gracias! Recibí una parte de tu documento. Por favor, envíame la parte que falta (frente o reverso) o el comprobante de domicilio si aún no lo mandas.';

/** Cuando tenemos nombre y CURP del frente del INE pero faltan reverso, comprobante, teléfono y correo. */
export const RECOLLECTION_INCOMPLETE_REPLY =
  '¡Perfecto! Ya registré la parte frontal de tu identificación. Para armar tu expediente completo, por favor envíame: 1) El reverso de tu INE o comprobante de domicilio. 2) Un número de teléfono de contacto. 3) Tu correo electrónico.';

/** Genera mensaje mostrando datos extraídos del INE y pidiendo lo que falta (teléfono/correo). */
export function formatContactRequestMessage(data: ExtractedDocData): string {
  const ok = (s: string) => s && s !== 'NO_LEIBLE';
  const lines: string[] = ['✅ Leí los siguientes datos de tu credencial:\n'];
  if (ok(data.nombre))    lines.push(`• NOMBRE: ${data.nombre}`);
  if (ok(data.curp))      lines.push(`• CURP: ${data.curp}`);
  if (ok(data.direccion)) lines.push(`• DIRECCIÓN: ${data.direccion}`);
  const needsTel    = !ok(data.telefono);
  const needsCorreo = !ok(data.correo) || /no_leible|pendiente\.com/i.test(data.correo);
  const missing: string[] = [];
  if (needsTel)    missing.push('número de teléfono de contacto');
  if (needsCorreo) missing.push('correo electrónico');
  lines.push(`\nPara completar tu expediente, ¿me compartes tu ${missing.join(' y ')}?`);
  return lines.join('\n');
}

export const REQUEST_CONTACT_REPLY =
  '¡Perfecto! Ya leí tus datos de la credencial. Para terminar de armar tu expediente, ¿me compartes tu número de contacto y correo electrónico?';

export const REQUEST_PACKAGE_REPLY =
  '¡Excelente! Ya tengo tus datos. ¿Qué paquete deseas contratar? (ej: izzi 60, izzi 80, izzi 80 + TV)';

/** Combina datos extraídos de múltiples imágenes. Prefiere valores válidos.
 *
 * Reglas de merge:
 * - nombre y curp: se protegen una vez que hay un valor válido del INE (existente).
 *   El comprobante de domicilio suele estar a nombre de otra persona; NUNCA pisamos el nombre del INE.
 * - direccion: el dato ENTRANTE (comprobante) tiene prioridad sobre el INE si es válido.
 * - telefono, correo, paquete, promocion: prefiere el dato entrante si es válido.
 */
export function mergeExtractedData(
  existing: ExtractedDocData | null,
  incoming: ExtractedDocData
): ExtractedDocData {
  const docPlaceholders = ['NO_LEIBLE', ''];
  const pkgPlaceholders = ['NO_ESPECIFICADO', 'N/A', ''];
  const isPh = (s: string, placeholders: string[]) =>
    !s || placeholders.some((p) => s === p || s.toUpperCase() === p);

  // Campos de identidad (INE): se protegen — el existente tiene prioridad
  const pickProtected = (a: string, b: string) => {
    const av = (a || '').trim();
    const bv = (b || '').trim();
    if (av && !isPh(av, docPlaceholders)) return av;
    if (bv && !isPh(bv, docPlaceholders)) return bv;
    return av || bv || docPlaceholders[0];
  };

  // Dirección: el entrante (comprobante) tiene prioridad sobre el INE
  const pickAddress = (a: string, b: string) => {
    const av = (a || '').trim();
    const bv = (b || '').trim();
    if (bv && !isPh(bv, docPlaceholders)) return bv;
    if (av && !isPh(av, docPlaceholders)) return av;
    return bv || av || docPlaceholders[0];
  };

  // Campos de contacto/paquete: prefiere el entrante
  const pick = (a: string, b: string, placeholders: string[]) => {
    const av = (a || '').trim();
    const bv = (b || '').trim();
    if (bv && !isPh(bv, placeholders)) return bv;
    if (av && !isPh(av, placeholders)) return av;
    return bv || av || (placeholders[0] ?? '');
  };

  const base = existing ?? incoming;
  return {
    nombre:   pickProtected(base.nombre, incoming.nombre),
    curp:     pickProtected(base.curp, incoming.curp),
    direccion: pickAddress(base.direccion, incoming.direccion),
    telefono: pick(base.telefono, incoming.telefono, docPlaceholders),
    correo:   pick(base.correo, incoming.correo, docPlaceholders),
    paquete:  pick(base.paquete ?? 'NO_ESPECIFICADO', incoming.paquete ?? 'NO_ESPECIFICADO', pkgPlaceholders),
    promocion: pick(base.promocion ?? 'N/A', incoming.promocion ?? 'N/A', pkgPlaceholders),
  };
}

/** Verifica si tenemos al menos nombre y CURP (ej. del frente del INE). */
export function hasNameAndCURP(data: ExtractedDocData): boolean {
  const ok = (s: string) => !!(s && s.trim() && s !== 'NO_LEIBLE');
  return ok(data.nombre) && ok(data.curp);
}

/** Verifica si tenemos los datos del documento (nombre, curp, direccion) para no pedir más páginas. */
export function hasCompleteDocData(data: ExtractedDocData): boolean {
  const ok = (s: string) => !!(s && s.trim() && s !== 'NO_LEIBLE');
  return ok(data.nombre) && ok(data.curp) && ok(data.direccion);
}

/** Verifica si tenemos las 5 variables del documento + contacto para pedir paquete. */
export function hasAllFiveDocData(data: ExtractedDocData): boolean {
  const ok = (s: string) => !!(s && s.trim() && s !== 'NO_LEIBLE');
  const correoOk = ok(data.correo) && !/no_leible|pendiente\.com/i.test(data.correo);
  return ok(data.nombre) && ok(data.curp) && ok(data.direccion) && ok(data.telefono) && correoOk;
}

/** Verifica si tenemos las 6 piezas completas (incl. paquete) para la confirmación final. */
export function hasCompleteExpedient(data: ExtractedDocData): boolean {
  const ok = (s: string) => !!(s && s.trim() && s !== 'NO_LEIBLE');
  const correoOk = ok(data.correo) && !/no_leible|pendiente\.com/i.test(data.correo);
  const paqueteOk = !!(data.paquete && data.paquete.trim() && data.paquete !== 'NO_ESPECIFICADO');
  return hasAllFiveDocData(data) && paqueteOk;
}
