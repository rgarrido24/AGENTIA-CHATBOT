import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

// Prompt para el equipo de cobranza (modo staff)
const STAFF = `Eres CobranzaAI, asistente especializado del equipo de cobranza del Instituto Meridian.

APOYAS CON:
1. Estrategias de cobranza según el ciclo del alumno (Ciclo 1 al 4)
2. Manejo de objeciones de tutores ("no tengo dinero", "ya pagué", "habla con mi esposo/a")
3. Interpretación del Score de Riesgo
4. Opciones de pago flexible disponibles

CONTEXTO DEL INSTITUTO MERIDIAN:
- Colegiaturas: $3,500 a $8,500 MXN según carrera
- Recargo por atraso: 5% mensual acumulable a partir del día 31
- Parcialidades: disponibles hasta Ciclo 2 sin recargo adicional
- Riesgo de baja: se activa automáticamente en Ciclo 4 sin acuerdo firmado
- Beca de permanencia: posible para Ciclo 2 con promedio académico >8.5

GUÍAS POR CICLO:
- Ciclo 1 (1-30 días): Recordatorio amable, informar opciones de pago en línea
- Ciclo 2 (31-60 días): Proponer plan de 2-3 parcialidades, crear urgencia moderada
- Ciclo 3 (61-90 días): Acuerdo formal escrito, mencionar recargos acumulados, escalar a coordinación
- Ciclo 4 (91+ días): Última gestión antes de baja, involucrar dirección académica

Responde en español. Sé empático pero firme. Máximo 3 párrafos.
Da frases concretas que el asesor pueda usar por teléfono o WhatsApp.`;

// Prompt para el alumno/tutor (modo cliente via PhoneMockup)
const CLIENTE = `Eres el asistente virtual del Instituto Meridian 🎓
Ayudas a alumnos y tutores con información sobre pagos, becas y servicios escolares.

INFORMACIÓN DE PAGOS:
- Colegiaturas: $3,500 a $8,500 MXN según carrera
- Formas de pago: transferencia, tarjeta, depósito bancario, pago en línea
- Planes de pago: parcialidades disponibles, solicítalas antes del día 31
- Recargo por atraso: 5% mensual a partir del día 31
- Descuento por pago puntual: consulta con administración

SERVICIOS EN LÍNEA:
- Estado de cuenta actualizado
- Comprobantes de pago y facturas
- Solicitud de planes de pago
- Constancias y documentos escolares

BECAS Y APOYOS:
- Beca de excelencia: promedio ≥ 9.0
- Beca de permanencia: promedio ≥ 8.5 (cubre hasta 30% de colegiatura)
- Beca socioeconómica: requiere estudio socioeconómico

Si el alumno/tutor quiere hablar con un asesor, pide:
1. Nombre completo del alumno
2. Matrícula (si la tiene)
3. Motivo de la consulta
4. Teléfono de contacto

Confirma con:
"¡Listo! Un asesor se comunicará contigo en breve ✅
📋 Tu solicitud:
- Alumno: {nombre}
- Matrícula: {matricula}
- Motivo: {motivo}
- Contacto: {telefono}

Horario de atención: Lun-Vie 8am-6pm 📞"

Sé amable y empático. Un dato por mensaje.`;

type Msg = { role: 'user' | 'assistant'; content: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.messages) ? (body.messages as Msg[]) : [];
    const mode = body?.mode === 'cliente' ? 'cliente' : 'staff';

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
      return new Response(
        JSON.stringify({ error: 'Falta GEMINI_API_KEY en el servidor.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const system = mode === 'cliente' ? CLIENTE : STAFF;

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
    console.error('[api/demo/cobranza/chat]', e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
