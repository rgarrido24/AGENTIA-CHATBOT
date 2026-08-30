'use client';

import { useRef, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileGateProps {
  children: (onClick: () => void, busy: boolean) => React.ReactNode;
  onVerified: () => void;
  siteKey?: string;
}

export default function TurnstileGate({ children, onVerified, siteKey }: TurnstileGateProps) {
  const [showWidget, setShowWidget] = useState(false);
  const [busy, setBusy] = useState(false);
  const key = siteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'; // always-passes test key

  const handleClick = () => {
    setBusy(true);
    setShowWidget(true);
  };

  const handleToken = async (token: string) => {
    try {
      const res = await fetch('/api/verify-human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        setShowWidget(false);
        onVerified();
      }
    } catch {
      // on error, let the user through — don't block legitimate users
      setShowWidget(false);
      onVerified();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {children(handleClick, busy)}
      {showWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl bg-white p-6 shadow-2xl flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600 font-medium">Verificando que eres humano…</p>
            <Turnstile
              siteKey={key}
              onSuccess={handleToken}
              onError={() => { setShowWidget(false); setBusy(false); onVerified(); }}
              onExpire={() => { setShowWidget(false); setBusy(false); }}
            />
          </div>
        </div>
      )}
    </>
  );
}
