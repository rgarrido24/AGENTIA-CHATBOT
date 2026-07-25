"use client";

import { PhotoStudioProvider } from "./components/PhotoStudioContext";
import { PhotoStudioButton } from "./components/PhotoStudioButton";
import { StudentsProvider } from "./components/StudentsContext";
import { Hero } from "./components/Hero";
import { StarCommandLetter } from "./components/StarCommandLetter";
import { FeaturedBitacora } from "./components/FeaturedBitacora";
import { Teachers } from "./components/Teachers";
import { GenerationWall } from "./components/GenerationWall";
import { SharedLaminasSection } from "./components/SharedLaminasSection";
import type { Student } from "./data";
import "./experiencia.css";

export function ExperienciaClient({ students }: { students: Student[] }) {
  return (
    <StudentsProvider initial={students} featuredSlug="amaia">
      <PhotoStudioProvider>
        <main className="experiencia-root">
          <nav className="experiencia-nav" aria-label="Secciones del anuario">
            <a href="#carta">Carta</a>
            <a href="#bitacora">Bitácora</a>
            <a href="#maestras">Maestras</a>
            <a href="#generacion">Generación</a>
            <a href="#laminas">Álbum PDF</a>
          </nav>

          <Hero />
          <StarCommandLetter />
          <FeaturedBitacora />
          <Teachers />
          <GenerationWall />
          <SharedLaminasSection />

          <footer className="experiencia-footer">
            Kinder 3 · Colegio Asbaje · Generación 2024-2026 · PDF + formulario en vivo
          </footer>

          <PhotoStudioButton />
        </main>
      </PhotoStudioProvider>
    </StudentsProvider>
  );
}
