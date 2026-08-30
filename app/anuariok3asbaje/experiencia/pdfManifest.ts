/**
 * Manifest de las 55 láminas del PDF Canva (verificadas visualmente + texto).
 * Archivos: /anuario-k3/paginas/pagina-XX.jpg
 */

export type LaminaKind =
  | "portada"
  | "carta"
  | "maestras"
  | "mision"
  | "bitacora"
  | "recuerdos"
  | "comando"
  | "grupal"
  | "cierre"
  | "otra";

export type Lamina = {
  page: number;
  src: string;
  kind: LaminaKind;
  title: string;
  slug?: string;
};

export function pageSrc(page: number) {
  return `/anuario-k3/paginas/pagina-${String(page).padStart(2, "0")}.jpg`;
}

function L(
  page: number,
  kind: LaminaKind,
  title: string,
  slug?: string
): Lamina {
  return { page, src: pageSrc(page), kind, title, ...(slug ? { slug } : {}) };
}

/** Mapa real del PDF exportado (orden Canva). */
export const PDF_MANIFEST: Lamina[] = [
  L(1, "portada", "Portada · Mis Días de Aventura"),
  L(2, "carta", "Querido Aventurero"),

  L(3, "bitacora", "Bitácora", "amaia"),
  L(4, "recuerdos", "Recuerdos de nuestra misión", "amaia"),
  L(5, "comando", "Mensaje del Comando Estelar", "amaia"),

  L(6, "bitacora", "Bitácora", "cami"),
  L(7, "recuerdos", "Recuerdos de nuestra misión", "cami"),
  L(8, "comando", "Mensaje del Comando Estelar", "cami"),

  L(9, "bitacora", "Bitácora", "sara"),
  L(10, "recuerdos", "Recuerdos de nuestra misión", "sara"),
  L(11, "recuerdos", "Más recuerdos", "sara"),
  L(12, "comando", "Mensaje del Comando Estelar", "sara"),

  L(13, "bitacora", "Bitácora", "ana-pau"),
  L(14, "recuerdos", "Recuerdos de nuestra misión", "ana-pau"),
  L(15, "recuerdos", "Más recuerdos", "ana-pau"),
  L(16, "comando", "Mensaje del Comando Estelar", "ana-pau"),

  L(17, "bitacora", "Bitácora", "naty"),
  L(18, "recuerdos", "Recuerdos de nuestra misión", "naty"),
  L(19, "comando", "Mensaje del Comando Estelar", "naty"),

  L(20, "bitacora", "Bitácora", "elias"),
  L(21, "recuerdos", "Recuerdos de nuestra misión", "elias"),
  L(22, "recuerdos", "Más recuerdos", "elias"),
  L(23, "comando", "Mensaje del Comando Estelar", "elias"),

  L(24, "bitacora", "Bitácora", "fabio"),
  L(25, "recuerdos", "Recuerdos de nuestra misión", "fabio"),
  L(26, "recuerdos", "Más recuerdos", "fabio"),
  L(27, "comando", "Mensaje del Comando Estelar", "fabio"),

  L(28, "bitacora", "Bitácora", "gabito"),
  L(29, "recuerdos", "Recuerdos de nuestra misión", "gabito"),
  L(30, "recuerdos", "Más recuerdos", "gabito"),
  L(31, "comando", "Mensaje del Comando Estelar", "gabito"),

  L(32, "bitacora", "Bitácora", "kesleigh"),
  L(33, "recuerdos", "Recuerdos de nuestra misión", "kesleigh"),
  L(34, "comando", "Mensaje del Comando Estelar", "kesleigh"),

  L(35, "bitacora", "Bitácora", "fernanda"),
  L(36, "recuerdos", "Recuerdos de nuestra misión", "fernanda"),
  L(37, "comando", "Mensaje del Comando Estelar", "fernanda"),

  L(38, "bitacora", "Bitácora", "luciana"),
  L(39, "recuerdos", "Recuerdos de nuestra misión", "luciana"),
  L(40, "comando", "Mensaje del Comando Estelar", "luciana"),

  L(41, "bitacora", "Bitácora", "matthias"),
  L(42, "recuerdos", "Recuerdos de nuestra misión", "matthias"),
  L(43, "comando", "Mensaje del Comando Estelar", "matthias"),

  L(44, "bitacora", "Bitácora", "romina"),
  L(45, "recuerdos", "Recuerdos de nuestra misión", "romina"),
  L(46, "comando", "Mensaje del Comando Estelar", "romina"),

  L(47, "bitacora", "Bitácora", "lia"),
  L(48, "recuerdos", "Recuerdos de nuestra misión", "lia"),
  L(49, "comando", "Mensaje del Comando Estelar", "lia"),

  L(50, "maestras", "Nuestras Guardianas"),
  L(51, "mision", "Misión completada"),
  L(52, "grupal", "Recuerdos del salón"),
  L(53, "mision", "Mensaje de cierre de misión"),
  L(54, "cierre", "Hasta siempre, generación"),
  L(55, "cierre", "Misión cumplida"),
];

export function laminasForSlug(slug: string) {
  return PDF_MANIFEST.filter((l) => l.slug === slug);
}

export function laminasByKind(kind: LaminaKind) {
  return PDF_MANIFEST.filter((l) => l.kind === kind && !l.slug);
}

export function laminasShared() {
  return PDF_MANIFEST.filter((l) => !l.slug);
}
