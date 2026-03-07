import { getMongoDb } from "../../lib/mongodb";

export type SalesStep =
  | "inicio"
  | "viendo_precios"
  | "proporcionando_datos"
  | "interesado_demo"
  | "cerrado";

export type ChatSession = {
  sessionId: string;
  clientId: string;
  pageId: string;
  senderId: string;
  platform: string;
  currentStep: SalesStep;
  lastMessageAt: Date;
  lastBotMessageAt?: Date;
  messageCount: number;
  followUpSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function makeSessionId(senderId: string, pageId: string, clientId: string): string {
  return `${senderId}_${pageId}_${clientId}`;
}

function inferStepFromMessage(message: string, currentStep: SalesStep): SalesStep {
  const text = message.toLowerCase();

  if (/precio|precios|costo|cu[áa]nto|paquete|megas|internet/i.test(text)) {
    return "viendo_precios";
  }
  if (
    /nombre|tel[eé]fono|whatsapp|email|correo|ll[aá]mame|contacto/i.test(text)
  ) {
    return "proporcionando_datos";
  }
  if (/demo|agendar|cita|reuni[oó]n|llamada|consultor/i.test(text)) {
    return "interesado_demo";
  }
  if (/gracias|listo|ok|perfecto|cerrado/i.test(text)) {
    return "cerrado";
  }

  return currentStep;
}

const FOLLOW_UP_THRESHOLD_MS = 60 * 60 * 1000; // 1 hora

export async function getOrCreateSession(params: {
  senderId: string;
  pageId: string;
  clientId: string;
  platform: string;
  message: string;
}): Promise<ChatSession> {
  const db = await getMongoDb();
  const coll = db.collection<ChatSession>("chat_sessions");
  const sessionId = makeSessionId(
    params.senderId,
    params.pageId,
    params.clientId
  );

  const existing = await coll.findOne({ sessionId });
  const now = new Date();

  if (existing) {
    const newStep = inferStepFromMessage(params.message, existing.currentStep);
    const isReturningUser =
      now.getTime() - existing.lastMessageAt.getTime() > FOLLOW_UP_THRESHOLD_MS;

    const update: Partial<ChatSession> = {
      currentStep: newStep,
      lastMessageAt: now,
      messageCount: existing.messageCount + 1,
      updatedAt: now
    };

    await coll.updateOne({ sessionId }, { $set: update });

    const updated = {
      ...existing,
      ...update,
      messageCount: existing.messageCount + 1,
      followUpSent: existing.followUpSent ?? false
    };
    return { ...updated, _isReturningUser: isReturningUser } as ChatSession & {
      _isReturningUser?: boolean;
    };
  }

  const newSession: ChatSession = {
    sessionId,
    clientId: params.clientId,
    pageId: params.pageId,
    senderId: params.senderId,
    platform: params.platform,
    currentStep: inferStepFromMessage(params.message, "inicio"),
    lastMessageAt: now,
    messageCount: 1,
    createdAt: now,
    updatedAt: now
  };

  await coll.insertOne(newSession);
  return newSession;
}

export function getFollowUpInstruction(
  session: ChatSession & { _isReturningUser?: boolean },
  clientId: string
): string {
  if (!session._isReturningUser || session.messageCount <= 1) {
    return "";
  }

  // Usuario que regresa después de un tiempo: inyectar re-enganche
  const followUps: Record<string, string> = {
    izzi:
      "¿Te gustaría conocer nuestras promociones de febrero en Mérida? Pregunta por los paquetes con descuento.",
    "demo-inmobiliaria":
      "¿Seguiste interesado en propiedades? Te puedo ayudar con opciones que se ajusten a tu búsqueda.",
    agentia:
      "¿Quieres que te cuente más sobre los chatbots y la automatización para tu negocio?"
  };

  const fallback =
    "¿En qué puedo ayudarte hoy? Cuéntame si quieres más información.";
  const msg = followUps[clientId] ?? fallback;

  return `\n\n## Contexto de re-enganche\nEl cliente volvió a escribir después de un tiempo. Si aplica, comienza tu respuesta con un re-enganche breve y amable, por ejemplo: "${msg}" Luego continúa con la conversación normal.`;
}
