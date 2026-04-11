'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  Salad,
  ScanLine,
  Sun,
  TrendingUp,
  UtensilsCrossed,
  Users,
  X,
} from 'lucide-react';
import { BRAND_NUTRICION } from '@/lib/mock-data-nutricion';
import { NutricionProvider } from './nutricion-context';

const ACCENT = '#16a34a';
const ACCENT_SOFT = 'rgba(22, 163, 74, 0.2)';
const AMBER = '#f59e0b';

const NAV = [
  { href: '/demo/nutricion', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demo/nutricion/pacientes', label: 'Mis Pacientes', icon: Users },
  { href: '/demo/nutricion/tablero', label: 'Tablero de Resultados', icon: TrendingUp },
  { href: '/demo/nutricion/dietas', label: 'Planes de Dieta', icon: UtensilsCrossed },
  { href: '/demo/nutricion/equivalentes', label: 'Tabla SMAE', icon: BookOpen },
  { href: '/demo/nutricion/plan-semanal', label: 'Plan Semanal IA', icon: CalendarDays },
  { href: '/demo/nutricion/inbody', label: 'Registro InBody', icon: ScanLine },
  { href: '/demo/nutricion/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/demo/nutricion/chat', label: 'Asistente IA', icon: MessageCircle },
] as const;

const TITLE_MAP: Record<string, string> = {
  '/demo/nutricion': 'Dashboard',
  '/demo/nutricion/pacientes': 'Mis Pacientes',
  '/demo/nutricion/tablero': 'Tablero de Resultados',
  '/demo/nutricion/dietas': 'Planes de Dieta',
  '/demo/nutricion/equivalentes': 'Tabla SMAE',
  '/demo/nutricion/plan-semanal': 'Plan Semanal IA',
  '/demo/nutricion/inbody': 'Registro InBody',
  '/demo/nutricion/recordatorios': 'Recordatorios',
  '/demo/nutricion/chat': 'Asistente IA',
};

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const sectionTitle = TITLE_MAP[pathname] ?? 'Nutrición';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !light);
    return () => document.documentElement.classList.remove('dark');
  }, [light]);

  const bg = light ? 'bg-emerald-50/90 text-zinc-900' : 'bg-[#07120c] text-white';
  const sidebarBg = light ? 'bg-white border-emerald-200' : 'bg-[#0a1a12] border-white/10';
  const muted = light ? 'text-zinc-500' : 'text-slate-500';
  const navInactive = light
    ? 'text-zinc-600 hover:bg-emerald-50'
    : 'text-slate-400 hover:bg-white/5 hover:text-white';
  const headerBg = light ? 'bg-white/95 border-emerald-100' : 'bg-[#0a1a12]/95 border-white/10';

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
        <div
          className={`p-4 border-b ${light ? 'border-emerald-100' : 'border-white/10'} flex items-center justify-between lg:block`}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ background: ACCENT_SOFT, borderColor: `${ACCENT}55` }}
            >
              <Salad className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Agentia Nutrición</p>
              <p className={`text-xs ${muted}`}>{BRAND_NUTRICION.centro.split('—')[0]?.trim()}</p>
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

        <p className={`px-4 pt-3 text-[11px] ${muted}`} style={{ color: light ? undefined : AMBER }}>
          {BRAND_NUTRICION.tagline}
        </p>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/demo/nutricion' && pathname.startsWith(href));
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
                    ? { background: ACCENT, boxShadow: `0 8px 24px rgba(22,163,74,0.4)` }
                    : undefined
                }
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${light ? 'border-emerald-100' : 'border-white/10'}`}>
          <p className={`text-xs ${light ? 'text-zinc-600' : 'text-slate-400'}`}>
            {BRAND_NUTRICION.doctora}
            <span className={muted}> · </span>
            <span className="font-medium" style={{ color: ACCENT }}>
              Nutrióloga
            </span>
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className={`sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md ${headerBg}`}>
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg -ml-1 ${light ? 'hover:bg-emerald-50' : 'hover:bg-white/10'}`}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight flex-1">{sectionTitle}</h1>
          <button
            type="button"
            onClick={() => setLight((v) => !v)}
            className={`p-2 rounded-lg ${light ? 'hover:bg-emerald-50' : 'hover:bg-white/10'}`}
            aria-label={light ? 'Modo oscuro' : 'Modo claro'}
          >
            {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-emerald-400" />}
          </button>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
            style={{ background: AMBER }}
          >
            DEMO
          </span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

export default function NutriShell({ children }: { children: React.ReactNode }) {
  return (
    <NutricionProvider>
      <ShellInner>{children}</ShellInner>
    </NutricionProvider>
  );
}
