import type { PanelConversation, PanelConversationMessage } from './panel-conversations';

export type PanelMessageDto = {
  role: PanelConversationMessage['role'];
  content: string;
  at: string;
  mediaType?: PanelConversationMessage['mediaType'];
  mediaUrl?: string;
  fileName?: string;
  waMessageId?: string;
  deliveryStatus?: PanelConversationMessage['deliveryStatus'];
};

export function serializePanelMessage(m: PanelConversationMessage): PanelMessageDto {
  return {
    role: m.role,
    content: m.content,
    at: m.at.toISOString(),
    ...(m.mediaType ? { mediaType: m.mediaType } : {}),
    ...(m.mediaUrl ? { mediaUrl: m.mediaUrl } : {}),
    ...(m.fileName ? { fileName: m.fileName } : {}),
    ...(m.waMessageId ? { waMessageId: m.waMessageId } : {}),
    ...(m.deliveryStatus ? { deliveryStatus: m.deliveryStatus } : {}),
  };
}

export function serializePanelMessages(conv: PanelConversation): PanelMessageDto[] {
  return conv.messages.map(serializePanelMessage);
}
