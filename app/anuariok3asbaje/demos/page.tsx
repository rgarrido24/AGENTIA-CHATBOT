import Link from "next/link";
import "./demos.css";

export const metadata = {
  title: "Demos Anuario K3 — Colegio Asbaje",
  description: "4 propuestas interactivas para el anuario digital 2024-2026",
};

const DEMOS = [
  {
    href: "/anuariok3asbaje/memoria",
    title: "Demo 5 · Memoria (Apple Event)",
    desc: "Documental inmersivo: intro negra, Ken Burns, cartas, scroll pesado. No es un sitio web.",
  },
  {
    href: "/anuariok3asbaje/memoria/links",
    title: "Links por niño",
    desc: "Índice de links personalizados con datos del formulario (fotos después en Studio).",
  },
  {
    href: "/anuariok3asbaje/studio",
    title: "Studio · Panel de plantillas",
    desc: "Agregar alumno, subir portada/perfil/recuerdos, mensajes y link personalizado.",
  },
  {
    href: "/anuariok3asbaje/demos/toy-story",
    title: "Demo 1 · Toy Story",
    desc: "Misión vaquera / espacial. Escenas vivas por sueño y comida.",
  },
  {
    href: "/anuariok3asbaje/demos/scrapbook-grad",
    title: "Demo 2 · Scrapbook Grad",
    desc: "Polaroids + cinta (estilo Fabio). Festivo y tactile.",
  },
  {
    href: "/anuariok3asbaje/demos/scrapbook-rosa",
    title: "Demo 3 · Scrapbook Rosa",
    desc: "Collage luminoso (estilo Lia). Pastel y tipografía pop.",
  },
  {
    href: "/anuariok3asbaje/demos/orbit",
    title: "Demo 4 · Mission Cinema",
    desc: "Sorpresa premium oscura. Look high-ticket para vender el próximo año.",
  },
];

export default function DemosHubPage() {
  return (
    <main className="demos-hub">
      <div className="demos-hub__inner">
        <p className="demo-eyebrow" style={{ color: "#38bdf8" }}>
          Anuario Digital · Kinder 3
        </p>
        <h1>Elige la experiencia</h1>
        <p>
          Cuatro demos con los datos reales del formulario. Las fotos las cargas tú
          manualmente; mientras tanto verás placeholders. Abre cada link y decide con
          cuál se enamora el salón.
        </p>

        <div className="demos-hub__grid">
          {DEMOS.map((d) => (
            <Link key={d.href} href={d.href}>
              <strong>{d.title}</strong>
              <span>{d.desc}</span>
            </Link>
          ))}
        </div>

        <div className="demos-hub__note">
          Nueva línea premium:{" "}
          <Link href="/anuariok3asbaje/memoria" style={{ color: "#7dd3fc" }}>
            /memoria
          </Link>{" "}
          + panel{" "}
          <Link href="/anuariok3asbaje/studio" style={{ color: "#7dd3fc" }}>
            /studio
          </Link>
          . La editorial Toy Story sigue en{" "}
          <Link href="/anuariok3asbaje/experiencia" style={{ color: "#7dd3fc" }}>
            /experiencia
          </Link>
          .
        </div>
      </div>
    </main>
  );
}
