import { getMongoDb } from '../../lib/mongodb';

export type InterventionAction = 'took_control' | 'released' | 'closed';

export type LeadIntervention = {
  _id?: unknown;
  leadId: string;
  handlerId: string;
  action: InterventionAction;
  clientId: string;
  statusAtAction?: string;
  createdAt: Date;
};

export async function recordIntervention(params: {
  leadId: string;
  handlerId: string;
  action: InterventionAction;
  clientId: string;
  statusAtAction?: string;
}): Promise<void> {
  const db = await getMongoDb();
  await db.collection<LeadIntervention>('lead_interventions').insertOne({
    leadId: params.leadId,
    handlerId: params.handlerId,
    action: params.action,
    clientId: params.clientId,
    statusAtAction: params.statusAtAction,
    createdAt: new Date(),
  });
}

export async function getInterventionsByHandler(handlerId: string, limit = 100) {
  const db = await getMongoDb();
  return db
    .collection<LeadIntervention>('lead_interventions')
    .find({ handlerId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getClosedByHandler(clientId?: string) {
  const db = await getMongoDb();
  const filter = clientId ? { action: 'closed', clientId } : { action: 'closed' };
  const docs = await db
    .collection<LeadIntervention>('lead_interventions')
    .aggregate([
      { $match: filter },
      { $group: { _id: '$handlerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();
  return docs as { _id: string; count: number }[];
}
