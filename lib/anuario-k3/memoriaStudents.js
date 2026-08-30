/**
 * Helpers de la experiencia Memoria (salón + por alumno).
 * Sin fotos: se muestran datos del formulario; las imágenes las sube el admin después.
 */

import { mapAlumnoToMemoria } from '@/lib/anuario-k3/memoriaMap';

export const MEMORIA_CHAPTER = '/anuario-k3/paginas/pagina-02.jpg';
export const MEMORIA_SALON_COVER = '/anuario-k3/paginas/pagina-01.jpg';

export function alumnoToStudentView(alumno) {
  const s = mapAlumnoToMemoria(alumno);
  return {
    slug: s.slug,
    nombre: s.nombre,
    nombreCompleto: s.nombreCompleto,
    // Solo URLs reales — sin inventar fotos
    portadaUrl: s.portadaUrl || '',
    perfilUrl: s.perfilUrl || '',
    gallery: s.gallery,
    facts: s.facts,
    mensajes: s.mensajes,
  };
}

/** Incluye alumnos con datos de formulario aunque aún no tengan fotos */
export function hasMemoriaContent(student) {
  const f = student.facts || {};
  const hasFacts = Boolean(
    f.color || f.sueno || f.comida || f.amigos || f.frase || f.gusto
  );
  return (
    hasFacts ||
    (student.mensajes && student.mensajes.length > 0) ||
    (student.gallery && student.gallery.length > 0) ||
    Boolean(student.portadaUrl || student.perfilUrl) ||
    Boolean(student.nombre)
  );
}
