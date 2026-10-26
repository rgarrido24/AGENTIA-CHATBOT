import WaThemeScope from '../WaThemeScope';

export default function FormulariosLayout({ children, params }: { children: React.ReactNode; params: { resellerId: string } }) {
  return <WaThemeScope resellerId={params.resellerId}>{children}</WaThemeScope>;
}
