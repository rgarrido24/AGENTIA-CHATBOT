import Link from 'next/link';
import {
  AGENTIA_WHATSAPP_DISPLAY,
  agentiaWhatsAppUrl,
} from '@/lib/agentia-contact';
import { PRODUCT_NAV } from '@/components/shared/product-nav';

export default function Footer() {
  const waUrl = agentiaWhatsAppUrl('Hola Agentia, quiero información de sus sistemas.');

  return (
    <footer className="border-t border-white/8 px-4 pb-28 pt-12 text-sm text-white/40 sm:pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-space)] text-base text-white/80">Agentia</p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed">
            Automatizamos negocios que quieren crecer sin contratar más gente. Partner Meta WhatsApp
            Business API.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]" aria-label="Productos">
          {PRODUCT_NAV.map((p) => (
            <Link key={p.href} href={p.href} className="hover:text-[#00D4FF]">
              {p.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-6xl text-[13px]">
        <p>
          <a href={waUrl} className="hover:text-[#00D4FF]">
            WhatsApp {AGENTIA_WHATSAPP_DISPLAY}
          </a>
          {' · '}
          <a href="mailto:contacto@agentia.software" className="hover:text-[#00D4FF]">
            contacto@agentia.software
          </a>
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <Link href="/legal/terminos" className="hover:text-white/70">
            Términos
          </Link>
          <Link href="/legal/privacidad" className="hover:text-white/70">
            Privacidad
          </Link>
        </div>
        <p className="mt-6">© {new Date().getFullYear()} Agentia</p>
      </div>
    </footer>
  );
}
