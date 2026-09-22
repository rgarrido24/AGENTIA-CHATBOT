import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { verifyResellerCookie, COOKIE_NAME } from '@/lib/reseller-auth';
import {
  buildFacebookOauthUrl,
  getFbAppId,
  getPublicOrigin,
  signOauthState,
} from '@/lib/facebook-lead-connect';

export const dynamic = 'force-dynamic';

function redirectToClientes(resellerId: string, code?: string) {
  const url = new URL(`${getPublicOrigin()}/portal/${resellerId}/clientes`);
  if (code) url.searchParams.set('fb_error', code);
  return NextResponse.redirect(url);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { resellerId: string; clientSlug: string } },
) {
  const { resellerId, clientSlug } = params;
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  const reseller = await verifyResellerCookie(cookieValue);
  if (!reseller || reseller.resellerId !== resellerId) {
    return NextResponse.redirect(new URL(`${getPublicOrigin()}/portal/${resellerId}`));
  }

  if (!getFbAppId() || !process.env.FB_APP_SECRET) {
    return redirectToClientes(resellerId, 'config');
  }

  const db = await getMongoDb();
  const client = await db.collection('leads').findOne({
    _collection_type: 'reseller_client',
    resellerId,
    clientSlug,
  });
  if (!client) {
    return redirectToClientes(resellerId, 'generic');
  }

  if (!client.fb_connection) {
    await db.collection('leads').updateOne(
      { _collection_type: 'reseller_client', resellerId, clientSlug },
      {
        $set: {
          'fb_connection.status': 'pending',
          updatedAt: new Date(),
        },
      },
    );
  }

  const state = signOauthState(resellerId, clientSlug);
  try {
    return NextResponse.redirect(buildFacebookOauthUrl(state));
  } catch (err) {
    console.error('[fb-connect] oauth url', (err as Error).message);
    return redirectToClientes(resellerId, 'oauth');
  }
}
