'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { anuarioPath } from '@/lib/anuario-k3/paths';

export default function DashboardLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch(anuarioPath('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) router.push(anuarioPath('/dashboard'));
    else {
      setError('Contraseña incorrecta');
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg,#1B4F8A,#7C4DFF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito',sans-serif",
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: '3.5rem' }}>🎓</div>
        <h1
          style={{
            fontFamily: "'Fredoka One',cursive",
            fontSize: '1.8rem',
            color: '#1B4F8A',
            marginBottom: '0.3rem',
          }}
        >
          Dashboard Admin
        </h1>
        <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '2rem' }}>Anuario K3 — Colegio Asbaje</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Contraseña de administrador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid #E0E0E0',
              fontSize: '1rem',
              fontFamily: "'Nunito',sans-serif",
              marginBottom: '1rem',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ color: '#FF7043', marginBottom: '1rem', fontWeight: '700' }}>⚠️ {error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg,#1B4F8A,#7C4DFF)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '800',
              fontFamily: "'Nunito',sans-serif",
            }}
          >
            {loading ? '⏳ Entrando...' : '🔐 Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
