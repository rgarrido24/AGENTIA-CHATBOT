import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis Días de Aventura — Anuario Kinder 3",
  description:
    "Bitácora digital interactiva · Generación 2024-2026 · Colegio Asbaje",
};

export default function ExperienciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
