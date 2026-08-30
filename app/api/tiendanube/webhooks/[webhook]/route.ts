import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_WEBHOOKS = new Set([
  'store-redact',
  'customers-redact',
  'customers-data-request',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: { webhook: string } }
) {
  const webhook = params.webhook?.trim();
  if (webhook && !ALLOWED_WEBHOOKS.has(webhook)) {
    return NextResponse.json({ ok: true, note: 'webhook_ignored' });
  }

  await request.json().catch(() => ({}));
  return NextResponse.json({ ok: true });
}
