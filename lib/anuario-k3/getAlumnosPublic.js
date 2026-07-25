import connectDB from '@/lib/anuario-k3/mongodb';
import Alumno from '@/lib/anuario-k3/models/Alumno';

const FEM = new Set([
  'fernanda',
  'ana pau',
  'naty',
  'luciana',
  'amaia',
  'cami',
  'lia',
  'kesleigh',
  'sara',
  'romina',
]);

function slugify(nombreCorto = '') {
  return String(nombreCorto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

function accentFor(slug, genero) {
  const map = {
    amaia: '#E8A0BF',
    fabio: '#3B82F6',
    lia: '#F472B6',
    elias: '#60A5FA',
    fernanda: '#F5B041',
    'ana-pau': '#C084FC',
    gabito: '#34D399',
    naty: '#FB7185',
    matthias: '#A78BFA',
    luciana: '#F472B6',
    cami: '#FBBF24',
    kesleigh: '#F9A8D4',
    sara: '#FDA4AF',
    romina: '#C4B5FD',
  };
  return map[slug] || (genero === 'f' ? '#F9A8D4' : '#60A5FA');
}

/** Datos públicos para demos (sin tokens sensibles). */
export async function getAlumnosPublic() {
  await connectDB();
  const rows = await Alumno.find().sort('nombreCorto').lean();

  return rows.map((a) => {
    const slug = a.slug || slugify(a.nombreCorto);
    const genero = FEM.has(String(a.nombreCorto || '').toLowerCase()) ? 'f' : 'm';
    const fotos = Array.isArray(a.fotos) ? a.fotos : [];
    return {
      id: String(a._id),
      slug,
      nombreCorto: a.nombreCorto || '',
      nombreCompleto: a.nombreCompleto || a.nombreCorto || '',
      genero,
      accent: accentFor(slug, genero),
      suenioDeGrande: a.suenioDeGrande || '',
      comidaFavorita: a.comidaFavorita || '',
      colorFavorito: a.colorFavorito || '',
      mejorAmigo: a.mejorAmigo || '',
      fraseFavorita: a.fraseFavorita || '',
      loQueMasLeGusto: a.loQueMasLeGusto || '',
      dedicatoriaMama: a.dedicatoriaMama || '',
      dedicatoriaPapa: a.dedicatoriaPapa || '',
      formularioEnviado: Boolean(a.formularioEnviado),
      // Fotos: el admin las carga manual; usamos las del form solo si existen
      avatarSrc: fotos[0]?.url || null,
      primerDiaSrc: fotos[1]?.url || fotos[0]?.url || null,
      diaFinalSrc: fotos[2]?.url || fotos[0]?.url || null,
      manualPaths: {
        avatar: `/anuario-k3/alumnos/${slug}/avatar.jpg`,
        primerDia: `/anuario-k3/alumnos/${slug}/primer-dia.jpg`,
        diaFinal: `/anuario-k3/alumnos/${slug}/dia-final.jpg`,
      },
    };
  });
}
