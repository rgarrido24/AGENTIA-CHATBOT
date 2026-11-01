import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { resellerId: string } }): Promise<Metadata> {
  // Los paneles de cliente (cliente/[clientSlug]) definen su propio manifest y lo reemplazan.
  return { manifest: `/portal/${params.resellerId}/manifest.webmanifest` };
}

export default function ResellerPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
