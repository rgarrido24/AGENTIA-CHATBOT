'use client';

export type AgentiaPreciosProps = {
  giro: string;
  accentColor: string;
  features: {
    starter: string[];
    pro: string[];
    premium: string[];
  };
};

const PLANES = [
  {
    key: 'starter' as const,
    nombre: 'Starter',
    precio: 399,
    badge: null,
    mensajes: '300 msgs WA/mes',
    registros: '30 registros',
    borde: 'border-white/15',
    fondo: 'bg-white/[0.03]',
    btnBase: 'bg-white/10 hover:bg-white/15 text-white',
  },
  {
    key: 'pro' as const,
    nombre: 'Profesional',
    precio: 599,
    badge: '⭐ MÁS POPULAR',
    mensajes: '1,500 msgs WA/mes',
    registros: 'Ilimitados',
    borde: '',       // dinámico con accent
    fondo: '',       // dinámico con accent
    btnBase: 'text-white font-bold',
  },
  {
    key: 'premium' as const,
    nombre: 'Premium',
    precio: 899,
    badge: null,
    mensajes: 'Mensajes ilimitados',
    registros: 'Ilimitados',
    borde: 'border-amber-600/50',
    fondo: 'bg-amber-950/10',
    btnBase: 'bg-amber-700 hover:bg-amber-600 text-white font-bold',
  },
] as const;

function waLink(plan: string, giro: string): string {
  const texto = encodeURIComponent(
    `Hola, me interesa el plan ${plan} de Agentia para ${giro}. ¿Me pueden dar más información?`
  );
  return `https://wa.me/529998080265?text=${texto}`;
}

export default function AgentiaPrecios({ giro, accentColor, features }: AgentiaPreciosProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">💼 Planes y Precios</h1>
        <p className="text-slate-400 text-sm">
          Comienza hoy — sin permanencia, sin sorpresas
        </p>
        <p className="text-xs text-slate-500">
          Sistema Agentia para{' '}
          <span className="font-semibold" style={{ color: accentColor }}>
            {giro}
          </span>
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANES.map((plan) => {
          const feats = features[plan.key];
          const isProCard = plan.key === 'pro';

          const borderClass = isProCard ? '' : plan.borde;
          const bgClass = isProCard ? '' : plan.fondo;
          const borderStyle = isProCard
            ? { borderColor: accentColor, borderWidth: '1.5px' }
            : {};
          const bgStyle = isProCard
            ? { background: `${accentColor}10` }
            : {};

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border flex flex-col overflow-hidden transition-all ${borderClass} ${bgClass}`}
              style={{ ...borderStyle, ...bgStyle }}
            >
              {/* Badge "Más popular" */}
              {plan.badge && (
                <div
                  className="text-center py-1.5 text-[11px] font-bold tracking-wider text-white"
                  style={{ background: accentColor }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="p-5 flex flex-col flex-1 space-y-4">
                {/* Nombre + precio */}
                <div>
                  <p className="text-base font-bold text-white">{plan.nombre}</p>
                  <div className="flex items-end gap-1 mt-1">
                    <span
                      className="text-3xl font-extrabold tabular-nums"
                      style={{ color: isProCard ? accentColor : plan.key === 'premium' ? '#f59e0b' : '#e2e8f0' }}
                    >
                      ${plan.precio.toLocaleString('es-MX')}
                    </span>
                    <span className="text-slate-400 text-sm mb-1">MXN/mes</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">+ $500 activación única</p>
                </div>

                {/* Límites */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-emerald-400">💬</span>
                    {plan.mensajes}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-sky-400">📋</span>
                    {plan.registros}
                  </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-white/10" />

                {/* Features */}
                <ul className="space-y-1.5 flex-1">
                  {feats.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span
                        className="mt-0.5 flex-shrink-0 font-bold"
                        style={{ color: isProCard ? accentColor : plan.key === 'premium' ? '#f59e0b' : '#22c55e' }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Botón */}
                <a
                  href={waLink(plan.nombre, giro)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center w-full py-3 rounded-xl text-sm transition-colors ${
                    isProCard ? 'text-white font-bold' : plan.btnBase
                  }`}
                  style={isProCard ? { background: accentColor } : {}}
                >
                  Contratar {plan.nombre} →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota al pie */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center space-y-1">
        <p className="text-xs text-slate-400">
          * Precio de activación único <span className="text-white font-semibold">$500 MXN</span>
        </p>
        <p className="text-xs text-slate-500">
          Sin permanencia · Cancela cuando quieras · Soporte por WhatsApp incluido en todos los planes
        </p>
        <a
          href="https://wa.me/529998080265?text=Hola%2C+quiero+m%C3%A1s+informaci%C3%B3n+sobre+Agentia"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold mt-2"
          style={{ color: accentColor }}
        >
          💬 ¿Dudas? Escríbenos por WhatsApp
        </a>
      </div>
    </div>
  );
}
