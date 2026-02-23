import { getMongoDb } from '../../lib/mongodb';

export type Alert = {
  _id?: unknown;
  leadId: string;
  clientId: string;
  senderName?: string;
  lastMessage: string;
  platform: string;
  reason: 'urgent_keyword' | 'high_activity' | 'new_lead' | 'sale_closed' | 'cp_validation' | 'location_verification' | 'documents_confirmed';
  senderId?: string;
  createdAt: Date;
  sentAt?: Date;
};

const URGENT_KEYWORDS = /\b(urgente|asap|ya|ahora|emergencia|inmediato|rápido|rapido|pronto)\b/i;

const SALE_CLOSED_KEYWORDS = /\b(te paso|te paso mi|te envío|te envio|adjunto|aquí está|aqui esta|estos son|mi ine|comprobante|domicilio|número|numero|contacto|ya te mandé|ya te mande|listo|ahí va|ahi va|te mando|dato|datos|documentos|correo|email|factura|instalación|instalacion|capturar|captura|venta)\b/i;

export function isUrgentByKeywords(message: string): boolean {
  return URGENT_KEYWORDS.test(message);
}

export async function createAlertIfUrgent(params: {
  leadId: string;
  clientId: string;
  senderName?: string;
  lastMessage: string;
  platform: string;
  messageCount: number;
  assignedTo?: string;
}): Promise<void> {
  const { leadId, clientId, senderName, lastMessage, platform, messageCount, assignedTo } = params;

  if (assignedTo) return;

  const hasKeyword = isUrgentByKeywords(lastMessage);
  const highActivity = messageCount >= 3;

  if (!hasKeyword && !highActivity) return;

  const db = await getMongoDb();
  const col = db.collection<Alert>('lead_alerts');

  const recent = await col.findOne({
    leadId,
    sentAt: { $exists: false },
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recent) return;

  const reason = hasKeyword ? 'urgent_keyword' : 'high_activity';
  await col.insertOne({
    leadId,
    clientId,
    senderName,
    lastMessage,
    platform,
    reason,
    createdAt: new Date(),
  });
}

export async function createAlertForCPValidation(params: {
  leadId: string;
  clientId: string;
  senderName?: string;
  lastMessage: string;
  platform: string;
  cp: string;
}): Promise<void> {
  const { leadId, clientId, senderName, lastMessage, platform, cp } = params;
  const db = await getMongoDb();
  const col = db.collection<Alert>('lead_alerts');
  const recent = await col.findOne({
    leadId,
    reason: 'cp_validation',
    lastMessage: { $regex: cp },
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
  });
  if (recent) return;
  await col.insertOne({
    leadId,
    clientId,
    senderName,
    lastMessage: `[CP ${cp} requiere validación] ${lastMessage}`,
    platform,
    reason: 'cp_validation',
    createdAt: new Date(),
  });
}

const GOOGLE_MAPS_PATTERNS = /maps\.google|goo\.gl\/maps|google\.com\/maps|maps\.app\.goo\.gl/i;

export function containsGoogleMapsLink(message: string): boolean {
  return GOOGLE_MAPS_PATTERNS.test(message);
}

export async function createAlertForLocationVerification(params: {
  leadId: string;
  clientId: string;
  senderName?: string;
  lastMessage: string;
  platform: string;
}): Promise<void> {
  const { leadId, clientId, senderName, lastMessage, platform } = params;
  const db = await getMongoDb();
  const col = db.collection<Alert>('lead_alerts');
  const recent = await col.findOne({
    leadId,
    reason: 'location_verification',
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  });
  if (recent) return;
  await col.insertOne({
    leadId,
    clientId,
    senderName,
    lastMessage: `[Ubicación Google Maps - verificar cobertura] ${lastMessage}`,
    platform,
    reason: 'location_verification',
    createdAt: new Date(),
  });
}

export function looksLikeSaleClosed(message: string): boolean {
  return SALE_CLOSED_KEYWORDS.test(message);
}

export async function createAlertForSaleClosed(params: {
  leadId: string;
  clientId: string;
  senderId?: string;
  senderName?: string;
  lastMessage: string;
  platform: string;
}): Promise<void> {
  const { leadId, clientId, senderId, senderName, lastMessage, platform } = params;

  const db = await getMongoDb();
  const col = db.collection<Alert>('lead_alerts');

  const recent = await col.findOne({
    leadId,
    reason: 'sale_closed',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  if (recent) return;

  await col.insertOne({
    leadId,
    clientId,
    senderId,
    senderName,
    lastMessage,
    platform,
    reason: 'sale_closed',
    createdAt: new Date(),
  });
}

export async function createAlertForDocumentsConfirmed(params: {
  leadId: string;
  clientId: string;
  senderId?: string;
  senderName?: string;
  platform: string;
  extractedData: { nombre: string; curp: string; direccion: string; telefono: string; correo: string; paquete?: string; promocion?: string };
}): Promise<void> {
  const { leadId, clientId, senderId, senderName, platform, extractedData } = params;
  const db = await getMongoDb();
  const col = db.collection<Alert>('lead_alerts');

  const toUpper = (s: string) => (s || '').toUpperCase();
  const formatted = [
    '📋 CAPTURAR EN IZZI - DOCUMENTOS CONFIRMADOS',
    '',
    `NOMBRE: ${toUpper(extractedData.nombre)}`,
    `CURP: ${toUpper(extractedData.curp)}`,
    `DIRECCION: ${toUpper(extractedData.direccion)}`,
    `TELEFONO: ${toUpper(extractedData.telefono)}`,
    `CORREO: ${(extractedData.correo || '').toLowerCase()}`,
    `PAQUETE: ${toUpper(extractedData.paquete || 'N/A')}`,
    `PROMOCION: ${toUpper(extractedData.promocion || 'N/A')}`,
    '',
    `LEAD: ${toUpper(senderName || 'Sin nombre')} | ${senderId || ''}`,
  ].join('\n');

  await col.insertOne({
    leadId,
    clientId,
    senderId,
    senderName,
    lastMessage: formatted,
    platform,
    reason: 'documents_confirmed',
    createdAt: new Date(),
  });
}

export async function getPendingAlerts(): Promise<Alert[]> {
  const db = await getMongoDb();
  return db
    .collection<Alert>('lead_alerts')
    .find({ sentAt: { $exists: false } })
    .sort({ createdAt: 1 })
    .limit(20)
    .toArray();
}

export async function markAlertSent(alertId: string): Promise<boolean> {
  const db = await getMongoDb();
  const { ObjectId } = await import('mongodb');
  let oid: import('mongodb').ObjectId;
  try {
    oid = new ObjectId(alertId);
  } catch {
    return false;
  }
  const result = await db.collection<Alert>('lead_alerts').updateOne(
    { _id: oid },
    { $set: { sentAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function getRecentAlerts(limit = 50): Promise<Alert[]> {
  const db = await getMongoDb();
  return db
    .collection<Alert>('lead_alerts')
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
