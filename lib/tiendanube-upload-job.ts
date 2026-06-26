import { randomUUID } from 'crypto';
import { getMongoDb } from '@/lib/mongodb';
import {
  createTiendanubeProduct,
  getCatalogForClient,
  getTiendanubeToken,
  sleep,
} from '@/lib/tiendanube';

export type TiendanubeUploadJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type TiendanubeUploadJobDoc = {
  jobId: string;
  clientId: string;
  status: TiendanubeUploadJobStatus;
  total: number;
  uploaded: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
};

const COLLECTION = 'tiendanube_upload_jobs';

export async function createUploadJob(clientId: string, total: number): Promise<TiendanubeUploadJobDoc> {
  const db = await getMongoDb();
  const now = new Date();
  const job: TiendanubeUploadJobDoc = {
    jobId: randomUUID(),
    clientId,
    status: 'pending',
    total,
    uploaded: 0,
    failed: 0,
    errors: [],
    createdAt: now,
  };
  await db.collection<TiendanubeUploadJobDoc>(COLLECTION).insertOne(job);
  return job;
}

export async function getUploadJob(jobId: string): Promise<TiendanubeUploadJobDoc | null> {
  const db = await getMongoDb();
  return db.collection<TiendanubeUploadJobDoc>(COLLECTION).findOne({ jobId });
}

async function patchUploadJob(
  jobId: string,
  patch: Partial<TiendanubeUploadJobDoc>,
): Promise<void> {
  const db = await getMongoDb();
  await db.collection<TiendanubeUploadJobDoc>(COLLECTION).updateOne(
    { jobId },
    { $set: patch },
  );
}

export async function runTiendanubeUploadJob(jobId: string, clientId: string): Promise<void> {
  try {
    await patchUploadJob(jobId, { status: 'running', startedAt: new Date() });

    const tokenDoc = await getTiendanubeToken(clientId);
    if (!tokenDoc?.accessToken || !tokenDoc.storeId) {
      throw new Error('Tiendanube no conectado para este cliente');
    }

    const catalog = await getCatalogForClient(clientId);
    if (!catalog.length) {
      throw new Error('Catálogo vacío');
    }

    await patchUploadJob(jobId, { total: catalog.length });

    let uploaded = 0;
    let failed = 0;
    const errors: Array<{ name: string; error: string }> = [];

    for (const product of catalog) {
      try {
        await createTiendanubeProduct(tokenDoc.storeId, tokenDoc.accessToken, product);
        uploaded += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: product.name,
          error: err instanceof Error ? err.message : 'upload_failed',
        });
      }

      await patchUploadJob(jobId, {
        uploaded,
        failed,
        errors: errors.slice(-20),
      });

      await sleep(600);
    }

    await patchUploadJob(jobId, {
      status: 'completed',
      uploaded,
      failed,
      total: catalog.length,
      errors: errors.slice(0, 20),
      completedAt: new Date(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'upload_job_failed';
    await patchUploadJob(jobId, {
      status: 'failed',
      error: msg,
      completedAt: new Date(),
    }).catch(() => undefined);
    throw err;
  }
}
