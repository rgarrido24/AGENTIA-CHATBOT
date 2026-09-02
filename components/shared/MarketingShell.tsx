import { geist } from '@/app/lealtad/geist';

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geist.className} ${geist.variable} bg-[#FAFAF8] text-[#14161A] antialiased`}>
      {children}
    </div>
  );
}
