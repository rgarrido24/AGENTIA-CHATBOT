import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  MOCK_DIETAS_INICIALES,
  MOCK_PACIENTES,
  medicionesDePaciente,
  semanasTratamiento,
  statsConsultorioTexto,
} from '@/lib/mock-data-nutricion';

const SMAE_CONTENT = readFileSync(
  join(process.cwd(), 'lib', 'smae-completo.txt'),
  'utf-8'
);

type Msg = { role: 'user' | 'assistant'; content: string };

function nutriologaSystem(): string {
  return `Eres el asistente IA de NutriVida, consultorio de la Dra. Andrea Morales.
Apoyas a la nutrióloga con:
1. Seguimiento y análisis de progreso de pacientes
2. Generación de planes de alimentación personalizados
3. Estrategias para pacientes que muestran riesgo de abandono
4. Mensajes motivacionales personalizados
5. Análisis de tendencias del consultorio

Datos del consultorio hoy:
${statsConsultorioTexto()}

Tienes acceso al Sistema Mexicano de Equivalentes (SMAE) completo para consultar porciones
y equivalencias cuando lo necesites al diseñar o ajustar planes de alimentación:

${SMAE_CONTENT}

Responde en español, técnico pero accesible. Máximo 3 párrafos.`;
}

function buildPacienteSystem(pacienteId: string): string {
  const p = MOCK_PACIENTES.find((x) => x.id === pacienteId) ?? MOCK_PACIENTES[0]!;
  const d = MOCK_DIETAS_INICIALES().find((x) => x.pacienteId === pacienteId) ?? MOCK_DIETAS_INICIALES()[0]!;
  const ms = medicionesDePaciente(pacienteId);
  const ini = ms[0];
  const ult = ms[ms.length - 1];
  const baj =
    ini && ult ? `${(ini.peso - ult.peso).toFixed(1)}` : '6.5';
  const sem = semanasTratamiento(p);

  return `Eres el asistente nutricional del consultorio NutriVida para ${p.nombre}.
Tu rol es ayudarle a seguir su plan de alimentación.

DIETA DEL PACIENTE:
${d.contenido}

ALIMENTOS PERMITIDOS: ${d.alimentos_permitidos.join(', ')}
ALIMENTOS PROHIBIDOS: ${d.alimentos_prohibidos.join(', ')}
CALORÍAS OBJETIVO: ${d.calorias} kcal/día

════════════════════════════════════════════
SISTEMA MEXICANO DE EQUIVALENTES (SMAE):
Usa esta tabla para responder sustituciones.
Cuando el paciente pida cambiar un alimento,
busca en el mismo grupo del SMAE y da la
porción equivalente exacta en gramos.
════════════════════════════════════════════
${SMAE_CONTENT}

REGLAS PARA SUSTITUCIONES:
1. Identifica el grupo al que pertenece el alimento original
2. Busca opciones del MISMO grupo en el SMAE
3. Da la porción equivalente exacta en gramos
4. Verifica que el alimento sustituto NO esté en la lista de prohibidos
5. Confirma que mantiene las mismas calorías y macronutrientes

REGLAS GENERALES:
- Responde SIEMPRE en español
- Sé breve y directo (máximo 3 párrafos)
- Usa emojis con moderación 💚
- Sé empático — sabes que seguir una dieta es difícil
- Celebra cada pequeño logro que mencione
- Si pregunta su progreso: en ${sem} semanas, variación aproximada ${baj} kg vs. inicio (demo)
- Si el alimento NO está en su plan ni en el SMAE como equivalente, dilo claramente
- NUNCA inventes porciones ni calorías`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];
    const modeRaw = body?.mode;
    const isPaciente = modeRaw === 'paciente' || modeRaw === 'cliente';
    const pacienteId =
      typeof body?.pacienteId === 'string' && body.pacienteId.trim()
        ? body.pacienteId.trim()
        : 'p01';

    if (!message) {
      return new Response(JSON.stringify({ error: 'message requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''
    ).trim();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Falta GEMINI_API_KEY en el servidor.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const system = isPaciente ? buildPacienteSystem(pacienteId) : nutriologaSystem();

    const coreMessages = [
      ...history
        .filter((m) => m?.content && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    console.error('[api/demo/nutricion/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
