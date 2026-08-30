/**
 * Normaliza un alumno Mongo → payload de la experiencia Memoria.
 * Arquitectura extensible: videos/audios/mensajes extra viven en memoria.*
 */

export function mapAlumnoToMemoria(alumno, opts = {}) {
  const m = alumno.memoria || {};
  const fotosForm = (alumno.fotos || []).map((f) => ({
    url: f.url,
    publicId: f.publicId || '',
    caption: f.caption || '',
    kind: 'image',
  }));
  const recuerdos = (m.recuerdos || []).map((f) => ({
    url: f.url,
    publicId: f.publicId || '',
    caption: f.caption || '',
    kind: 'image',
  }));

  const gallery = [...recuerdos, ...fotosForm].filter((x) => x.url);
  const unique = [];
  const seen = new Set();
  for (const g of gallery) {
    if (seen.has(g.url)) continue;
    seen.add(g.url);
    unique.push(g);
  }

  const mensajes = [];
  if (m.mensajes?.length) {
    for (const msg of m.mensajes) {
      if (msg?.texto?.trim()) mensajes.push({ autor: msg.autor || 'Familia', texto: msg.texto.trim() });
    }
  }
  if (alumno.dedicatoriaMama?.trim()) {
    mensajes.push({ autor: 'Mamá', texto: alumno.dedicatoriaMama.trim() });
  }
  if (alumno.dedicatoriaPapa?.trim()) {
    mensajes.push({ autor: 'Papá', texto: alumno.dedicatoriaPapa.trim() });
  }

  return {
    id: String(alumno._id || alumno.slug),
    slug: alumno.slug,
    token: alumno.token,
    nombre: alumno.nombreCorto || alumno.nombreCompleto || 'Alumno',
    nombreCompleto: alumno.nombreCompleto || alumno.nombreCorto || '',
    generacion: opts.generacion || '2024-2025',
    salon: opts.salon || 'Kinder 3 · Asbaje',
    portadaUrl: m.portadaUrl || unique[0]?.url || '',
    perfilUrl: m.perfilUrl || unique[0]?.url || m.portadaUrl || '',
    gallery: unique,
    facts: {
      color: alumno.colorFavorito || '',
      sueno: alumno.suenioDeGrande || '',
      comida: alumno.comidaFavorita || '',
      amigos: alumno.mejorAmigo || '',
      frase: alumno.fraseFavorita || '',
      gusto: alumno.loQueMasLeGusto || '',
    },
    mensajes,
    published: Boolean(m.published),
    /** Extensible: futuros assets sin romper shape */
    media: {
      videos: m.videos || [],
      audios: m.audios || [],
    },
  };
}
