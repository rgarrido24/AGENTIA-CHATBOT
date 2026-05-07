'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAnalytics, useVisitorStatus } from '@/src/lib/analytics-client';
import {
  Menu,
  X,
  Users,
  BookOpen,
  Megaphone,
  Calendar,
  Settings,
  BarChart3,
  Smartphone,
  LayoutDashboard,
  Target,
  DollarSign,
  Building2,
} from 'lucide-react';

export type BrandConfig = {
  logoUrl?: string;
  logoAlt?: string;
  primaryColor?: string;
  accentColor?: string;
  name?: string;
  /** Si true, solo muestra el logo sin texto (el logo ya trae el nombre) */
  logoOnly?: boolean;
};

const defaultBrand: BrandConfig = {
  logoUrl: '/logo-agentia-2026.png',
  logoAlt: 'Agentia',
  name: 'Agentia',
  logoOnly: true,
};

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/prospectos', label: 'Prospectos', icon: Target },
  { href: '/dashboard/knowledge', label: 'Conocimiento', icon: BookOpen },
  { href: '/dashboard/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  { href: '/dashboard/analytics', label: 'Analítica', icon: BarChart3 },
  { href: '/dashboard/whatsapp', label: 'Vincular WhatsApp', icon: Smartphone },
  { href: '/dashboard/finanzas', label: 'Finanzas', icon: DollarSign },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Building2 },
];

export default function Layout({
  children,
  brand = defaultBrand,
}: {
  children: React.ReactNode;
  brand?: BrandConfig;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Tracking global (incluye /dashboard). El modo ADMIN (localStorage) evita cualquier escritura en Mongo.
  useAnalytics();
  const { status: visitorStatus, admin } = useVisitorStatus();

  const NavLink = ({
    href,
    label,
    icon: Icon,
    external,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    external?: boolean;
  }) => {
    const isActive = !external && (pathname === href || (href !== '/dashboard' && pathname.startsWith(href)));
    const baseClass =
      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300';
    const activeClass = isActive
      ? 'bg-forest/20 border border-forest text-sage'
      : 'text-slate-400 hover:border-forest/50 hover:text-sage border border-transparent hover:bg-forest/10';

    const content = (
      <>
        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-sage' : 'text-inherit'}`} />
        <span>{label}</span>
      </>
    );

    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClass} ${activeClass}`}
        >
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className={`${baseClass} ${activeClass}`}>
        {content}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex bg-luxury">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-40 w-64 bg-luxury border-r border-forest/40" style={{ backdropFilter: 'blur(12px)' }}>
          <div className="flex flex-col flex-1 pt-6 pb-4">
          <div className={`flex items-center px-4 mb-8 ${brand.logoOnly ? 'justify-center' : 'gap-3'}`}>
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={brand.logoAlt ?? brand.name ?? 'Logo'}
                width={64}
                height={64}
                className="rounded-lg object-contain w-16 h-16 shrink-0 mix-blend-normal"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-forest border border-forest">
                <span className="text-sage font-bold text-2xl">
                  {(brand.name ?? 'A')[0]}
                </span>
              </div>
            )}
            {!brand.logoOnly && (
              <span className="font-semibold text-lg title-tracking text-white truncate">
                {brand.name ?? 'Agentia'}
              </span>
            )}
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navLinks.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </nav>
        </div>

        <div className="px-4 py-4 border-t border-forest/30">
          <div className="mb-2">
            {admin ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                ADMIN · sin tracking
              </span>
            ) : visitorStatus ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-forest/40 bg-forest/10 px-2.5 py-1 text-[11px] font-semibold text-sage">
                {visitorStatus.isNew ? 'Nuevo' : `Recurrente (${visitorStatus.visits} visitas)`}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {brand.name ?? 'Agentia'}
          </p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-luxury border-b border-forest/40" style={{ backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/dashboard" className={`flex items-center ${brand.logoOnly ? '' : 'gap-2'}`}>
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={brand.logoAlt ?? brand.name ?? 'Logo'}
                width={44}
                height={44}
                className="rounded-lg object-contain w-11 h-11 shrink-0 mix-blend-normal"
              />
            ) : (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-forest">
                <span className="text-sage font-bold text-lg">
                  {(brand.name ?? 'A')[0]}
                </span>
              </div>
            )}
            {!brand.logoOnly && (
              <span className="font-semibold text-white">{brand.name ?? 'Agentia'}</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-slate-400 hover:text-sage hover:bg-forest/20 transition-all duration-300"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="px-4 py-4 border-t border-forest/40 space-y-1 max-h-[70vh] overflow-y-auto bg-luxury">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)));
              const linkClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 ${
                isActive
                  ? 'bg-forest/20 border border-forest text-sage'
                  : 'text-slate-400 hover:border-forest/50 hover:text-sage border border-transparent hover:bg-forest/10'
              }`;
              const content = (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-sage' : ''}`} />
                  <span>{item.label}</span>
                </>
              );
              if (item.href.startsWith('http')) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className={linkClass}
                  >
                    {content}
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={linkClass}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 bg-luxury">
        <main className="flex-1 pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  );
}
