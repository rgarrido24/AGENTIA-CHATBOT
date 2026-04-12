'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Car,
  ClipboardList,
  DollarSign,
  FileText,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Smartphone,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import { TallerProvider, useTaller } from './taller-context';

const ACCENT = '#475569';
const ACCENT_SOFT = 'rgba(71, 85, 105, 0.28)';

const NAV = [
  { href: '/demo/taller', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demo/taller/ordenes', label: 'Órdenes de Servicio', icon: ClipboardList },
  { href: '/demo/taller/vehiculos', label: 'Vehículos', icon: Car },
  { href: '/demo/taller/seguimiento', label: 'Seguimiento Cliente', icon: Smartphone },
  { href: '/demo/taller/presupuestos', label: 'Presupuestos', icon: FileText },
  { href: '/demo/taller/inventario', label: 'Refacciones', icon: Package },
  { href: '/demo/taller/caja', label: 'Caja', icon: DollarSign },
  { href: '/demo/taller/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/demo/taller/chat', label: 'Asistente IA', icon: MessageCircle },
  { href: '/demo/taller/precios', label: '💼 Planes y Precios', icon: DollarSign },
] as const;

const TITLE_MAP: Record<string, string> = {
  '/demo/taller': 'Dashboard',
  '/demo/taller/ordenes': 'Órdenes de Servicio',
  '/demo/taller/vehiculos': 'Vehículos',
  '/demo/taller/seguimiento': 'Seguimiento Cliente',
  '/demo/taller/presupuestos': 'Presupuestos',
  '/demo/taller/inventario': 'Refacciones',
  '/demo/taller/caja': 'Caja',
  '/demo/taller/recordatorios': 'Recordatorios',
  '/demo/taller/chat': 'Asistente IA',
  '/demo/taller/precios': 'Planes y Precios',
};

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { inventario } = useTaller();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const sectionTitle = TITLE_MAP[pathname] ?? 'Taller';
  const alertasInv = useMemo(
    () => inventario.filter((i) => i.stock <= i.minimo).length,
    [inventario]
  );

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
              <Wrench className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Agentia Taller</p>
              <p className={`text-xs ${muted}`}>AutoPro — Servicio Confiable</p>
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
              pathname === href || (href !== '/demo/taller' && pathname.startsWith(href));
            const badge =
              href === '/demo/taller/inventario' && alertasInv > 0 ? alertasInv : null;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                  active ? 'text-white shadow-lg' : navInactive
                }`}
                style={
                  active
                    ? { background: ACCENT, boxShadow: `0 8px 24px ${ACCENT}66` }
                    : undefined
                }
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                <span className="flex-1">{label}</span>
                {badge != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${light ? 'border-zinc-200' : 'border-white/10'}`}>
          <p className={`text-xs text-center ${muted}`}>Recepción · AutoPro</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md ${headerBg}`}
        >
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
            {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-300" />}
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-600 text-white shrink-0">DEMO</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

export default function TallerShell({ children }: { children: React.ReactNode }) {
  return (
    <TallerProvider>
      <ShellInner>{children}</ShellInner>
    </TallerProvider>
  );
}
