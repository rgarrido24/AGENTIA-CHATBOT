'use client';

import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export default function ClientPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={inter.className}
      style={{
        minHeight: '100vh',
        background: '#FAF9F7',
        color: '#1C1A18',
        fontSize: '15px',
      }}
    >
      {children}
    </div>
  );
}
