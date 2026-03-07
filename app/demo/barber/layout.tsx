import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-demo',
});

export default function DemoBarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={plusJakarta.className}>{children}</div>;
}
