import type { NextApiRequest, NextApiResponse } from "next";
import { getMongoDb } from "../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed. Usa GET." });
  }

  try {
    const db = await getMongoDb();

    const leads = await db
      .collection("leads")
      .find({})
      .sort({ lastMessageAt: -1 })
      .limit(200)
      .toArray();

    const messages = await db
      .collection("leads_agentia")
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return res.status(200).json({
      ok: true,
      leads: leads.map((l) => ({
        leadId: l.leadId,
        senderId: l.senderId,
        senderName: l.senderName ?? "Sin nombre",
        clientId: l.clientId,
        pageId: l.pageId,
        platform: l.platform,
        status: l.status ?? "Interesado",
        lastMessage: l.lastMessage,
        lastReply: l.lastReply,
        lastMessageAt: l.lastMessageAt,
        messageCount: l.messageCount ?? 0,
        tags: l.tags ?? [],
        createdAt: l.createdAt
      })),
      messages: messages.map((m) => ({
        clientId: m.clientId,
        platform: m.platform,
        entryType: m.entryType,
        message: m.message,
        reply: m.reply,
        tags: m.tags ?? [],
        createdAt: m.createdAt
      }))
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return res.status(500).json({ error: msg });
  }
}
