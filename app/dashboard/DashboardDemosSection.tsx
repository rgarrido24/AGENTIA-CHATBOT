'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { Clipboard, ExternalLink } from 'lucide-react';
import {
  INTERNAL_DASHBOARD_LINKS,
  type InternalLinkSection,
} from '@/lib/dashboard-internal-links';

function origin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://agentia.software';
}

export function DashboardDemosSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (href: string) => {
    const full = `${origin()}${href.startsWith('/') ? href : `/${href}`}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(full);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt('Copia esta URL:', full);
    }
  }, []);

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Landings y demos</h2>
          <p className="text-sm text-slate-400 mt-1">
            Accesos rápidos para ventas y soporte. Abre o copia el enlace completo.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {INTERNAL_DASHBOARD_LINKS.map((section: InternalLinkSection) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sage/90 mb-3">
              {section.title}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
              {section.items.map((item) => (
                <li
                  key={item.href + item.label}
                  className="flex items-stretch gap-2 rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  <Link
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm text-white hover:bg-white/5 transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-sage opacity-80" />
                    <span className="min-w-0">
                      <span className="font-medium block truncate">{item.label}</span>
                      <span className="text-[11px] text-slate-500 font-mono truncate block">
                        {item.href}
                      </span>
                      {item.hint ? (
                        <span className="text-[11px] text-slate-500 block mt-0.5">{item.hint}</span>
                      ) : null}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => void copy(item.href)}
                    className="shrink-0 px-3 border-l border-white/10 text-slate-400 hover:text-sage hover:bg-white/5 transition"
                    title="Copiar URL completa"
                    aria-label={`Copiar enlace ${item.label}`}
                  >
                    <Clipboard className="w-4 h-4 mx-auto" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {copied ? (
        <p className="mt-4 text-xs text-sage" role="status">
          Copiado: {copied}
        </p>
      ) : null}
    </section>
  );
}
