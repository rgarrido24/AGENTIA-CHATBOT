import { getAlumnosPublic } from "@/lib/anuario-k3/getAlumnosPublic";
import type { DemoStudent } from "../_components/DemoRoster";

export async function loadDemoStudents(): Promise<DemoStudent[]> {
  try {
    const rows = await getAlumnosPublic();
    return rows.map((a: {
      id: string;
      slug: string;
      nombreCorto: string;
      nombreCompleto: string;
      genero: string;
      accent: string;
      suenioDeGrande: string;
      comidaFavorita: string;
      colorFavorito: string;
      mejorAmigo: string;
      fraseFavorita: string;
      loQueMasLeGusto: string;
      avatarSrc: string | null;
      primerDiaSrc: string | null;
      diaFinalSrc: string | null;
      formularioEnviado?: boolean;
      dedicatoriaMama?: string;
      dedicatoriaPapa?: string;
    }) => ({
      id: a.id,
      slug: a.slug,
      nombreCorto: a.nombreCorto,
      nombreCompleto: a.nombreCompleto,
      genero: a.genero === "f" ? "f" : "m",
      accent: a.accent,
      suenioDeGrande: a.suenioDeGrande || "",
      comidaFavorita: a.comidaFavorita || "",
      colorFavorito: a.colorFavorito || "",
      mejorAmigo: a.mejorAmigo || "",
      fraseFavorita: a.fraseFavorita || "",
      loQueMasLeGusto: a.loQueMasLeGusto || "",
      avatarSrc: a.avatarSrc,
      primerDiaSrc: a.primerDiaSrc,
      diaFinalSrc: a.diaFinalSrc,
      formularioEnviado: a.formularioEnviado,
      dedicatoriaMama: a.dedicatoriaMama || "",
      dedicatoriaPapa: a.dedicatoriaPapa || "",
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
