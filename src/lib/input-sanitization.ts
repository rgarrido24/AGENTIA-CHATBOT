/**
 * CAPA 1: El Cadenero - Filtro de entrada anti prompt-injection.
 * Bloquea intentos de manipular o extraer instrucciones del sistema.
 */

const FORBIDDEN_PHRASES = [
  'ignora todas las instrucciones',
  'ignore all instructions',
  'ignore previous instructions',
  'system prompt',
  'systemprompt',
  'dame tu código',
  'muéstrame tu código',
  'show me your code',
  'instrucciones iniciales',
  'initial instructions',
  'developer mode',
  'modo desarrollador',
  'prompt original',
  'original prompt',
  'actúa como',
  'actua como',
  'act as',
  'olvida lo anterior',
  'forget everything',
  'forget the above',
  'disregard your',
  'bypass your',
  'jailbreak',
  'dan mode',
  'reveal your instructions',
  'revela tus instrucciones',
  'what are your instructions',
  'cuáles son tus instrucciones',
  'repeat the words above',
  'repite las palabras anteriores',
  'you are now',
  'ahora eres',
  'pretend you are',
  'finge que eres',
  'new instructions:',
  'nuevas instrucciones:',
  'output your system',
  'imprime tu sistema',
  'print your prompt',
  'dame tu prompt',
  'show your prompt',
  'reveal prompt',
  'leak your',
  'filtra tu',
  'output as json',
  'responde en json',
  'output everything above',
  'responde todo lo anterior',
];

const SAFE_REPLY =
  'Soy un asistente de ventas, solo estoy aquí para ayudarte a encontrar el mejor paquete. ¿Qué servicio buscas?';

/**
 * Detecta intentos de prompt injection en el mensaje del usuario.
 * @returns true si el mensaje es sospechoso y debe bloquearse
 */
export function isPromptInjectionAttempt(message: string): boolean {
  const normalized = (message || '').toLowerCase().trim();
  if (!normalized) return false;

  for (const phrase of FORBIDDEN_PHRASES) {
    if (normalized.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Obtiene la respuesta segura estándar cuando se detecta un intento de inyección.
 */
export function getSafeReply(): string {
  return SAFE_REPLY;
}
