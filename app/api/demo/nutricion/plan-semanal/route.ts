import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const SMAE_CONTENT = readFileSync(
  join(process.cwd(), 'lib', 'smae-completo.txt'),
  'utf-8'
);

export type TiempoComida = {
  nombre: string;
  emoji: string;
  equivalentes: { grupo: string; cantidad: number; ejemplos: string[] }[];
  calorias: number;
};

export type DiaPlan = {
  dia: string;
  totalCalorias: number;
  tiempos: TiempoComida[];
};

export type PlanSemanal = {
  dias: DiaPlan[];
  caloriasPromedio: number;
  distribucionMacros: { proteina: number; grasa: number; carbohidratos: number };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const calorias = Number(body?.calorias) || 1400;
    const restricciones: string[] = Array.isArray(body?.restricciones) ? body.restricciones : [];
    const preferencias = typeof body?.preferencias === 'string' ? body.preferencias.slice(0, 300) : '';
    const pacienteNombre = typeof body?.pacienteNombre === 'string' ? body.pacienteNombre : 'el paciente';

    const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim();
    if (!apiKey) {
      return Response.json({ error: 'Falta GEMINI_API_KEY en el servidor.' }, { status: 503 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const restriccionesTexto = restricciones.length
      ? restricciones.join(', ')
      : 'ninguna restricción especial';

    const prompt = `Eres un nutriólogo experto en el Sistema Mexicano de Equivalentes (SMAE).

Genera un plan de alimentación semanal completo (7 días: Lunes a Domingo) para ${pacienteNombre}.

PARÁMETROS:
- Calorías objetivo: ${calorias} kcal/día
- Restricciones alimentarias: ${restriccionesTexto}
- Preferencias: ${preferencias || 'ninguna preferencia especial'}

INSTRUCCIONES:
1. Usa EXCLUSIVAMENTE grupos de equivalentes del SMAE (no recetas ni platillos específicos)
2. Distribuye en 4 tiempos: Desayuno, Colación, Comida, Cena (puedes agregar Colación PM si las calorías lo requieren)
3. Varía los grupos entre días para no repetir el mismo plan
4. Las calorías de cada tiempo deben sumar aproximadamente el total diario
5. Da 2-3 ejemplos concretos por equivalente (ej: "2 tortillas de maíz" o "1/2 taza arroz")

REFERENCIA DE EQUIVALENTES DEL SMAE (para los ejemplos):
${SMAE_CONTENT}

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin texto extra:
{
  "dias": [
    {
      "dia": "Lunes",
      "totalCalorias": ${calorias},
      "tiempos": [
        {
          "nombre": "Desayuno",
          "emoji": "🌅",
          "equivalentes": [
            {
              "grupo": "Cereal sin grasa",
              "cantidad": 2,
              "ejemplos": ["2 tortillas de maíz", "2 rebanadas pan integral"]
            }
          ],
          "calorias": 350
        }
      ]
    }
  ],
  "caloriasPromedio": ${calorias},
  "distribucionMacros": {
    "proteina": 20,
    "grasa": 25,
    "carbohidratos": 55
  }
}`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    const clean = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    let plan: PlanSemanal;
    try {
      plan = JSON.parse(clean) as PlanSemanal;
    } catch {
      return Response.json(
        { error: 'La IA devolvió un formato inesperado. Intenta de nuevo.', raw: clean.slice(0, 400) },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, plan });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[api/demo/nutricion/plan-semanal]', e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
