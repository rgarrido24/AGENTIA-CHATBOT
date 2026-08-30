import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { generateGeminiReply } from '@/src/lib/gemini';

const VISION_PROMPT = `Analiza esta foto de comida. Identifica cada alimento visible y estima las calorías aproximadas de cada uno. Responde ÚNICAMENTE en español mexicano con este formato exacto (sin texto extra):
- [nombre del alimento]: ~[número] kcal
Total estimado: ~[número] kcal`;

const SIMULATION_PROMPT = `Imagina que ves en foto una comida mexicana típica del mediodía: arroz rojo, pechuga de pollo a la plancha, frijoles de la olla y ensalada de lechuga con jitomate. Analiza y estima las calorías con EXACTAMENTE este formato (sin texto extra):
- [nombre del alimento]: ~[número] kcal
Total estimado: ~[número] kcal`;

const DEMO_PATIENTS: Record<string, { nombre: string; meta: number; preloaded: number }> = {
  p01: { nombre: 'Ana García', meta: 1800, preloaded: 450 },
  p02: { nombre: 'Roberto Sánchez', meta: 2200, preloaded: 0 },
  p03: { nombre: 'Luisa Mendoza', meta: 1600, preloaded: 320 },
};

function parseTotalFromGemini(text: string): number {
  const m = text.match(/Total estimado:\s*~?(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function formatBotReply(geminiText: string, totalNuevo: number, totalDia: number, meta: number): string {
  const lines = geminiText
    .split('\n')
    .filter((l) => l.trim().startsWith('-'))
    .map((l) => l.trim());

  const listStr = lines.length > 0 ? lines.join('\n') : geminiText.trim();
  const restante = meta - totalDia;
  const pct = Math.round((totalDia / meta) * 100);

  let status = '';
  if (pct >= 100) status = '🔴 Ya alcanzaste tu meta calórica del día.';
  else if (pct >= 75) status = '🟡 Ya llevas el 75 % de tu meta. Cuida las porciones.';
  else status = `🟢 Te quedan ~${restante} kcal disponibles hoy.`;

  return `🍽️ Analicé tu comida:\n${listStr}\n\n📊 Esta comida: ~${totalNuevo} kcal\nHoy llevas ~${totalDia} kcal de tu meta de ${meta} kcal (${pct}%)\n${status}\n\n⚠️ Estimación aproximada basada en análisis visual.`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId') ?? 'p01';
  const today = new Date().toISOString().slice(0, 10);

  const db = await getMongoDb();
  const logs = await db
    .collection('nutrition_calorie_log')
    .find({ patientId, fecha: today })
    .sort({ createdAt: 1 })
    .toArray();

  const patient = DEMO_PATIENTS[patientId] ?? DEMO_PATIENTS.p01;
  const fromDb = (logs as Array<{ calorias_estimadas?: number }>).reduce((s, l) => s + (l.calorias_estimadas ?? 0), 0);
  const totalDia = patient.preloaded + fromDb;

  return NextResponse.json({ logs, totalDia, meta: patient.meta, patientId });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientId = 'p01', imageBase64, mimeType = 'image/jpeg', tiempo = 'Comida', simulate = false } = body;

    const patient = DEMO_PATIENTS[patientId] ?? DEMO_PATIENTS.p01;

    let geminiText: string;
    if (simulate || !imageBase64) {
      geminiText = await generateGeminiReply({ userMessage: SIMULATION_PROMPT });
    } else {
      geminiText = await generateGeminiReply({
        userMessage: VISION_PROMPT,
        mediaBase64: imageBase64,
        mimeType,
      });
    }

    const caloriasNuevas = parseTotalFromGemini(geminiText);
    const today = new Date().toISOString().slice(0, 10);

    const db = await getMongoDb();
    await db.collection('nutrition_calorie_log').insertOne({
      patientId,
      fecha: today,
      tiempo,
      geminiRaw: geminiText,
      calorias_estimadas: caloriasNuevas,
      imagen_recibida: !simulate && !!imageBase64,
      createdAt: new Date(),
    });

    const prev = await db
      .collection('nutrition_calorie_log')
      .find({ patientId, fecha: today })
      .toArray();
    const fromDb = (prev as Array<{ calorias_estimadas?: number }>).reduce((s, l) => s + (l.calorias_estimadas ?? 0), 0);
    const totalDia = patient.preloaded + fromDb;

    const reply = formatBotReply(geminiText, caloriasNuevas, totalDia, patient.meta);
    return NextResponse.json({ reply, totalDia, meta: patient.meta, caloriasNuevas });
  } catch (err) {
    console.error('[calorias]', err);
    return NextResponse.json({ error: 'Error al analizar la foto' }, { status: 500 });
  }
}
