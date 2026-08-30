import { MongoClient, type Db } from "mongodb";

function normalizeEnvValue(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  let v = raw.trim();
  if (!v) return undefined;
  // Render / .env a veces quedan como: "mongodb+srv://..."
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v || undefined;
}

function requireEnv(name: string): string {
  const value = normalizeEnvValue(process.env[name]);
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

function validateMongoUri(uri: string): void {
  const ok = uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
  if (!ok) {
    throw new Error(
      `MONGODB_URI inválida: debe iniciar con "mongodb://" o "mongodb+srv://". (valor recibido: ${JSON.stringify(
        uri.slice(0, 32)
      )}${uri.length > 32 ? "..." : ""})`
    );
  }
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
    validateMongoUri(uri);
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
  const dbName = process.env.MONGODB_DB ?? 'agentia_chatbot_ventas';
  return client.db(dbName);
}

