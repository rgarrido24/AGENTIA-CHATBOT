'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Baby,
  Clock3,
  CreditCard,
  LogIn,
  LogOut,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { formatMinutesHuman, formatPhone, formatTimer, loyaltyProgress, onlyDigits } from '@/lib/pakalitos-fest/pricing';
import { useLudoteca } from '@/lib/pakalitos-fest/store';
import { LOYALTY_EVERY_HOURS, PACKAGES, PRICE_TIERS, RATE_1H_SOLO } from '@/lib/pakalitos-fest/types';

type Tab = 'piso' | 'checkin' | 'membresias' | 'caja';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('piso');
  const { activos, tutors, caja } = useLudoteca();

  return (
    <main className="relative z-[1] px-4 py-5 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink-mist font-semibold">
            Recepción · Ludoteca
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-ink mt-1">
            Pakalitos Fest
          </h1>
          <p className="text-ink-mist mt-1 text-[15px] max-w-xl">
            Un solo perfil de tutor: tiempo de juego, membresía y lealtad por horas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatChip icon={<Users className="h-4 w-4" />} label="En juego" value={String(activos.length)} />
          <StatChip
            icon={<CreditCard className="h-4 w-4" />}
            label="Membresías"
            value={String(tutors.filter((t) => t.membresiaActiva).length)}
          />
          <StatChip
            icon={<Wallet className="h-4 w-4" />}
            label="Caja hoy"
            value={`$${caja.sesiones.reduce((s, x) => s + x.montoCobrado, 0) + caja.recargasMembresia.reduce((s, x) => s + x.monto, 0)}`}
          />
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-2xl bg-white/55 border border-limestone-line shadow-card backdrop-blur-sm">
        {(
          [
            { id: 'piso', label: 'En juego', icon: Clock3 },
            { id: 'checkin', label: 'Check-in', icon: LogIn },
            { id: 'membresias', label: 'Membresías', icon: CreditCard },
            { id: 'caja', label: 'Caja del día', icon: Wallet },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`touch-target flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? 'bg-ink text-limestone shadow-lift'
                  : 'text-ink-mist hover:bg-white/80 hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab === 'piso' && <FloorBoard onNeedCheckIn={() => setTab('checkin')} />}
      {tab === 'checkin' && <CheckInPanel onDone={() => setTab('piso')} />}
      {tab === 'membresias' && <MembershipsPanel />}
      {tab === 'caja' && <CashSummary />}
    </main>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-limestone-line bg-white/70 px-4 py-3 shadow-card min-w-[120px]">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-mist font-semibold">
        {icon}
        {label}
      </div>
      <p className="font-display text-2xl font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function PriceBoard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fest-soft/90 mb-3">
        Lista de precios
      </p>
      <ul className="space-y-2 text-sm">
        {PRICE_TIERS.map((t) => (
          <li key={t.hours} className="flex justify-between gap-3 border-b border-white/10 pb-2 last:border-0 last:pb-0">
            <span className="text-limestone/85">
              {t.hours} hora{t.hours > 1 ? 's' : ''}
            </span>
            <span className="tabular-nums text-right">
              <strong className="text-white">${t.solo}</strong>
              <span className="text-limestone/45"> · </span>
              <span className="text-fest-soft">niñera ${t.ninera}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-limestone/45 mt-3 leading-relaxed">
        Lealtad: cada {LOYALTY_EVERY_HOURS}h entregadas → 1h gratis al saldo.
      </p>
    </div>
  );
}

function CheckInPanel({ onDone }: { onDone: () => void }) {
  const { checkIn, findTutorByPhone } = useLudoteca();
  const [nino, setNino] = useState('');
  const [tutorNombre, setTutorNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [conNinera, setConNinera] = useState(false);
  const [error, setError] = useState('');
  const [okFlash, setOkFlash] = useState('');

  const match = useMemo(() => findTutorByPhone(telefono), [findTutorByPhone, telefono]);

  useEffect(() => {
    if (match) setTutorNombre(match.nombre);
  }, [match]);

  const submit = () => {
    setError('');
    const res = checkIn({ nino, tutorNombre, telefono, conNinera });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOkFlash(`${nino.trim()} entró a jugar${conNinera ? ' · con niñera' : ''}`);
    setNino('');
    setConNinera(false);
    setTimeout(() => onDone(), 650);
  };

  return (
    <section className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5">
      <div className="rounded-[28px] border border-limestone-line bg-white/75 p-6 sm:p-8 shadow-card">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-ink text-limestone flex items-center justify-center">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold">Check-in rápido</h2>
            <p className="text-ink-mist text-sm mt-1">
              El WhatsApp reconoce al tutor y su membresía / lealtad.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Niño / niña">
            <input
              value={nino}
              onChange={(e) => setNino(e.target.value)}
              placeholder="Ej. Sofi"
              className="field"
              autoFocus
            />
          </Field>
          <Field label="WhatsApp del tutor">
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="999 123 4567"
              inputMode="tel"
              className="field"
            />
          </Field>
          <Field label="Nombre del tutor">
            <input
              value={tutorNombre}
              onChange={(e) => setTutorNombre(e.target.value)}
              placeholder="Se completa si ya está registrado"
              className="field"
            />
          </Field>

          <button
            type="button"
            onClick={() => setConNinera((v) => !v)}
            className={`w-full touch-target rounded-2xl border px-4 py-3.5 text-left transition ${
              conNinera
                ? 'border-fest bg-fest/15 text-ink'
                : 'border-limestone-line bg-limestone/40 text-ink-mist'
            }`}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Baby className="h-4 w-4" />
              {conNinera ? 'Con niñera' : 'Sin niñera'}
            </span>
            <span className="block text-xs mt-1 opacity-70">
              Cambia la tarifa al check-out (ej. 1h $100 → $170)
            </span>
          </button>

          {error && (
            <p className="text-sm text-coral bg-coral-soft/50 border border-coral/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          {okFlash && (
            <p className="text-sm text-ink bg-fest-soft/60 border border-fest/30 rounded-xl px-3 py-2">
              {okFlash}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            className="touch-target w-full rounded-2xl bg-fest text-ink font-bold text-base py-4 shadow-lift hover:bg-fest-deep hover:text-white transition"
          >
            Iniciar tiempo / Check-in
          </button>
        </div>
      </div>

      <aside className="rounded-[28px] border border-limestone-line bg-ink text-limestone p-6 sm:p-7 shadow-lift space-y-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-fest-soft/80 font-semibold">
            Perfil reconocido
          </p>
          {match ? (
            <div className="mt-4 space-y-4">
              <h3 className="font-display text-3xl font-semibold text-white">{match.nombre}</h3>
              <p className="text-limestone/70 text-sm">{formatPhone(match.telefono)}</p>
              {match.membresiaActiva ? (
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-fest-soft text-xs font-semibold uppercase tracking-wider">
                    Membresía activa
                  </p>
                  <p className="font-display text-4xl font-semibold mt-1">{match.horasRestantes}h</p>
                  <p className="text-sm text-limestone/60 mt-1">horas prepagadas restantes</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-limestone/50">
                    Pago por lista de precios
                  </p>
                  <p className="mt-2 text-sm text-limestone/80">Lealtad por horas entregadas</p>
                  <LoyaltyBar horas={match.horasLealtad} />
                </div>
              )}
              {match.membresiaActiva && <LoyaltyBar horas={match.horasLealtad} light />}
              {match.hijosNombres.length > 0 && (
                <p className="text-sm text-limestone/65">Niños: {match.hijosNombres.join(', ')}</p>
              )}
            </div>
          ) : onlyDigits(telefono).length >= 10 ? (
            <div className="mt-6">
              <h3 className="font-display text-2xl text-white">Tutor nuevo</h3>
              <p className="text-limestone/65 mt-2 text-sm leading-relaxed">
                Se crea el perfil al confirmar. Luego puedes venderle el paquete 10h.
              </p>
            </div>
          ) : (
            <div className="mt-6 text-limestone/50 text-sm leading-relaxed">
              Tip: <span className="text-fest-soft">9991234567</span> (Mariana, membresía) ·{' '}
              <span className="text-fest-soft">9997654321</span> (Carlos, a 1h del premio de lealtad).
            </div>
          )}
        </div>
        <PriceBoard />
      </aside>
    </section>
  );
}

function LoyaltyBar({ horas, light }: { horas: number; light?: boolean }) {
  const { inCycle, every } = loyaltyProgress(horas);
  const pct = Math.min(100, (inCycle / every) * 100);
  return (
    <div className={light ? 'mt-2' : 'mt-3'}>
      <div className="flex justify-between text-xs mb-1.5">
        <span className={light ? 'text-limestone/55' : 'text-ink-mist'}>
          Lealtad {inCycle}/{every}h
        </span>
        <span className={light ? 'text-fest-soft' : 'text-fest-deep'}>+1h al llegar a {every}</span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${light ? 'bg-white/10' : 'bg-ink/10'}`}>
        <div className="h-full bg-fest rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-mist">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function FloorBoard({ onNeedCheckIn }: { onNeedCheckIn: () => void }) {
  const { activos, tutors, previewCheckout, confirmCheckout } = useLudoteca();
  const [now, setNow] = useState(Date.now());
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [closedNote, setClosedNote] = useState('');

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const preview = checkoutId ? previewCheckout(checkoutId) : null;

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold">Niños en juego</h2>
        <button
          type="button"
          onClick={onNeedCheckIn}
          className="touch-target rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-semibold hover:bg-white"
        >
          + Nuevo check-in
        </button>
      </div>

      {closedNote && (
        <p className="mb-4 text-sm rounded-xl bg-fest-soft/50 border border-fest/30 px-3 py-2">
          {closedNote}
        </p>
      )}

      {activos.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-limestone-line bg-white/50 p-12 text-center">
          <p className="font-display text-2xl">Nadie en el piso</p>
          <p className="text-ink-mist mt-2 text-sm">Haz el primer check-in del turno.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {activos.map((a) => {
            const tutor = tutors.find((t) => t.id === a.tutorId);
            const ms = Math.max(0, now - a.checkInAt);
            const overtime = ms > 60 * 60 * 1000;
            return (
              <article
                key={a.sessionId}
                className={`rounded-[24px] border bg-white/80 p-5 shadow-card transition hover:shadow-lift ${
                  overtime ? 'border-coral/40 ring-1 ring-coral/20' : 'border-limestone-line'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-2xl font-semibold leading-none">{a.ninoNombre}</h3>
                    <p className="text-sm text-ink-mist mt-1.5">{tutor?.nombre || 'Tutor'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {a.conNinera && (
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-fest/20 text-fest-deep px-2 py-0.5 rounded-full">
                        Niñera
                      </span>
                    )}
                    {overtime ? (
                      <span className="text-[11px] font-bold uppercase tracking-wide bg-coral text-white px-2.5 py-1 rounded-full">
                        +1 h
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wide bg-ink/5 text-ink-mist px-2.5 py-1 rounded-full">
                        En piso
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-display text-[2.6rem] leading-none tracking-tight mt-5 tabular-nums">
                  {formatTimer(ms)}
                </p>
                <p className="text-xs text-ink-mist mt-2">
                  Entrada{' '}
                  {new Date(a.checkInAt).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {tutor?.membresiaActiva ? (
                  <p className="mt-4 text-sm rounded-xl bg-ink text-limestone px-3 py-2">
                    Membresía: <strong>{tutor.horasRestantes}h</strong> restantes
                  </p>
                ) : (
                  <div className="mt-4 rounded-xl bg-limestone-deep/60 px-3 py-2">
                    <LoyaltyBar horas={tutor?.horasLealtad || 0} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCheckoutId(a.sessionId)}
                  className="touch-target mt-5 w-full rounded-xl bg-ink text-limestone font-semibold py-3.5 hover:bg-ink-soft transition inline-flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Check-out / Cobrar
                </button>
              </article>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink/45 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] bg-limestone border border-limestone-line shadow-lift p-6 relative max-h-[90dvh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setCheckoutId(null)}
              className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/60"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-mist font-semibold">
              Cerrar turno
            </p>
            <h3 className="font-display text-3xl font-semibold mt-1">
              {preview.session.ninoNombre}
            </h3>
            <p className="text-ink-mist text-sm mt-1">
              {preview.tutor.nombre} · jugó {formatMinutesHuman(preview.minutos)}
              {preview.session.conNinera ? ' · con niñera' : ''}
            </p>

            {preview.ruta === 'membresia' ? (
              <div className="mt-5 rounded-2xl bg-ink text-limestone p-5">
                <p className="text-fest-soft text-xs font-semibold uppercase tracking-wider">
                  Cobro por membresía
                </p>
                <p className="text-lg mt-2">
                  Se descontarán <strong>{preview.horasDescontar}h</strong> del saldo.
                </p>
                <p className="text-limestone/70 text-sm mt-2">
                  Horas restantes después:{' '}
                  <strong>
                    {Math.max(
                      0,
                      Math.round((preview.tutor.horasRestantes - preview.horasDescontar) * 100) / 100
                    )}
                    h
                  </strong>
                  {preview.horasPremioLealtad > 0
                    ? ` (+${preview.horasPremioLealtad}h premio lealtad)`
                    : ''}
                </p>
                <p className="text-sm text-limestone/50 mt-3">Sin cobro en efectivo.</p>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-white border border-limestone-line p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-mist">
                  Lista de precios · {preview.horasCobradas}h
                  {preview.session.conNinera ? ' con niñera' : ''}
                </p>
                <p className="font-display text-4xl font-semibold mt-2">${preview.monto}</p>
                <p className="text-sm text-ink-mist mt-2">
                  Lealtad: {preview.tutor.horasLealtad}h → {preview.horasLealtadDespues}h
                </p>
              </div>
            )}

            {preview.horasPremioLealtad > 0 && (
              <div className="mt-3 rounded-2xl border border-fest/40 bg-fest-soft/50 px-4 py-3 flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-fest-deep shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-ink">
                    ¡Completó {LOYALTY_EVERY_HOURS}h de lealtad!
                  </p>
                  <p className="text-sm text-ink-mist mt-0.5">
                    Se acreditan <strong>+{preview.horasPremioLealtad}h gratis</strong> a su saldo.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const closed = confirmCheckout(preview.session.sessionId);
                setCheckoutId(null);
                if (closed) {
                  const parts = [
                    closed.modoCobro === 'membresia'
                      ? `−${closed.horasDescontadas}h membresía`
                      : `cobrado $${closed.montoCobrado}`,
                  ];
                  if (closed.horasPremioLealtad > 0) {
                    parts.push(`+${closed.horasPremioLealtad}h lealtad`);
                  }
                  setClosedNote(`Turno cerrado · ${parts.join(' · ')}`);
                  window.setTimeout(() => setClosedNote(''), 4500);
                }
              }}
              className="touch-target mt-5 w-full rounded-2xl bg-fest text-ink font-bold py-4 hover:bg-fest-deep hover:text-white transition"
            >
              Confirmar y cerrar turno
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function MembershipsPanel() {
  const { tutors, sellPackage } = useLudoteca();
  const [selectedTutor, setSelectedTutor] = useState(tutors[0]?.id || '');
  const [flash, setFlash] = useState('');

  const activos = tutors.filter((t) => t.membresiaActiva);
  const pack = PACKAGES[0]!;

  return (
    <section className="grid lg:grid-cols-[1fr_0.95fr] gap-5">
      <div className="space-y-5">
        <div className="rounded-[28px] border border-limestone-line bg-white/75 p-6 shadow-card">
          <h2 className="font-display text-3xl font-semibold">Lista de precios</h2>
          <p className="text-sm text-ink-mist mt-1 mb-5">Vigente · Pakalitos Fest</p>
          <div className="overflow-hidden rounded-2xl border border-limestone-line">
            <table className="w-full text-sm">
              <thead className="bg-ink text-limestone text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tiempo</th>
                  <th className="px-4 py-3 font-semibold">Solo</th>
                  <th className="px-4 py-3 font-semibold">Con niñera</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_TIERS.map((t) => (
                  <tr key={t.hours} className="border-t border-limestone-line odd:bg-limestone/40">
                    <td className="px-4 py-3 font-medium">
                      {t.hours} hora{t.hours > 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 tabular-nums">${t.solo}</td>
                    <td className="px-4 py-3 tabular-nums text-fest-deep font-semibold">${t.ninera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-ink-mist mt-4 leading-relaxed">
            Promoción membresía: <strong>10 horas × ${pack.precio}</strong>. Lealtad: junta{' '}
            {LOYALTY_EVERY_HOURS}h entregadas y regalamos 1h al saldo.
          </p>
        </div>

        <div className="rounded-[28px] border border-limestone-line bg-white/75 p-6 shadow-card">
          <h2 className="font-display text-2xl font-semibold">Membresías activas</h2>
          <ul className="space-y-3 mt-4">
            {activos.length === 0 && (
              <li className="text-sm text-ink-mist">Nadie con saldo todavía.</li>
            )}
            {activos.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-limestone-line bg-limestone/50 px-4 py-3.5"
              >
                <div>
                  <p className="font-semibold">{t.nombre}</p>
                  <p className="text-xs text-ink-mist">
                    {formatPhone(t.telefono)} · lealtad {loyaltyProgress(t.horasLealtad).inCycle}/
                    {LOYALTY_EVERY_HOURS}h
                  </p>
                </div>
                <p className="font-display text-2xl font-semibold">{t.horasRestantes}h</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-[28px] border border-limestone-line bg-ink text-limestone p-6 shadow-lift">
        <h2 className="font-display text-3xl font-semibold text-white">Vender / recargar</h2>
        <p className="text-sm text-limestone/60 mt-1 mb-5">
          Paquete único actual: 10 horas por ${pack.precio} MXN.
        </p>

        <label className="block text-xs font-semibold uppercase tracking-wider text-limestone/50">
          Tutor
          <select
            value={selectedTutor}
            onChange={(e) => setSelectedTutor(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-3 text-limestone"
          >
            {tutors.map((t) => (
              <option key={t.id} value={t.id} className="text-ink">
                {t.nombre} · {formatPhone(t.telefono)}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 rounded-2xl border border-fest bg-fest/15 px-4 py-4">
          <p className="font-semibold text-white text-lg">{pack.label}</p>
          <p className="text-fest-soft text-2xl font-display font-semibold mt-1">${pack.precio} MXN</p>
          <p className="text-sm text-limestone/55 mt-1">{pack.horas} horas al saldo del tutor</p>
        </div>

        <button
          type="button"
          disabled={!selectedTutor}
          onClick={() => {
            sellPackage(selectedTutor, pack.id);
            setFlash(`Recarga ${pack.label} · $${pack.precio} registrada`);
            window.setTimeout(() => setFlash(''), 3000);
          }}
          className="touch-target mt-5 w-full rounded-2xl bg-fest text-ink font-bold py-4 disabled:opacity-40"
        >
          Confirmar recarga ${pack.precio}
        </button>
        {flash && <p className="mt-3 text-sm text-fest-soft">{flash}</p>}
      </div>
    </section>
  );
}

function CashSummary() {
  const { caja, activos } = useLudoteca();
  const efectivoSesiones = caja.sesiones.reduce((s, x) => s + x.montoCobrado, 0);
  const efectivoRecargas = caja.recargasMembresia.reduce((s, x) => s + x.monto, 0);
  const horasMembresia = caja.sesiones.reduce((s, x) => s + x.horasDescontadas, 0);
  const valorMembresiaConsumida = Math.round(horasMembresia * RATE_1H_SOLO);
  const horasPremio = caja.sesiones.reduce((s, x) => s + x.horasPremioLealtad, 0);
  const ninosHoy = new Set(caja.sesiones.map((s) => `${s.tutorId}:${s.ninoNombre}`)).size;

  return (
    <section className="space-y-5">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Niños atendidos hoy"
          value={String(ninosHoy)}
          hint={`${activos.length} aún en piso`}
        />
        <SummaryCard label="Efectivo (visitas)" value={`$${efectivoSesiones}`} hint="Check-outs pagados" />
        <SummaryCard
          label="Efectivo (membresías)"
          value={`$${efectivoRecargas}`}
          hint="Paquete 10h vendido"
        />
        <SummaryCard
          label="Horas membresía usadas"
          value={`${horasMembresia}h`}
          hint={`≈ $${valorMembresiaConsumida} · premios lealtad +${horasPremio}h`}
        />
      </div>

      <div className="rounded-[28px] border border-limestone-line bg-white/75 p-6 shadow-card">
        <h2 className="font-display text-2xl font-semibold mb-4">Movimientos del día</h2>
        {caja.sesiones.length === 0 && caja.recargasMembresia.length === 0 ? (
          <p className="text-sm text-ink-mist">Aún no hay check-outs ni recargas en esta sesión demo.</p>
        ) : (
          <ul className="space-y-2">
            {caja.recargasMembresia.map((r, i) => (
              <li
                key={`r-${i}`}
                className="flex justify-between gap-3 rounded-xl bg-fest-soft/40 px-3 py-2.5 text-sm"
              >
                <span>Recarga · {r.paquete}</span>
                <strong>${r.monto}</strong>
              </li>
            ))}
            {caja.sesiones.map((s) => (
              <li
                key={s.sessionId}
                className="flex justify-between gap-3 rounded-xl bg-limestone/80 px-3 py-2.5 text-sm"
              >
                <span>
                  {s.ninoNombre} · {s.tutorNombre} · {formatMinutesHuman(s.minutosJugados)}
                  {s.conNinera ? ' · niñera' : ''}
                  {s.modoCobro === 'membresia' ? ` · −${s.horasDescontadas}h` : ` · ${s.horasCobradas}h`}
                  {s.horasPremioLealtad > 0 ? ` · +${s.horasPremioLealtad}h premio` : ''}
                </span>
                <strong>{s.modoCobro === 'membresia' ? '—' : `$${s.montoCobrado}`}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-limestone-line bg-white/75 p-5 shadow-card">
      <p className="text-[11px] uppercase tracking-[0.16em] text-ink-mist font-semibold">{label}</p>
      <p className="font-display text-3xl font-semibold mt-2">{value}</p>
      <p className="text-xs text-ink-mist mt-2">{hint}</p>
    </div>
  );
}
