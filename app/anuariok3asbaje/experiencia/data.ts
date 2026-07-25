export type StudentBadge = {
  icon: string;
  label: string;
  value: string;
  audioSrc?: string | null;
};

export type Student = {
  id: string;
  slug: string;
  nombreCorto: string;
  nombreCompleto: string;
  genero: "f" | "m";
  accent: string;
  avatarSrc: string | null;
  primerDiaSrc: string | null;
  diaFinalSrc: string | null;
  fraseAudioSrc: string | null;
  badges: StudentBadge[];
  suenioDeGrande: string;
  comidaFavorita: string;
  colorFavorito: string;
  mejorAmigo: string;
  fraseFavorita: string;
  loQueMasLeGusto: string;
  dedicatoriaMama: string;
  dedicatoriaPapa: string;
  formularioEnviado: boolean;
  /** URLs originales subidas en el formulario (Cloudinary) */
  formFotos: string[];
};

export type Teacher = {
  id: string;
  nombre: string;
  rol: string;
  fotoSrc: string | null;
  accent: string;
};

export const ASSETS = {
  heroPortada: "/anuario-k3/refs/portada-ref.png",
  cartaAudio: "/anuario-k3/carta/narracion.mp3",
  fotoGrupal: "/anuario-k3/generacion/foto-grupal.jpg",
} as const;

export const CARTA_TEXTO = `¡Al infinito y más allá!

Wow, ya creciste amigo… ¡Felicidades!

Hoy celebramos que completaste tu primera gran misión: el preescolar. Guardamos en esta bitácora tus risas, tus juegos y a tus compañeros de aventura.

Ahora te espera primaria — una nueva misión llena de descubrimientos.

¡Felicidades, generación 2024-2026!`;

export const FEATURED_SLUG = "amaia";

export const TEACHERS: Teacher[] = [
  {
    id: "vale",
    nombre: "Miss Vale",
    rol: "Guardiana Estelar",
    fotoSrc: "/anuario-k3/maestras/miss-vale.jpg",
    accent: "#7B5294",
  },
  {
    id: "paty",
    nombre: "Miss Paty",
    rol: "Guardiana Estelar",
    fotoSrc: "/anuario-k3/maestras/miss-paty.jpg",
    accent: "#F5B041",
  },
];

export function bitacoraTitulo(student: Pick<Student, "genero">) {
  return student.genero === "f" ? "Bitácora de una Vaquerita" : "Bitácora de un Vaquero";
}

export function buildBadges(a: {
  suenioDeGrande?: string;
  comidaFavorita?: string;
  colorFavorito?: string;
  mejorAmigo?: string;
  fraseFavorita?: string;
  loQueMasLeGusto?: string;
  genero?: "f" | "m";
}): StudentBadge[] {
  return [
    { icon: "★", label: "Sueña ser", value: (a.suenioDeGrande || "Por completar").toUpperCase() },
    { icon: "◆", label: "Comida favorita", value: (a.comidaFavorita || "Por completar").toUpperCase() },
    { icon: "●", label: "Color favorito", value: (a.colorFavorito || "Por completar").toUpperCase() },
    {
      icon: "✦",
      label: a.genero === "f" ? "Mejor amiga" : "Mejor amigo",
      value: (a.mejorAmigo || "Por completar").toUpperCase(),
    },
    { icon: "♫", label: "Frase favorita", value: (a.fraseFavorita || "—").toUpperCase() },
    {
      icon: "✧",
      label: "Lo que más me gustó",
      value: (a.loQueMasLeGusto || "Por completar").toUpperCase(),
    },
  ];
}

type RawAlumno = {
  id: string;
  slug: string;
  nombreCorto: string;
  nombreCompleto: string;
  genero: string;
  accent: string;
  suenioDeGrande?: string;
  comidaFavorita?: string;
  colorFavorito?: string;
  mejorAmigo?: string;
  fraseFavorita?: string;
  loQueMasLeGusto?: string;
  dedicatoriaMama?: string;
  dedicatoriaPapa?: string;
  formularioEnviado?: boolean;
  avatarSrc?: string | null;
  primerDiaSrc?: string | null;
  diaFinalSrc?: string | null;
  fotos?: string[];
};

/** Convierte alumnos de Mongo → modelo de la experiencia Toy Story */
export function mapAlumnosToStudents(rows: RawAlumno[]): Student[] {
  return rows.map((a) => {
    const genero: "f" | "m" = a.genero === "f" ? "f" : "m";
    const formFotos = Array.isArray(a.fotos) ? a.fotos.filter(Boolean) : [];
    return {
      id: a.id,
      slug: a.slug,
      nombreCorto: a.nombreCorto,
      nombreCompleto: a.nombreCompleto || a.nombreCorto,
      genero,
      accent: a.accent,
      avatarSrc: a.avatarSrc || formFotos[0] || null,
      primerDiaSrc: a.primerDiaSrc || formFotos[1] || formFotos[0] || null,
      diaFinalSrc: a.diaFinalSrc || formFotos[2] || formFotos[0] || null,
      fraseAudioSrc: null,
      badges: buildBadges({ ...a, genero }),
      suenioDeGrande: a.suenioDeGrande || "",
      comidaFavorita: a.comidaFavorita || "",
      colorFavorito: a.colorFavorito || "",
      mejorAmigo: a.mejorAmigo || "",
      fraseFavorita: a.fraseFavorita || "",
      loQueMasLeGusto: a.loQueMasLeGusto || "",
      dedicatoriaMama: a.dedicatoriaMama || "",
      dedicatoriaPapa: a.dedicatoriaPapa || "",
      formularioEnviado: Boolean(a.formularioEnviado),
      formFotos,
    };
  });
}
