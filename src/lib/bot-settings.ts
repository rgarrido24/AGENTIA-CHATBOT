import { getMongoDb } from '../../lib/mongodb';

/** Verifica si el bot está pausado globalmente para un cliente (kill switch global). */
export async function getBotGlobalPaused(clientId: string): Promise<boolean> {
  const db = await getMongoDb();
  const doc = await db.collection('bot_settings').findOne({
    clientId: clientId.trim().toLowerCase(),
  });
  return !!(doc && doc.globalPaused === true);
}

/** Pausa o reanuda el bot globalmente para un cliente. */
export async function setBotGlobalPaused(clientId: string, paused: boolean): Promise<boolean> {
  const db = await getMongoDb();
  const normalized = clientId.trim().toLowerCase();
  const result = await db.collection('bot_settings').updateOne(
    { clientId: normalized },
    { $set: { clientId: normalized, globalPaused: paused, updatedAt: new Date() } },
    { upsert: true }
  );
  return result.modifiedCount > 0 || result.matchedCount > 0;
}
