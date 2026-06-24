import { NextRequest, NextResponse } from 'next/server';
import { isDashboardAuthenticated } from '@/lib/dashboard-auth';
import { conversationPublicId, listCwfConversations } from '@/lib/cwf-conversations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isDashboardAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const conversations = await listCwfConversations(100);
  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: conversationPublicId(c),
      conversationId: c.conversationId,
      senderId: c.senderId,
      senderName: c.senderName ?? c.senderId,
      platform: c.platform,
      lastMessage: c.lastMessage ?? c.messages[c.messages.length - 1]?.content ?? '',
      lastMessageAt: c.lastMessageAt.toISOString(),
      messageCount: c.messages.length,
      botPaused: c.botPaused,
    })),
  });
}
