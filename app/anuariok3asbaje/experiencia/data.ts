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
};

export type Teacher = {
  id: string;
  nombre: string;
  rol: string;
  fotoSrc: string | null;
  accent: string;
};

/** Rutas listas para reemplazar por archivos reales en /public/anuario-k3 */
export const ASSETS = {
  heroPortada: "/anuario-k3/hero/portada.jpg",
  cartaAudio: "/anuario-k3/carta/narracion.mp3",
  fotoGrupal: "/anuario-k3/generacion/foto-grupal.jpg",
} as const;

export const CARTA_TEXTO = `¡Al infinito y más allá!

Wow, ya creciste amigo… ¡Felicidades!

Hoy celebramos que completaste tu primera gran misión: el preescolar. Guardamos en esta bitácora tus risas, tus juegos y a tus compañeros de aventura.

Ahora te espera primaria — una nueva misión llena de descubrimientos.

¡Felicidades, generación 2024-2026!`;

function pathAvatar(slug: string) {
  return `/anuario-k3/alumnos/${slug}/avatar.jpg`;
}

function pathPrimer(slug: string) {
  return `/anuario-k3/alumnos/${slug}/primer-dia.jpg`;
}

function pathFinal(slug: string) {
  return `/anuario-k3/alumnos/${slug}/dia-final.jpg`;
}

function pathFrase(slug: string) {
  return `/anuario-k3/alumnos/${slug}/frase.mp3`;
}

/** Amaia con datos reales de plantilla; el resto listo para completar */
export const FEATURED_SLUG = "amaia";

