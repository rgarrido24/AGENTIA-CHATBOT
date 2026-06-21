import './globals.css';

export const metadata = {
  title: 'Anuario Kinder 3 — Colegio Asbaje 2024-2025',
  description: 'Mis días de aventura — Generación 2024-2025',
};

export default function AnuarioLayout({ children }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
