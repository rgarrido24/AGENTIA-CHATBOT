'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Boxes,
  CalendarDays,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  RefreshCw,
  Scissors,
  Sparkles,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { BarberProvider, useBarber } from './barber-context';
import { GIRO_CONFIGS, type GiroId } from './giro-config';
import GiroSelector from './GiroSelector';

type NavItem = { suffix: string; label: string; icon: typeof LayoutDashboard };

const NAV_ITEMS: NavItem[] = [
  { suffix: '',                label: 'Dashboard',         icon: LayoutDashboard },
  { suffix: '/clientes',       label: 'Clientes',          icon: Users },
  { suffix: '/servicios',      label: 'Servicios',         icon: Scissors },
  { suffix: '/agenda',         label: 'Agenda',            icon: CalendarDays },
  { suffix: '/recordatorios',  label: 'Recordatorios',     icon: Bell },
  { suffix: '/comisiones',     label: 'Comisiones',        icon: Wallet },
  { suffix: '/inventario',     label: 'Inventario',        icon: Boxes },
  { suffix: '/finanzas',       label: 'Ingresos vs Gastos',icon: DollarSign },
  { suffix: '/chat',           label: 'Chat IA',           icon: MessageCircle },
  { suffix: '/precios',        label: 'Planes y Precios',  icon: CreditCard },
];

const TITLE_BY_SUFFIX: Record<string, string> = {
  '':               'Dashboard',
  '/clientes':      'Clientes',
  '/servicios':     'Servicios',
  '/agenda':        'Agenda',
  '/recordatorios': 'Recordatorios',
  '/comisiones':    'Comisiones',
  '/inventario':    'Inventario',
  '/finanzas':      'Ingresos vs Gastos',
  '/chat':          'Chat IA',
  '/precios':       'Planes y Precios',
};

function deriveBasePath(pathname: string): '/demo/barber' | '/demo/nailstudio' {
  return pathname.startsWith('/demo/nailstudio') ? '/demo/nailstudio' : '/demo/barber';
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { giro, setGiro } = useBarber();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);

  const basePath = deriveBasePath(pathname);
  const otherBasePath = basePath === '/demo/barber' ? '/demo/nailstudio' : '/demo/barber';
  const suffix = pathname === basePath ? '' : pathname.slice(basePath.length);
  const sectionTitle = TITLE_BY_SUFFIX[suffix] ?? 'Dashboard';

  const NAV = NAV_ITEMS.map((n) => ({
    href: `${basePath}${n.suffix}`,
    label: n.label,
    icon: n.icon,
  }));

  const cfg = giro ? GIRO_CONFIGS[giro] : null;
  const ACCENT = cfg?.acento ?? '#0d9488';
  const ACCENT_SOFT = cfg?.acentoSoft ?? 'rgba(13,148,136,0.22)';
  const isNail = giro === 'nail';

  // Sync light/dark with giro default when first selected
  useEffect(() => {
    if (cfg) setLight(!cfg.temaOscuro);
  }, [giro]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !light);
    return () => document.documentElement.classList.remove('dark');
  }, [light]);

  // Show giro selector until a giro is chosen
  if (!giro) {
    return <GiroSelector onSelect={(g) => { setGiro(g); }} />;
  }

  const bg = light ? 'bg-zinc-100 text-zinc-900' : 'bg-[#0a0f1a] text-white';
  const sidebarBg = light ? 'bg-white border-zinc-200' : 'bg-[#0a0f1a] border-white/10';
  const muted = light ? 'text-zinc-500' : 'text-slate-500';
  const navInactive = light ? 'text-zinc-600 hover:bg-zinc-100' : 'text-slate-400 hover:bg-white/5 hover:text-white';
  const headerBg = light ? 'bg-white/90 border-zinc-200' : 'bg-[#0a0f1a]/95 border-white/10';
  const LogoIcon = isNail ? Sparkles : Scissors;
  const staffLabel = isNail ? 'Nail Artist' : 'Barbero';
  const ownerInitial = isNail ? 'S' : 'C';
  const ownerName = isNail ? 'Sofia' : 'Carlos';

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
              <LogoIcon className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{isNail ? 'Agentia Nail' : 'Agentia Barbería'}</p>
              <p className={`text-xs ${muted}`}>{cfg?.nombre}</p>
            </div>
          </div>
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg ${light ? 'hover:bg-zinc-100' : 'hover:bg-white/10'}`}
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== basePath && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'text-white shadow-lg' : navInactive
                }`}
                style={active ? { background: ACCENT, boxShadow: `0 8px 24px ${ACCENT}55` } : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Ver la otra demo (route-based, sin localStorage trickery) */}
        <div className={`px-3 pb-2 border-t ${light ? 'border-zinc-200' : 'border-white/10'} pt-2`}>
          <Link
            href={otherBasePath}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-colors ${navInactive}`}
          >
            {isNail ? <Scissors className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {isNail ? 'Ver demo Barbería' : 'Ver demo Nail Studio'}
          </Link>
        </div>

        <div className={`p-4 border-t ${light ? 'border-zinc-200' : 'border-white/10'} flex items-center gap-3`}>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border shrink-0"
            style={{ background: ACCENT_SOFT, borderColor: `${ACCENT}66` }}
          >
            {ownerInitial}
          </div>
          <p className={`text-sm truncate ${light ? 'text-zinc-700' : 'text-slate-300'}`}>
            <span className="font-medium">{ownerName}</span>
            <span className={muted}> · {staffLabel}</span>
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
            {light ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" style={{ color: ACCENT }} />}
          </button>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-500 text-white shrink-0">DEMO</span>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}

export default function BarberShell({
  children,
  forceGiro = null,
}: {
  children: React.ReactNode;
  /** Forzar giro cuando la ruta es dedicada (ej. /demo/nailstudio fuerza 'nail'). */
  forceGiro?: GiroId | null;
}) {
  return (
    <BarberProvider forceGiro={forceGiro}>
      <ShellInner>{children}</ShellInner>
    </BarberProvider>
  );
}
