import MarketingShell from '@/components/shared/MarketingShell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
