import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default function ChowakDemoPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), 'public', 'demos', 'chowak', 'index.html'),
    'utf-8'
  );
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
