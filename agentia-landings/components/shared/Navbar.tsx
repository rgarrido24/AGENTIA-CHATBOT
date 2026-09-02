"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PRODUCTS = [
  { href: "/chatbot", label: "Chatbot" },
  { href: "/crm", label: "CRM" },
  { href: "/ecommerce", label: "Tienda Online" },
  { href: "/lealtad", label: "Lealtad" },
  { href: "/paginas-web", label: "Páginas Web" },
  { href: "/rastreo", label: "Rastreo" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="ag-navbar">
      <div className="ag-navbar-inner">
        <a href="https://agentia.software" className="ag-logo">
          agentia<span>.</span>software
        </a>
        <nav className="ag-nav-links">
          {PRODUCTS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={
                "ag-nav-link" +
                (pathname?.startsWith(p.href) ? " ag-nav-link--active" : "")
              }
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
