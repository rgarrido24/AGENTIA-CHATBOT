import { NextRequest, NextResponse } from 'next/server';
import { getUploadJob } from '@/lib/tiendanube-upload-job';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const jobId = params.jobId?.trim();
  if (!jobId) {
    return NextResponse.json({ error: 'jobId requerido' }, { status: 400 });
  }

  const job = await getUploadJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    jobId: job.jobId,
    clientId: job.clientId,
    status: job.status,
    total: job.total,
    uploaded: job.uploaded,
    failed: job.failed,
    errors: job.errors,
    error: job.error ?? null,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString() ?? null,
    completedAt: job.completedAt?.toISOString() ?? null,
  });
}
