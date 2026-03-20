import Link from 'next/link';
import { Users, BookOpen, Megaphone, Calendar, Settings, BarChart3 } from 'lucide-react';

const modules = [
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/dashboard/knowledge', label: 'Conocimiento', icon: BookOpen },
  { href: '/dashboard/calendar', label: 'Calendario', icon: Calendar },
  { href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  { href: '/dashboard/analytics', label: 'Analítica', icon: BarChart3 },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 bg-luxury">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 title-tracking font-heading text-white">
          Dashboard
        </h1>
        <p className="text-slate-400 mb-12 font-sans">
          Accede a los módulos del CRM
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="card-glass p-6 flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-forest/30 border border-forest flex items-center justify-center shrink-0 group-hover:border-sage transition-colors">
                <Icon className="w-6 h-6 text-sage" />
              </div>
              <span className="font-semibold text-white">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
