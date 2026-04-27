'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PortalLoginPage({ params }: { params: { resellerId: string } }) {
  const { resellerId } = params;
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resellerId, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return; }
      router.push(data.redirect);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#000' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <Image
            src="/logo-agentia-2026.png"
            alt="Agentia"
            width={48}
            height={48}
            className="rounded-xl"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Portal Agentia</h1>
            <p className="text-xs mt-1" style={{ color: '#555' }}>Panel de revendedor · {resellerId}</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 border"
          style={{ background: '#0d0d0d', borderColor: '#222' }}
        >
          <h2 className="text-sm font-semibold text-white mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#666' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#444] outline-none"
                style={{ background: '#111', border: '1px solid #2a2a2a' }}
              />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#1a0000', color: '#ef4444' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
              style={{ background: '#22c55e', color: '#000' }}
            >
              {loading ? 'Verificando…' : 'Entrar al portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: '#333' }}>
          Powered by{' '}
          <a href="https://agentia.software" className="hover:underline" style={{ color: '#444' }}>
            agentia.software
          </a>
        </p>
      </div>
    </div>
  );
}
