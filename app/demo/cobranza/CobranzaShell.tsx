'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';

const NAV = [
  { href: '/demo/cobranza', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demo/cobranza/alumnos', label: 'Alumnos', icon: Users },
  { href: '/demo/cobranza/cobranza', label: 'Cobranza', icon: MessageSquare },
  { href: '/demo/cobranza/secuencias', label: 'Secuencias', icon: GitBranch },
  { href: '/demo/cobranza/asistente', label: 'Asistente IA', icon: Bot },
] as const;

const TITLE_MAP: Record<string, string> = {
  '/demo/cobranza': 'Dashboard',
  '/demo/cobranza/alumnos': 'Alumnos',
  '/demo/cobranza/cobranza': 'Cobranza',
  '/demo/cobranza/secuencias': 'Secuencias',
  '/demo/cobranza/asistente': 'Asistente IA',
};

export default function CobranzaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sectionTitle = TITLE_MAP[pathname] ?? 'Cobranza';

  return (
    <div className="min-h-screen flex bg-[#0a0f1a] text-white">
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-white/10 bg-[#0a0f1a]
          transform transition-transform duration-200 ease-out lg:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between lg:block">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#1e40af]/30 flex items-center justify-center border border-[#1e40af]/50">
              <GraduationCap className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Agentia Cobranza</p>
              <p className="text-xs text-slate-500">Instituto Meridian</p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/demo/cobranza' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[#1e40af] text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1e40af]/40 flex items-center justify-center text-sm font-semibold border border-[#1e40af]/60 shrink-0">
            MG
          </div>
          <p className="text-sm text-slate-300 truncate">
            <span className="font-medium text-white">María González</span>
            <span className="text-slate-500"> · </span>
            <span className="text-slate-500">Asesora</span>
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-md">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 -ml-1"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight flex-1">{sectionTitle}</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white shrink-0">
            DEMO
          </span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
