import DentistaShell from './DentistaShell';

export default function DentistaLayout({ children }: { children: React.ReactNode }) {
  return <DentistaShell>{children}</DentistaShell>;
}
