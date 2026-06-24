import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import {
  AGENTIA_PANEL_CLIENT_ID,
  AGENTIA_PANEL_PHONE_DISPLAY,
} from '@/lib/agentia-panel';
import {
  listPanelConversations,
  panelConversationPublicId,
  platformToChannel,
  type PanelChannel,
} from '@/lib/panel-conversations';

export const dynamic = 'force-dynamic';

function parseChannel(raw: string | null): PanelChannel | 'all' {
  if (!raw || raw === 'all') return 'all';
  const c = platformToChannel(raw);
  if (c === 'whatsapp' || c === 'facebook' || c === 'instagram') return c;
  return 'all';
}

export async function GET(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const channel = parseChannel(req.nextUrl.searchParams.get('channel'));
  const conversations = await listPanelConversations(AGENTIA_PANEL_CLIENT_ID, {
    channel,
    limit: 120,
  });

  return NextResponse.json({
    phoneDisplay: AGENTIA_PANEL_PHONE_DISPLAY,
    channel,
    conversations: conversations.map((c) => ({
      id: panelConversationPublicId(c),
      conversationId: c.conversationId,
      senderId: c.senderId,
      senderName: c.senderName ?? c.senderId,
      channel: c.channel,
      platform: c.platform,
      lastMessage: c.lastMessage ?? c.messages[c.messages.length - 1]?.content ?? '',
      lastMessageAt: c.lastMessageAt.toISOString(),
      messageCount: c.messages.length,
      botPaused: c.botPaused,
    })),
  });
}
