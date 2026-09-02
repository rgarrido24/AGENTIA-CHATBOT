'use client';

import { useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';

type Props = {
  borderColor: string;
  className?: string;
};

export function IzziPanelLogoutButton({ borderColor, className = '' }: Props) {
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/izzi-panel/auth/login', { method: 'DELETE' });
    } catch {
      /* igual redirigimos: la cookie puede haber caducado */
    }
    window.location.href = '/izzi-panel/login';
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={loading}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-3 py-2 text-sm text-pink-100/90 transition hover:bg-white/5 disabled:opacity-50 ${className}`}
      style={{ borderColor }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Cerrar sesión
    </button>
  );
}
