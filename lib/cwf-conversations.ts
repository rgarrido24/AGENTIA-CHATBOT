import {
  appendPanelConversationTurn,
  appendPanelMessages,
  getPanelConversationById,
  listPanelConversations,
  normalizePanelConversation,
  panelConversationPublicId,
  recordPanelInboundWhilePaused,
  setPanelConversationPaused,
  type PanelConversation,
  type PanelConversationMessage,
  type PanelMessageRole,
} from './panel-conversations';

export const CWF_CLIENT_ID = 'cwf';

export type CwfMessageRole = PanelMessageRole;
export type CwfConversationMessage = PanelConversationMessage;
export type CwfConversation = PanelConversation;

export const normalizeConversation = (doc: Parameters<typeof normalizePanelConversation>[0]) =>
  normalizePanelConversation(doc, CWF_CLIENT_ID);

export const conversationPublicId = panelConversationPublicId;

export async function listCwfConversations(limit = 80): Promise<CwfConversation[]> {
  return listPanelConversations(CWF_CLIENT_ID, { limit });
}

export async function getCwfConversationById(id: string): Promise<CwfConversation | null> {
  return getPanelConversationById(CWF_CLIENT_ID, id);
}

export async function appendCwfMessages(
  params: Omit<Parameters<typeof appendPanelMessages>[0], 'clientId'>
): Promise<void> {
  await appendPanelMessages({ ...params, clientId: CWF_CLIENT_ID });
}

export async function appendCwfConversationTurn(
  params: Omit<Parameters<typeof appendPanelConversationTurn>[0], 'clientId'>
): Promise<void> {
  await appendPanelConversationTurn({ ...params, clientId: CWF_CLIENT_ID });
}

export async function recordCwfInboundWhilePaused(
  params: Omit<Parameters<typeof recordPanelInboundWhilePaused>[0], 'clientId'>
): Promise<void> {
  await recordPanelInboundWhilePaused({ ...params, clientId: CWF_CLIENT_ID });
}

export async function setCwfConversationPaused(conversationId: string, paused: boolean): Promise<boolean> {
  return setPanelConversationPaused(CWF_CLIENT_ID, conversationId, paused);
}
