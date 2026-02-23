import { MongoClient, type Db } from "mongodb";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

declare global {
  // eslint-disable-next-line no-var
  var __agentiaMongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Conexión cacheada para evitar abrir demasiados sockets en serverless.
 * - Reutiliza el pool entre invocaciones (cuando Vercel mantiene caliente el runtime).
 * - Limita el pool para evitar saturación.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!global.__agentiaMongoClientPromise) {
    const uri = requireEnv("MONGODB_URI");
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000
    });
    global.__agentiaMongoClientPromise = client.connect();
  }

  return global.__agentiaMongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB;
  return dbName ? client.db(dbName) : client.db(); // si no hay DB, usa la del URI
}

