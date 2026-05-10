'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FlaskConical,
  Heart,
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
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { BRAND_NUTRICION } from '@/lib/mock-data-nutricion';
import { NutricionProvider } from './nutricion-context';
import { NutricionThemeProvider, useNutricionTheme } from './nutricion-theme-context';

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
  { href: '/demo/nutricion/laboratorio',    label: 'Laboratorio',           icon: FlaskConical   },
  { href: '/demo/nutricion/cardiovascular', label: 'Riesgo Cardiovascular',  icon: Heart          },
  { href: '/demo/nutricion/expediente',     label: 'Expediente',             icon: ClipboardList  },
  { href: '/demo/nutricion/finanzas',       label: 'Finanzas',               icon: Wallet         },
  { href: '/demo/nutricion/precios',        label: 'Planes y Precios',       icon: CreditCard     },
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
  '/demo/nutricion/laboratorio': 'Análisis de Laboratorio',
  '/demo/nutricion/cardiovascular': 'Riesgo Cardiovascular',
  '/demo/nutricion/expediente': 'Expediente del Paciente',
  '/demo/nutricion/finanzas': 'Finanzas',
  '/demo/nutricion/precios': 'Planes y Precios',
};

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, colors, toggleTheme } = useNutricionTheme();
  const sectionTitle = TITLE_MAP[pathname] ?? 'Nutrición';
  const isLight = theme === 'light';

  const navInactiveColor = isLight ? '#4b5563' : '#94a3b8';

  return (
    <div
      className="min-h-screen flex transition-colors"
      style={{ background: colors.pageBg, color: colors.textPrimary }}
    >
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
          fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
          transform transition-transform duration-200 ease-out lg:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: colors.sidebarBg,
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div
          className="p-4 flex items-center justify-between lg:block"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ background: ACCENT_SOFT, borderColor: `${ACCENT}55` }}
            >
              <Salad className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight" style={{ color: colors.textPrimary }}>
                Agentia Nutrición
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {BRAND_NUTRICION.centro.split('—')[0]?.trim()}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg"
            style={{ color: colors.textSecondary }}
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="px-4 pt-3 text-[11px]" style={{ color: isLight ? ACCENT : AMBER }}>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                style={
                  active
                    ? { background: ACCENT, color: '#fff', boxShadow: `0 8px 24px rgba(22,163,74,0.35)` }
                    : { color: navInactiveColor }
                }
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = colors.hoverBg;
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                }}
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          className="p-4"
          style={{ borderTop: `1px solid ${colors.border}` }}
        >
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {BRAND_NUTRICION.doctora}
            <span style={{ color: colors.textMuted }}> · </span>
            <span className="font-medium" style={{ color: ACCENT }}>Nutrióloga</span>
          </p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
          style={{
            background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10,26,18,0.95)',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg -ml-1"
            style={{ color: colors.textSecondary }}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold tracking-tight flex-1" style={{ color: colors.textPrimary }}>
            {sectionTitle}
          </h1>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ color: colors.textSecondary }}
            aria-label={isLight ? 'Modo oscuro' : 'Modo claro'}
          >
            {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-emerald-400" />}
          </button>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white shrink-0"
            style={{ background: AMBER }}
          >
            DEMO
          </span>
        </header>

        <main
          className="flex-1 p-4 md:p-6 overflow-x-auto"
          style={{ background: colors.pageBg }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function NutriShell({ children }: { children: React.ReactNode }) {
  return (
    <NutricionThemeProvider>
      <NutricionProvider>
        <ShellInner>{children}</ShellInner>
      </NutricionProvider>
    </NutricionThemeProvider>
  );
}
