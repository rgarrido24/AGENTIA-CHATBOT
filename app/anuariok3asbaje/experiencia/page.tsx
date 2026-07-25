"use client";

import { PhotoStudioProvider } from "./components/PhotoStudioContext";
import { PhotoStudioButton } from "./components/PhotoStudioButton";
import { Hero } from "./components/Hero";
import { StarCommandLetter } from "./components/StarCommandLetter";
import { FeaturedBitacora } from "./components/FeaturedBitacora";
import { Teachers } from "./components/Teachers";
import { GenerationWall } from "./components/GenerationWall";
import "./experiencia.css";

export default function ExperienciaAnuarioPage() {
  return (
    <PhotoStudioProvider>
      <main className="experiencia-root">
        <nav className="experiencia-nav" aria-label="Secciones del anuario">
          <a href="#carta">Carta</a>
          <a href="#bitacora">Bitácora</a>
          <a href="#maestras">Maestras</a>
          <a href="#generacion">Generación</a>
        </nav>

        <Hero />
        <StarCommandLetter />
        <FeaturedBitacora />
        <Teachers />
        <GenerationWall />

        <footer className="experiencia-footer">
          Kinder 3 · Colegio Asbaje · Generación 2024-2026 · Al infinito y más allá
        </footer>

        <PhotoStudioButton />
      </main>
    </PhotoStudioProvider>
  );
}
