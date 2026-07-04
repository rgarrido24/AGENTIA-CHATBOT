'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, MessageSquare } from 'lucide-react';

const LINKS = [
  { href: '/cwf-panel/conversaciones', label: 'Conversaciones', icon: MessageSquare },
  { href: '/cwf-panel/cotizaciones', label: 'Cotizaciones', icon: FileText },
] as const;

export function CwfPanelNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              active
                ? 'bg-amber-700/40 border-amber-500/50 text-amber-50'
                : 'border-amber-900/30 text-amber-200/70 hover:bg-white/5 hover:text-amber-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
