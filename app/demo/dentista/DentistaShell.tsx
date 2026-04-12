'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  Pill,
  Settings,
  Stethoscope,
  Sun,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { DentistaProvider } from './dentista-context';

const ACCENT = '#0284c7';
const ACCENT_SOFT = 'rgba(2, 132, 199, 0.18)';

const NAV = [
  { href: '/demo/dentista', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demo/dentista/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/demo/dentista/pacientes', label: 'Pacientes', icon: Users },
  { href: '/demo/dentista/expediente', label: 'Expediente', icon: FileText },
  { href: '/demo/dentista/recetas', label: 'Recetas', icon: Pill },
  { href: '/demo/dentista/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/demo/dentista/chat', label: 'Asistente IA', icon: MessageCircle },
  { href: '/demo/dentista/configuracion', label: 'Configuración', icon: Settings },
  { href: '/demo/dentista/precios', label: '💼 Planes y Precios', icon: Tag },
] as const;

const TITLE_MAP: Record<string, string> = {
  '/demo/dentista': 'Dashboard',
  '/demo/dentista/agenda': 'Agenda',
  '/demo/dentista/pacientes': 'Pacientes',
  '/demo/dentista/expediente': 'Expediente',
  '/demo/dentista/recetas': 'Recetas',
  '/demo/dentista/pagos': 'Pagos',
  '/demo/dentista/chat': 'Asistente IA',
  '/demo/dentista/configuracion': 'Configuración',
  '/demo/dentista/precios': 'Planes y Precios',
};

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const sectionTitle = pathname.startsWith('/demo/dentista/expediente')
    ? 'Expediente'
    : TITLE_MAP[pathname] ?? 'Dental';

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
              <Stethoscope className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Agentia Dental</p>
              <p className={`text-xs ${muted}`}>Clínica Dental Sonrisa Perfecta</p>
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
            const active = pathname === href || (href !== '/demo/dentista' && pathname.startsWith(href));
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
                    ? { background: ACCENT, boxShadow: `0 8px 24px rgba(2,132,199,0.35)` }
                    : undefined
                }
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${light ? 'border-zinc-200' : 'border-white/10'}`}>
          <p className={`text-sm ${light ? 'text-zinc-700' : 'text-slate-300'}`}>
            <span className="font-medium">Recepción</span>
            <span className={muted}> · </span>
            <span className={muted}>Clínica Sonrisa</span>
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
            {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-sky-400" />}
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-600 text-white shrink-0">DEMO</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DentistaShell({ children }: { children: React.ReactNode }) {
  return (
    <DentistaProvider>
      <ShellInner>{children}</ShellInner>
    </DentistaProvider>
  );
}
