import { getMongoDb } from '../../lib/mongodb';

export type KnowledgeDoc = {
  _id?: unknown;
  clientId: string;
  filename: string;
  content: string;
  uploadedAt: Date;
};

export async function getKnowledgeDocsForClient(clientId: string): Promise<string> {
  const normalized = clientId.trim().toLowerCase();
  if (!normalized) return '';

  const db = await getMongoDb();
  const docs = await db
    .collection<KnowledgeDoc>('knowledge_docs')
    .find({ clientId: normalized })
    .sort({ uploadedAt: -1 })
    .toArray();

  if (docs.length === 0) return '';

  const isCoberturaByFilename = (f: string) =>
    /cobertura|coverage|d_codigo|codigo|postal|^cp\.|_cp\.|codigos/i.test(f);

  const isCoberturaByContent = (content: string): boolean => {
    if (!content || content.length < 100) return false;
    if (/### CP con Internet y TV|### Lista completa CP|### CP con solo TV/i.test(content))
      return true;
    if (content.length > 20000 && /d_codigo|tipo\s*plaza/i.test(content.slice(0, 2000)))
      return true;
    const fiveDigitCount = (content.match(/\b\d{5}\b/g) || []).length;
    if (fiveDigitCount > 100) return true;
    return false;
  };

  const MAX_DOC_CHARS = 25000;
  const nonCoverageDocs = docs.filter((d) => {
    if (isCoberturaByFilename(d.filename)) return false;
    if (isCoberturaByContent(d.content || '')) return false;
    if ((d.content || '').length > MAX_DOC_CHARS) return false;
    return true;
  });
  if (nonCoverageDocs.length === 0) return '';

  nonCoverageDocs.sort((a, b) => (b.uploadedAt?.getTime() ?? 0) - (a.uploadedAt?.getTime() ?? 0));
  return nonCoverageDocs.map((d) => `--- ${d.filename} ---\n${d.content}`).join('\n\n');
}

export async function addKnowledgeDoc(params: {
  clientId: string;
  filename: string;
  content: string;
}): Promise<void> {
  const clientId = params.clientId.trim().toLowerCase();
  if (!clientId) throw new Error('clientId requerido');

  const db = await getMongoDb();
  await db.collection<KnowledgeDoc>('knowledge_docs').insertOne({
    clientId,
    filename: params.filename || 'sin-nombre.txt',
    content: params.content || '',
    uploadedAt: new Date(),
  });
}

export async function listKnowledgeDocs(clientId: string): Promise<KnowledgeDoc[]> {
  const normalized = clientId.trim().toLowerCase();
  if (!normalized) return [];

  const db = await getMongoDb();
  return db
    .collection<KnowledgeDoc>('knowledge_docs')
    .find({ clientId: normalized })
    .sort({ uploadedAt: -1 })
    .toArray();
}

export async function deleteKnowledgeDoc(
  clientId: string,
  docId: string
): Promise<boolean> {
  const normalized = clientId.trim().toLowerCase();
  if (!normalized) return false;

  const { ObjectId } = await import('mongodb');
  let oid: import('mongodb').ObjectId;
  try {
    oid = new ObjectId(docId);
  } catch {
    return false;
  }

  const db = await getMongoDb();
  const result = await db.collection<KnowledgeDoc>('knowledge_docs').deleteOne({
    _id: oid,
    clientId: normalized,
  });
  return (result.deletedCount ?? 0) > 0;
}
