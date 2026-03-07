/**
 * Diagnóstico: busca un CP en los docs de cobertura y muestra en qué sección está.
 * Uso: node scripts/check-coverage-cp.js 97138
 */
const cp = process.argv[2] || '97138';
const clientId = process.argv[3] || 'izzi';

async function main() {
  const { MongoClient } = await import('mongodb');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentia';
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const docs = await db
    .collection('knowledge_docs')
    .find({ clientId: clientId.toLowerCase() })
    .sort({ uploadedAt: -1 })
    .toArray();

  const isCobertura = (d) =>
    /cobertura|coverage|d_codigo|codigo|postal/i.test(d.filename) ||
    (d.content && /### CP con Internet y TV|### Lista completa CP|### CP con solo TV/i.test(d.content));

  const coverageDocs = docs.filter(isCobertura);
  console.log(`\n📊 Docs de cobertura para ${clientId}: ${coverageDocs.length}\n`);

  const cpClean = cp.replace(/\D/g, '').slice(-5);
  const cpRegex = new RegExp(`\\b${cpClean}\\b`);

  for (const doc of coverageDocs) {
    console.log(`--- ${doc.filename} (${doc.uploadedAt?.toISOString?.()?.slice(0, 10)}) ---`);
    const c = doc.content || '';
    const onNet = c.match(/### CP con Internet y TV \(on net\)\s*\n([\s\S]*?)(?=\n###|$)/i);
    const offNet = c.match(/### CP con solo TV \(off net[^)]*\)\s*\n([\s\S]*?)(?=\n###|$)/i);
    const lista = c.match(/### Lista completa CP[^\n]*\n([\s\S]*?)(?=\n###|$)/i);

    if (onNet && cpRegex.test(onNet[1])) console.log(`  ✅ EN ON NET`);
    else if (offNet && cpRegex.test(offNet[1])) console.log(`  ❌ EN OFF NET (solo TV)`);
    else if (lista) {
      const line = lista[1].split('\n').find((l) => l.startsWith(cpClean + ':') || cpRegex.test(l.split(':')[0]));
      if (line) console.log(`  📋 Lista: ${line.trim()}`);
      else console.log(`  ⚠️ No en lista`);
    } else {
      const inRaw = c.split('\n').some((l, i) => i > 0 && l.includes(cpClean));
      console.log(`  ${inRaw ? '📄 En CSV raw' : '❓ No encontrado'}`);
    }
    console.log('');
  }

  await client.close();
  console.log('💡 Si el CP aparece en OFF NET pero debería ser ON NET: elimina el doc en Dashboard → Conocimiento y vuelve a subir el archivo CSV.');
}

main().catch(console.error);
