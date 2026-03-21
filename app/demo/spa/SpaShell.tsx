'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { SpaProvider } from './spa-context';

const ACCENT = '#9333ea';
const ACCENT_SOFT = 'rgba(147, 51, 234, 0.22)';

const NAV = [
  { href: '/demo/spa', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demo/spa/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/demo/spa/clientes', label: 'Clientes', icon: Users },
  { href: '/demo/spa/servicios', label: 'Servicios', icon: Sparkles },
  { href: '/demo/spa/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/demo/spa/chat', label: 'Chat IA', icon: MessageCircle },
] as const;

const TITLE_MAP: Record<string, string> = {
  '/demo/spa': 'Dashboard',
  '/demo/spa/agenda': 'Agenda',
  '/demo/spa/clientes': 'Clientes',
  '/demo/spa/servicios': 'Servicios',
  '/demo/spa/recordatorios': 'Recordatorios',
  '/demo/spa/chat': 'Chat IA',
};

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const sectionTitle = TITLE_MAP[pathname] ?? 'Spa';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !light);
    return () => document.documentElement.classList.remove('dark');
  }, [light]);

  const bg = light ? 'bg-zinc-100 text-zinc-900' : 'bg-[#0a0f1a] text-white';
  const sidebarBg = light ? 'bg-white border-zinc-200' : 'bg-[#0a0f1a] border-white/10';
  const muted = light ? 'text-zinc-500' : 'text-slate-500';
  const navInactive = light ? 'text-zinc-600 hover:bg-zinc-100' : 'text-slate-400 hover:bg-white/5 hover:text-white';
  const headerBg = light ? 'bg-white/90 border-zinc-200' : 'bg-[#0a0f1a]/95 border-white/10';

  return (
    <div className={`min-h-screen flex transition-colors ${bg}`}>
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

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col border-r ${sidebarBg}
          transform transition-transform duration-200 ease-out lg:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className={`p-4 border-b ${light ? 'border-zinc-200' : 'border-white/10'} flex items-center justify-between lg:block`}>
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ background: ACCENT_SOFT, borderColor: `${ACCENT}55` }}
            >
              <Sparkles className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Agentia Spa</p>
              <p className={`text-xs ${muted}`}>Lumina Spa & Estética</p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== '/demo/spa' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'text-white shadow-lg' : navInactive
                }`}
                style={
                  active
                    ? { background: ACCENT, boxShadow: `0 8px 24px rgba(147,51,234,0.35)` }
                    : undefined
                }
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${light ? 'border-zinc-200' : 'border-white/10'} flex items-center gap-3`}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border shrink-0"
            style={{ background: ACCENT_SOFT, borderColor: `${ACCENT}66` }}
          >
            AF
          </div>
          <p className={`text-sm truncate ${light ? 'text-zinc-700' : 'text-slate-300'}`}>
            <span className="font-medium">Ana Flores</span>
            <span className={muted}> · </span>
            <span className={muted}>Recepcionista</span>
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md ${headerBg}`}>
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg -ml-1 ${light ? 'hover:bg-zinc-100' : 'hover:bg-white/10'}`}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight flex-1">{sectionTitle}</h1>
          <button
            type="button"
            onClick={() => setLight((v) => !v)}
            className={`p-2 rounded-lg ${light ? 'hover:bg-zinc-100' : 'hover:bg-white/10'}`}
            aria-label={light ? 'Modo oscuro' : 'Modo claro'}
          >
            {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-fuchsia-300" />}
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white shrink-0">DEMO</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

export default function SpaShell({ children }: { children: React.ReactNode }) {
  return (
    <SpaProvider>
      <ShellInner>{children}</ShellInner>
    </SpaProvider>
  );
}
