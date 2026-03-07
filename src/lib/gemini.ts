import { GoogleGenerativeAI } from '@google/generative-ai';

export type GeminiMessage = { role: 'user' | 'assistant'; content: string };

export async function generateGeminiReply(params: {
  userMessage: string;
  systemInstruction: string;
  modelId?: string;
  messages?: GeminiMessage[];
}): Promise<string> {
  const envModel = process.env.GEMINI_MODEL?.trim();
  const {
    userMessage,
    systemInstruction,
    modelId = envModel || 'gemini-2.5-flash',
    messages = [],
  } = params;

  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    throw new Error(
      'Falta GEMINI_API_KEY o GOOGLE_GENERATIVE_AI_API_KEY en .env.local. Reinicia el servidor (npx next dev -p 3010) después de configurarla.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });

  const parts: string[] = [
    `[Instrucción del sistema]\n${systemInstruction}\n\n[Conversación]`,
  ];
  for (const m of messages) {
    parts.push(`${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`);
  }
  parts.push(`Usuario: ${userMessage}`);
  parts.push('Asistente:');

  const prompt = parts.join('\n');
  const result = await model.generateContent(prompt);
  const response = result.response;
  if (!response) {
    throw new Error('Gemini no devolvió respuesta.');
  }
  const text = await response.text();
  return text ?? '';
}
