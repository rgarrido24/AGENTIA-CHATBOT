/**
 * Escenas visuales modernas por keyword (sueño / comida / color / recuerdo).
 * Sin clipart 1988: formas CSS + tipografía + motion-ready classes.
 */

export type SceneKind = "dream" | "food" | "color" | "friends" | "phrase" | "memory";

export type SceneSpec = {
  kind: SceneKind;
  label: string;
  title: string;
  subtitle: string;
  motif: string;
  gradient: string;
  shapes: Array<"orb" | "ring" | "grid" | "wave" | "spark" | "plate">;
};

function includesAny(text: string, words: string[]) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

export function sceneForDream(raw: string): SceneSpec {
  const v = raw || "Por descubrir";
  if (includesAny(v, ["bomber", "fuego", "fire"])) {
    return {
      kind: "dream",
      label: "Sueña ser",
      title: v,
      subtitle: "Sirenas, valor y mangueras de valentía",
      motif: "truck",
      gradient: "linear-gradient(145deg,#ff6b35,#c1121f 55%,#1d3557)",
      shapes: ["orb", "spark", "ring"],
    };
  }
  if (includesAny(v, ["astronaut", "espacio", "estrella", "piloto"])) {
    return {
      kind: "dream",
      label: "Sueña ser",
      title: v,
      subtitle: "Órbitas y polvo de estrellas",
      motif: "rocket",
      gradient: "linear-gradient(145deg,#0b132b,#1c2541,#5bc0be)",
      shapes: ["orb", "spark", "ring"],
    };
  }
  if (includesAny(v, ["doctor", "enfermer", "medic"])) {
    return {
      kind: "dream",
      label: "Sueña ser",
      title: v,
      subtitle: "Manos que cuidan",
      motif: "care",
      gradient: "linear-gradient(145deg,#edf6f9,#00a896,#028090)",
      shapes: ["orb", "ring"],
    };
  }
  if (includesAny(v, ["maestro", "maestra", "profe"])) {
    return {
      kind: "dream",
      label: "Sueña ser",
      title: v,
      subtitle: "Aulas llenas de magia",
      motif: "chalk",
      gradient: "linear-gradient(145deg,#ffe8d6,#ddbea9,#cb997e)",
      shapes: ["grid", "orb"],
    };
  }
  return {
    kind: "dream",
    label: "Sueña ser",
    title: v,
    subtitle: "Una misión por cumplir",
    motif: "star",
    gradient: "linear-gradient(145deg,#7b2cbf,#c77dff,#ff9e00)",
    shapes: ["orb", "spark"],
  };
}

export function sceneForFood(raw: string): SceneSpec {
  const v = raw || "Por descubrir";
  if (includesAny(v, ["hot dog", "hotdog", "salchicha"])) {
    return {
      kind: "food",
      label: "Comida favorita",
      title: v,
      subtitle: "Crujiente, jugoso, inolvidable",
      motif: "hotdog",
      gradient: "linear-gradient(145deg,#fff1e6,#ffb703,#fb8500)",
      shapes: ["plate", "orb"],
    };
  }
  if (includesAny(v, ["pizza"])) {
    return {
      kind: "food",
      label: "Comida favorita",
      title: v,
      subtitle: "Queso derretido y estrellas",
      motif: "pizza",
      gradient: "linear-gradient(145deg,#fff6e5,#e63946,#f4a261)",
      shapes: ["plate", "ring"],
    };
  }
  if (includesAny(v, ["taco", "tortilla"])) {
    return {
      kind: "food",
      label: "Comida favorita",
      title: v,
      subtitle: "Sazón de casa",
      motif: "taco",
      gradient: "linear-gradient(145deg,#fefae0,#dda15e,#bc6c25)",
      shapes: ["plate", "wave"],
    };
  }
  if (includesAny(v, ["helado", "nieve", "ice"])) {
    return {
      kind: "food",
      label: "Comida favorita",
      title: v,
      subtitle: "Dulzura en órbita",
      motif: "ice",
      gradient: "linear-gradient(145deg,#caf0f8,#90e0ef,#ffafcc)",
      shapes: ["orb", "plate"],
    };
  }
  return {
    kind: "food",
    label: "Comida favorita",
    title: v,
    subtitle: "El sabor de la misión",
    motif: "plate",
    gradient: "linear-gradient(145deg,#f8edeb,#fcd5ce,#f9dcc4)",
    shapes: ["plate", "orb"],
  };
}

export function sceneForColor(raw: string): SceneSpec {
  const v = raw || "Por descubrir";
  let gradient = "linear-gradient(145deg,#e9ecef,#adb5bd)";
  if (includesAny(v, ["rosa", "pink", "fucsia"])) gradient = "linear-gradient(145deg,#ffc2d1,#ff8fab,#fb6f92)";
  else if (includesAny(v, ["azul", "blue"])) gradient = "linear-gradient(145deg,#caf0f8,#00b4d8,#0077b6)";
  else if (includesAny(v, ["amarillo", "yellow", "dorado"])) gradient = "linear-gradient(145deg,#fff3b0,#ffd60a,#e85d04)";
  else if (includesAny(v, ["verde", "green"])) gradient = "linear-gradient(145deg,#d8f3dc,#95d5b2,#2d6a4f)";
  else if (includesAny(v, ["morado", "lila", "violeta", "purple"])) gradient = "linear-gradient(145deg,#e0aaff,#9d4edd,#5a189a)";
  else if (includesAny(v, ["rojo", "red"])) gradient = "linear-gradient(145deg,#ffb3c1,#ff4d6d,#c9184a)";
  return {
    kind: "color",
    label: "Color favorito",
    title: v,
    subtitle: "La paleta de su mundo",
    motif: "swatch",
    gradient,
    shapes: ["orb", "ring", "wave"],
  };
}

export function sceneForFriends(raw: string): SceneSpec {
  return {
    kind: "friends",
    label: "Mejor amigo/a",
    title: raw || "Por descubrir",
    subtitle: "Compañeros de misión",
    motif: "duo",
    gradient: "linear-gradient(145deg,#edf2fb,#abc4ff,#b6ccfe)",
    shapes: ["orb", "ring"],
  };
}

export function sceneForPhrase(raw: string): SceneSpec {
  return {
    kind: "phrase",
    label: "Frase favorita",
    title: raw || "…",
    subtitle: "Con su propia voz",
    motif: "voice",
    gradient: "linear-gradient(145deg,#f8f9fa,#dee2e6,#4cc9f0)",
    shapes: ["wave", "spark"],
  };
}

export function sceneForMemory(raw: string): SceneSpec {
  return {
    kind: "memory",
    label: "Lo que más le gustó",
    title: raw || "Por descubrir",
    subtitle: "Recuerdo guardado en la bitácora",
    motif: "balloon",
    gradient: "linear-gradient(145deg,#fff6e5,#ffd6a5,#fdffb6)",
    shapes: ["orb", "spark", "wave"],
  };
}

export function scenesForStudent(s: {
  suenioDeGrande?: string;
  comidaFavorita?: string;
  colorFavorito?: string;
  mejorAmigo?: string;
  fraseFavorita?: string;
  loQueMasLeGusto?: string;
}) {
  return [
    sceneForDream(s.suenioDeGrande || ""),
    sceneForFood(s.comidaFavorita || ""),
    sceneForColor(s.colorFavorito || ""),
    sceneForFriends(s.mejorAmigo || ""),
    sceneForPhrase(s.fraseFavorita || ""),
    sceneForMemory(s.loQueMasLeGusto || ""),
  ];
}
