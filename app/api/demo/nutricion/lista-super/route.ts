import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  MOCK_DIETAS_INICIALES,
  MOCK_PACIENTES,
} from '@/lib/mock-data-nutricion';

const SMAE_CONTENT = readFileSync(
  join(process.cwd(), 'lib', 'smae-completo.txt'),
  'utf-8'
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pacienteId =
      typeof body?.pacienteId === 'string' && body.pacienteId.trim()
        ? body.pacienteId.trim()
        : 'p01';

    const p = MOCK_PACIENTES.find((x) => x.id === pacienteId) ?? MOCK_PACIENTES[0]!;
    const d =
      MOCK_DIETAS_INICIALES().find((x) => x.pacienteId === pacienteId) ??
      MOCK_DIETAS_INICIALES()[0]!;

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      return Response.json({ error: 'Falta GEMINI_API_KEY en el servidor.' }, { status: 503 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const prompt = `Basándote en este plan de alimentación de ${p.nombre}:

${d.contenido}

ALIMENTOS PERMITIDOS: ${d.alimentos_permitidos.join(', ')}
CALORÍAS DIARIAS: ${d.calorias} kcal/día

Y usando el Sistema Mexicano de Equivalentes como referencia de porciones:
${SMAE_CONTENT}

Genera una lista del súper para 7 días completos.
La lista debe:
1. Calcular cantidades exactas multiplicadas por 7 días
2. Agruparse por sección del supermercado
3. Usar medidas prácticas (kg, piezas, latas, litros, paquetes)
4. Incluir solo alimentos del plan y sus equivalentes del SMAE
5. Redondear a medidas compradles (ej: 1.5 kg en lugar de 1.4 kg)

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin texto extra, sin bloques de código.
El JSON debe tener exactamente esta estructura:
{
  "secciones": [
    {
      "nombre": "Carnes y Proteínas",
      "emoji": "🥩",
      "items": [
        { "alimento": "Pechuga de pollo", "cantidad": "1.5", "unidad": "kg" }
      ]
    }
  ],
  "calorias_diarias": ${d.calorias},
  "semana": "Semana del lunes al domingo"
}

Secciones sugeridas: "Carnes y Proteínas", "Frutas y Verduras", "Lácteos y Huevo", "Cereales y Granos", "Leguminosas", "Aceites y Grasas", "Otros".
Incluye solo las secciones que tengan alimentos en el plan.`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    // Limpiar posibles bloques de código que Gemini agregue
    const clean = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let lista;
    try {
      lista = JSON.parse(clean);
    } catch {
      return Response.json(
        { error: 'La IA devolvió un formato inesperado. Intenta de nuevo.', raw: clean.slice(0, 200) },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, paciente: p.nombre, lista });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[api/demo/nutricion/lista-super]', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
