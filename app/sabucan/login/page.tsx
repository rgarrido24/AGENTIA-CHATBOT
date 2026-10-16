'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SABUCAN_LOGO_URL, SABUCAN_NAVY, SABUCAN_ORANGE } from '@/lib/sabucan-brand';

function SabucanLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/sabucan/caja';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  const [changeMode, setChangeMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeMsg, setChangeMsg] = useState('');
  const [changeMsgType, setChangeMsgType] = useState<'ok' | 'err'>('ok');

  const accent = SABUCAN_ORANGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/sabucan/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data?.error || 'Usuario o contraseña incorrectos');
        return;
      }
      router.push(from.startsWith('/sabucan') ? from : '/sabucan/caja');
      router.refresh();
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeMsg('');
    if (!username || !password) {
      setChangeMsgType('err');
      setChangeMsg('Ingresa tu usuario y contraseña actual primero');
      return;
    }
    if (newPassword.length < 6) {
      setChangeMsgType('err');
      setChangeMsg('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeMsgType('err');
      setChangeMsg('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/sabucan/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword: password, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setChangeMsgType('err');
        setChangeMsg(data?.error || 'No se pudo actualizar la contraseña');
        return;
      }
      setChangeMsgType('ok');
      setChangeMsg('✓ Contraseña actualizada. Ahora inicia sesión con la nueva contraseña.');
      setChangeMode(false);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setChangeMsgType('err');
      setChangeMsg('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-white placeholder-white/35 outline-none focus:border-white/40';

  return (
    <div
      className="w-full max-w-sm rounded-2xl p-8 shadow-xl"
      style={{
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${accent}33`,
      }}
    >
      {logoOk ? (
        <div className="mb-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SABUCAN_LOGO_URL}
            alt="SABUCAN"
            className="h-28 w-auto object-contain"
            onError={() => setLogoOk(false)}
          />
        </div>
      ) : (
        <p
          className="font-[family-name:var(--font-space)] text-[10px] font-medium uppercase tracking-[0.25em]"
          style={{ color: accent }}
        >
          SABUCAN
        </p>
      )}

      {!changeMode ? (
        <>
          <h1 className="mt-2 font-[family-name:var(--font-space)] text-xl font-bold text-white/95">
            Acceso a caja
          </h1>
          <p className="mt-1 mb-6 text-sm text-white/50">Lealtad · minisuper</p>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoComplete="username"
              className={inputClass}
              autoFocus
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              className={inputClass}
              disabled={loading}
            />
            {error ? <p className="text-sm text-yellow-200">{error}</p> : null}
            {changeMsg ? (
              <p className={`text-sm ${changeMsgType === 'ok' ? 'text-green-300' : 'text-yellow-200'}`}>
                {changeMsg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accent, color: SABUCAN_NAVY }}
            >
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
          <p className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setChangeMode(true); setError(''); setChangeMsg(''); }}
              className="text-xs text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              Actualizar contraseña
            </button>
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-2 font-[family-name:var(--font-space)] text-xl font-bold text-white/95">
            Nueva contraseña
          </h1>
          <p className="mt-1 mb-6 text-sm text-white/50">Ingresa tus credenciales actuales y la nueva contraseña</p>
          <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoComplete="username"
              className={inputClass}
              autoFocus
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña actual"
              autoComplete="current-password"
              className={inputClass}
              disabled={loading}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              className={inputClass}
              disabled={loading}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nueva contraseña"
              autoComplete="new-password"
              className={inputClass}
              disabled={loading}
            />
            {changeMsg ? (
              <p className={`text-sm ${changeMsgType === 'ok' ? 'text-green-300' : 'text-yellow-200'}`}>
                {changeMsg}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: accent, color: SABUCAN_NAVY }}
            >
              {loading ? 'Actualizando…' : 'Guardar contraseña'}
            </button>
          </form>
          <p className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setChangeMode(false); setChangeMsg(''); }}
              className="text-xs text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              ← Volver al login
            </button>
          </p>
        </>
      )}
    </div>
  );
}

export default function SabucanLoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-8">
      <Suspense
        fallback={
          <div className="h-72 w-full max-w-sm animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
        }
      >
        <SabucanLoginForm />
      </Suspense>
    </div>
  );
}
