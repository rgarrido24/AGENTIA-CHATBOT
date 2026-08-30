import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default function SurestePage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), 'public', 'sureste-dashboard.html'),
    'utf-8'
  );
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
