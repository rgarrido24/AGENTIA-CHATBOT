import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const OCR_PROMPT = `Analiza esta imagen de un ticket de báscula InBody.
Extrae los valores numéricos de:
- Peso corporal (kg)
- Porcentaje de grasa corporal (%)
- Masa muscular esquelética (kg)
- Nivel de grasa visceral (número del 1 al 20)
- Porcentaje de agua corporal (%)
- Edad metabólica (años)
- IMC

Responde SOLO en JSON:
{
  "peso": 71.5,
  "grasaCorporal": 33.8,
  "masaMuscular": 36.1,
  "grasaVisceral": 9,
  "aguaCorporal": 52.3,
  "edadMetabolica": 37,
  "IMC": 26.4,
  "confianza": "alta"
}
Si no puedes leer algún valor, usa null para ese campo.`;

function cleanBase64(data: string): string {
  const match = data.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1]!.trim() : data.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : '';
    const mimeType = typeof body?.mimeType === 'string' ? body.mimeType : 'image/jpeg';

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 requerido' }, { status: 400 });
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''
    ).trim();
    if (!apiKey) {
      return Response.json({ error: 'Falta GEMINI_API_KEY en el servidor.' }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const base64 = cleanBase64(imageBase64);

    const result = await model.generateContent([
      { text: OCR_PROMPT },
      { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64 } },
    ]);

    const text = result.response.text()?.trim() ?? '';
    const raw = text.replace(/```json\n?|\n?```/g, '').trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return Response.json({ error: 'No se pudo interpretar la respuesta' }, { status: 422 });
      }
      parsed = JSON.parse(match[0]) as Record<string, unknown>;
    }

    return Response.json({
      peso: parsed.peso ?? null,
      grasaCorporal: parsed.grasaCorporal ?? null,
      masaMuscular: parsed.masaMuscular ?? null,
      grasaVisceral: parsed.grasaVisceral ?? null,
      aguaCorporal: parsed.aguaCorporal ?? null,
      edadMetabolica: parsed.edadMetabolica ?? null,
      IMC: parsed.IMC ?? null,
      confianza: parsed.confianza ?? null,
    });
  } catch (e) {
    console.error('[api/demo/nutricion/ocr]', e);
    return Response.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