export const STUDENTS: Student[] = [
  {
    id: "amaia",
    slug: "amaia",
    nombreCorto: "Amaia",
    nombreCompleto: "Amaia Garrido Cárdenas",
    genero: "f",
    accent: "#E8A0BF",
    avatarSrc: pathAvatar("amaia"),
    primerDiaSrc: pathPrimer("amaia"),
    diaFinalSrc: pathFinal("amaia"),
    fraseAudioSrc: pathFrase("amaia"),
    badges: [
      { icon: "🚒", label: "Sueña ser", value: "BOMBERO" },
      { icon: "🌭", label: "Comida favorita", value: "HOT DOG" },
      { icon: "🎨", label: "Color favorito", value: "ROSA" },
      { icon: "👧", label: "Mejor amiga", value: "SARITA, FER" },
      {
        icon: "🎙️",
        label: "Frase favorita",
        value: "DIME VERDAD",
        audioSrc: pathFrase("amaia"),
      },
      { icon: "🎈", label: "Lo que más me gustó", value: "JUGAR CON MIS AMIGOS" },
    ],
  },
  {
    id: "elias",
    slug: "elias",
    nombreCorto: "Elías",
    nombreCompleto: "Elías",
    genero: "m",
    accent: "#5B8DEF",
    avatarSrc: pathAvatar("elias"),
    primerDiaSrc: pathPrimer("elias"),
    diaFinalSrc: pathFinal("elias"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "fernanda",
    slug: "fernanda",
    nombreCorto: "Fernanda",
    nombreCompleto: "Fernanda",
    genero: "f",
    accent: "#F5B041",
    avatarSrc: pathAvatar("fernanda"),
    primerDiaSrc: pathPrimer("fernanda"),
    diaFinalSrc: pathFinal("fernanda"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "ana-pau",
    slug: "ana-pau",
    nombreCorto: "Ana Pau",
    nombreCompleto: "Ana Pau",
    genero: "f",
    accent: "#C084FC",
    avatarSrc: pathAvatar("ana-pau"),
    primerDiaSrc: pathPrimer("ana-pau"),
    diaFinalSrc: pathFinal("ana-pau"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "gabito",
    slug: "gabito",
    nombreCorto: "Gabito",
    nombreCompleto: "Gabito",
    genero: "m",
    accent: "#34D399",
    avatarSrc: pathAvatar("gabito"),
    primerDiaSrc: pathPrimer("gabito"),
    diaFinalSrc: pathFinal("gabito"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "naty",
    slug: "naty",
    nombreCorto: "Naty",
    nombreCompleto: "Naty",
    genero: "f",
    accent: "#FB7185",
    avatarSrc: pathAvatar("naty"),
    primerDiaSrc: pathPrimer("naty"),
    diaFinalSrc: pathFinal("naty"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "fabio",
    slug: "fabio",
    nombreCorto: "Fabio",
    nombreCompleto: "Fabio",
    genero: "m",
    accent: "#38BDF8",
    avatarSrc: pathAvatar("fabio"),
    primerDiaSrc: pathPrimer("fabio"),
    diaFinalSrc: pathFinal("fabio"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "matthias",
    slug: "matthias",
    nombreCorto: "Matthías",
    nombreCompleto: "Matthías",
    genero: "m",
    accent: "#A78BFA",
    avatarSrc: pathAvatar("matthias"),
    primerDiaSrc: pathPrimer("matthias"),
    diaFinalSrc: pathFinal("matthias"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "luciana",
    slug: "luciana",
    nombreCorto: "Luciana",
    nombreCompleto: "Luciana",
    genero: "f",
    accent: "#F472B6",
    avatarSrc: pathAvatar("luciana"),
    primerDiaSrc: pathPrimer("luciana"),
    diaFinalSrc: pathFinal("luciana"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "cami",
    slug: "cami",
    nombreCorto: "Cami",
    nombreCompleto: "Cami",
    genero: "f",
    accent: "#FBBF24",
    avatarSrc: pathAvatar("cami"),
    primerDiaSrc: pathPrimer("cami"),
    diaFinalSrc: pathFinal("cami"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "lia",
    slug: "lia",
    nombreCorto: "Lia",
    nombreCompleto: "Lia",
    genero: "f",
    accent: "#67E8F9",
    avatarSrc: pathAvatar("lia"),
    primerDiaSrc: pathPrimer("lia"),
    diaFinalSrc: pathFinal("lia"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "kesleigh",
    slug: "kesleigh",
    nombreCorto: "Kesleigh",
    nombreCompleto: "Kesleigh",
    genero: "f",
    accent: "#F9A8D4",
    avatarSrc: pathAvatar("kesleigh"),
    primerDiaSrc: pathPrimer("kesleigh"),
    diaFinalSrc: pathFinal("kesleigh"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "sara",
    slug: "sara",
    nombreCorto: "Sara",
    nombreCompleto: "Sara",
    genero: "f",
    accent: "#FDA4AF",
    avatarSrc: pathAvatar("sara"),
    primerDiaSrc: pathPrimer("sara"),
    diaFinalSrc: pathFinal("sara"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
  {
    id: "romina",
    slug: "romina",
    nombreCorto: "Romina",
    nombreCompleto: "Romina",
    genero: "f",
    accent: "#C4B5FD",
    avatarSrc: pathAvatar("romina"),
    primerDiaSrc: pathPrimer("romina"),
    diaFinalSrc: pathFinal("romina"),
    fraseAudioSrc: null,
    badges: placeholderBadges(),
  },
];

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

function placeholderBadges(): StudentBadge[] {
  return [
    { icon: "⭐", label: "Sueña ser", value: "Por completar" },
    { icon: "🍕", label: "Comida favorita", value: "Por completar" },
    { icon: "🎨", label: "Color favorito", value: "Por completar" },
    { icon: "🤝", label: "Mejor amigo", value: "Por completar" },
    { icon: "💬", label: "Frase favorita", value: "Por completar" },
    { icon: "🎈", label: "Lo que más me gustó", value: "Por completar" },
  ];
}

export function bitacoraTitulo(student: Student) {
  return student.genero === "f" ? "Bitácora de una Vaquerita" : "Bitácora de un Vaquero";
}

export function getStudent(slug: string) {
  return STUDENTS.find((s) => s.slug === slug);
}
