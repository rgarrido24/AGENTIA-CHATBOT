import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentia - Demo',
  description: 'Demo chatbot con Gemini',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased bg-slate-900">{children}</body>
    </html>
  );
}
