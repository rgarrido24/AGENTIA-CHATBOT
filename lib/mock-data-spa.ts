/**
 * Demo Lumina Spa & Estética
 */

export type CategoriaServicio = 'Facial' | 'Masaje' | 'Corporal' | 'Uñas' | 'Depilación';

export type Servicio = {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  duracion: number;
  precio: number;
  descripcion: string;
  especialista: string;
  disponible: boolean;
  emoji: string;
  imagen: string;
};

export type Especialista = {
  id: string;
  nombre: string;
  especialidades: string[];
  turno: 'mañana' | 'tarde' | 'completo';
  foto: string;
  citas_hoy: number;
  disponibleAhora: boolean;
};

export type NivelCliente = 'Nuevo' | 'Regular' | 'VIP';

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  visitas: number;
  ultimaVisita: string;
  servicioFavorito: string;
  gasto_total: number;
  notas: string;
  nivel: NivelCliente;
};

export type StatusCita = 'confirmada' | 'pendiente' | 'completada' | 'cancelada';

export type Cita = {
  id: string;
  clienteId: string;
  servicioId: string;
  especialistaId: string;
  fecha: string;
  hora: string;
  duracion: number;
  precio: number;
  status: StatusCita;
  notas: string;
};

export const BRAND_SPA = {
  nombre: 'Lumina Spa & Estética',
  corto: 'Lumina',
} as const;

// Imágenes Unsplash temáticas para cada servicio
const IMG_SPA = {
  facialLimpieza:    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  facialHidratacion: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80',
  facialAntiedad:    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
  facialPeeling:     'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80',
  masajeAroma:       'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
  masajePiedras:     'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&q=80',
  masajeEspalda:     'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80',
  masajeReflex:      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80',
  corpChocolate:     'https://images.unsplash.com/photo-1556760544-74068565f05c?w=600&q=80',
  corpExfol:         'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80',
  corpAnticel:       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
  corpHidrat:        'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=600&q=80',
  manicure:          'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
  pedicure:          'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80',
  semiManos:         'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80',
  semiPies:          'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=600&q=80',
  depAxilas:         'https://images.unsplash.com/photo-1591019479261-1a0a0e6ce3b6?w=600&q=80',
  depPiernas:        'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&q=80',
  depBikini:         'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
  depCejas:          'https://images.unsplash.com/photo-1487412840807-30bfeb8df876?w=600&q=80',
};

export const MOCK_SERVICIOS: Servicio[] = [
  // Faciales
  {
    id: 's1',
    nombre: 'Limpieza facial profunda',
    categoria: 'Facial',
    duracion: 60,
    precio: 450,
    descripcion: 'Limpieza profunda con extracción suave.',
    especialista: 'Ana Flores',
    disponible: true,
    emoji: '✨',
    imagen: IMG_SPA.facialLimpieza,
  },
  {
    id: 's2',
    nombre: 'Hidratación intensiva',
    categoria: 'Facial',
    duracion: 75,
    precio: 550,
    descripcion: 'Mascarillas y sérum de alta hidratación.',
    especialista: 'Ana Flores',
    disponible: true,
    emoji: '💧',
    imagen: IMG_SPA.facialHidratacion,
  },
  {
    id: 's3',
    nombre: 'Rejuvenecimiento',
    categoria: 'Facial',
    duracion: 90,
    precio: 850,
    descripcion: 'Tratamiento anti-edad con vitamina C.',
    especialista: 'Carmen Ruiz',
    disponible: true,
    emoji: '🌟',
    imagen: IMG_SPA.facialAntiedad,
  },
  {
    id: 's4',
    nombre: 'Peeling químico',
    categoria: 'Facial',
    duracion: 60,
    precio: 750,
    descripcion: 'Renovación celular supervisada.',
    especialista: 'Carmen Ruiz',
    disponible: true,
    emoji: '🧪',
    imagen: IMG_SPA.facialPeeling,
  },
  // Masajes
  {
    id: 's5',
    nombre: 'Relajante aromaterapia',
    categoria: 'Masaje',
    duracion: 60,
    precio: 600,
    descripcion: 'Aceites esenciales y música envolvente.',
    especialista: 'Sofía Mendez',
    disponible: true,
    emoji: '🌸',
    imagen: IMG_SPA.masajeAroma,
  },
  {
    id: 's6',
    nombre: 'Piedras calientes',
    categoria: 'Masaje',
    duracion: 90,
    precio: 800,
    descripcion: 'Masaje con piedras volcánicas.',
    especialista: 'Sofía Mendez',
    disponible: true,
    emoji: '🔥',
    imagen: IMG_SPA.masajePiedras,
  },
  {
    id: 's7',
    nombre: 'Descontracturante',
    categoria: 'Masaje',
    duracion: 60,
    precio: 650,
    descripcion: 'Enfoque en espalda y cuello.',
    especialista: 'Laura Torres',
    disponible: true,
    emoji: '💆',
    imagen: IMG_SPA.masajeEspalda,
  },
  {
    id: 's8',
    nombre: 'Reflexología',
    categoria: 'Masaje',
    duracion: 45,
    precio: 500,
    descripcion: 'Estimulación de puntos en pies.',
    especialista: 'Laura Torres',
    disponible: true,
    emoji: '🦶',
    imagen: IMG_SPA.masajeReflex,
  },
  // Corporales
  {
    id: 's9',
    nombre: 'Envoltura de chocolate',
    categoria: 'Corporal',
    duracion: 90,
    precio: 900,
    descripcion: 'Ritual detox y nutrición de la piel.',
    especialista: 'Daniela Vega',
    disponible: true,
    emoji: '🍫',
    imagen: IMG_SPA.corpChocolate,
  },
  {
    id: 's10',
    nombre: 'Exfoliación corporal',
    categoria: 'Corporal',
    duracion: 60,
    precio: 550,
    descripcion: 'Sales y aceites naturales.',
    especialista: 'Daniela Vega',
    disponible: true,
    emoji: '🧴',
    imagen: IMG_SPA.corpExfol,
  },
  {
    id: 's11',
    nombre: 'Tratamiento anticelulítico',
    categoria: 'Corporal',
    duracion: 60,
    precio: 750,
    descripcion: 'Drenaje y radiofrecuencia suave.',
    especialista: 'Ana Flores',
    disponible: true,
    emoji: '💫',
    imagen: IMG_SPA.corpAnticel,
  },
  {
    id: 's12',
    nombre: 'Hidratación corporal',
    categoria: 'Corporal',
    duracion: 60,
    precio: 600,
    descripcion: 'Crema de karité y aloe.',
    especialista: 'Carmen Ruiz',
    disponible: true,
    emoji: '🌿',
    imagen: IMG_SPA.corpHidrat,
  },
  // Uñas
  {
    id: 's13',
    nombre: 'Manicure clásico',
    categoria: 'Uñas',
    duracion: 30,
    precio: 180,
    descripcion: 'Corte, limado y esmaltado.',
    especialista: 'Sofía Mendez',
    disponible: true,
    emoji: '💅',
    imagen: IMG_SPA.manicure,
  },
  {
    id: 's14',
    nombre: 'Pedicure clásico',
    categoria: 'Uñas',
    duracion: 45,
    precio: 220,
    descripcion: 'Spa de pies con exfoliación.',
    especialista: 'Sofía Mendez',
    disponible: true,
    emoji: '🦶',
    imagen: IMG_SPA.pedicure,
  },
  {
    id: 's15',
    nombre: 'Semipermanente manos',
    categoria: 'Uñas',
    duracion: 45,
    precio: 280,
    descripcion: 'Esmaltado gel duradero.',
    especialista: 'Laura Torres',
    disponible: true,
    emoji: '💅',
    imagen: IMG_SPA.semiManos,
  },
  {
    id: 's16',
    nombre: 'Semipermanente pies',
    categoria: 'Uñas',
    duracion: 60,
    precio: 320,
    descripcion: 'Acabado profesional en pies.',
    especialista: 'Laura Torres',
    disponible: true,
    emoji: '✨',
    imagen: IMG_SPA.semiPies,
  },
  // Depilación
  {
    id: 's17',
    nombre: 'Axilas',
    categoria: 'Depilación',
    duracion: 20,
    precio: 150,
    descripcion: 'Cera hipoalergénica.',
    especialista: 'Daniela Vega',
    disponible: true,
    emoji: '🪒',
    imagen: IMG_SPA.depAxilas,
  },
  {
    id: 's18',
    nombre: 'Piernas completas',
    categoria: 'Depilación',
    duracion: 45,
    precio: 450,
    descripcion: 'Depilación completa de piernas.',
    especialista: 'Daniela Vega',
    disponible: true,
    emoji: '🦵',
    imagen: IMG_SPA.depPiernas,
  },
  {
    id: 's19',
    nombre: 'Bikini',
    categoria: 'Depilación',
    duracion: 30,
    precio: 280,
    descripcion: 'Diseño según preferencia.',
    especialista: 'Ana Flores',
    disponible: true,
    emoji: '👙',
    imagen: IMG_SPA.depBikini,
  },
  {
    id: 's20',
    nombre: 'Cejas',
    categoria: 'Depilación',
    duracion: 15,
    precio: 120,
    descripcion: 'Diseño y depilación con cera.',
    especialista: 'Carmen Ruiz',
    disponible: true,
    emoji: '👁️',
    imagen: IMG_SPA.depCejas,
  },
];

export const MOCK_ESPECIALISTAS: Especialista[] = [
  {
    id: 'e1',
    nombre: 'Ana Flores',
    especialidades: ['Facial', 'Corporal', 'Depilación'],
    turno: 'completo',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    citas_hoy: 3,
    disponibleAhora: true,
  },
  {
    id: 'e2',
    nombre: 'Carmen Ruiz',
    especialidades: ['Facial', 'Corporal'],
    turno: 'mañana',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    citas_hoy: 2,
    disponibleAhora: false,
  },
  {
    id: 'e3',
    nombre: 'Sofía Mendez',
    especialidades: ['Masaje', 'Uñas'],
    turno: 'completo',
    foto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80',
    citas_hoy: 4,
    disponibleAhora: true,
  },
  {
    id: 'e4',
    nombre: 'Laura Torres',
    especialidades: ['Masaje', 'Uñas'],
    turno: 'tarde',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    citas_hoy: 2,
    disponibleAhora: true,
  },
  {
    id: 'e5',
    nombre: 'Daniela Vega',
    especialidades: ['Corporal', 'Depilación'],
    turno: 'completo',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80',
    citas_hoy: 3,
    disponibleAhora: true,
  },
];

const nombres = [
  'María López',
  'Patricia Soto',
  'Lucía Herrera',
  'Gabriela Ruiz',
  'Andrea Campos',
  'Fernanda Díaz',
  'Valeria Núñez',
  'Daniela Ortiz',
  'Sofía Méndez',
  'Renata Vega',
  'Camila Ríos',
  'Paula Castro',
  'Natalia León',
  'Elena Vidal',
  'Mónica Paz',
  'Jimena Solís',
  'Alejandra Mora',
  'Ivanna Cruz',
  'Regina Fuentes',
  'Claudia Reyes',
];

const niveles: NivelCliente[] = [
  ...Array(5).fill('Nuevo' as NivelCliente),
  ...Array(10).fill('Regular' as NivelCliente),
  ...Array(5).fill('VIP' as NivelCliente),
];

export const MOCK_CLIENTES: Cliente[] = nombres.map((nombre, i) => ({
  id: `c${i + 1}`,
  nombre,
  telefono: `999-${String(100 + i)}-${String(2000 + i)}`,
  email: `cliente${i + 1}@email.com`,
  fechaNacimiento: `199${i % 10}-0${(i % 9) + 1}-15`,
  visitas: 1 + (i % 12) * 2,
  ultimaVisita: i % 3 === 0 ? '2026-03-18' : '2026-02-10',
  servicioFavorito: MOCK_SERVICIOS[i % MOCK_SERVICIOS.length].nombre,
  gasto_total: 1200 + i * 450,
  notas: i % 4 === 0 ? 'Alergia a fragancias fuertes' : 'Prefiere horario matutino',
  nivel: niveles[i]!,
}));

const HOY = '2026-03-20';

function cita(
  id: string,
  clienteIdx: number,
  servicioIdx: number,
  espIdx: number,
  fecha: string,
  hora: string,
  status: StatusCita
): Cita {
  const s = MOCK_SERVICIOS[servicioIdx]!;
  const precio = s.precio;
  return {
    id,
    clienteId: MOCK_CLIENTES[clienteIdx]!.id,
    servicioId: s.id,
    especialistaId: MOCK_ESPECIALISTAS[espIdx]!.id,
    fecha,
    hora,
    duracion: s.duracion,
    precio,
    status,
    notas: '',
  };
}

/** 30 citas: 8 hoy, 12 esta semana (no hoy), 10 históricas */
export const MOCK_CITAS: Cita[] = [
  // 8 hoy
  cita('ct1', 0, 4, 2, HOY, '10:00', 'confirmada'),
  cita('ct2', 1, 5, 2, HOY, '11:30', 'confirmada'),
  cita('ct3', 2, 6, 3, HOY, '12:00', 'pendiente'),
  cita('ct4', 3, 12, 2, HOY, '14:00', 'confirmada'),
  cita('ct5', 4, 0, 0, HOY, '15:30', 'confirmada'),
  cita('ct6', 5, 7, 3, HOY, '16:00', 'completada'),
  cita('ct7', 6, 14, 3, HOY, '17:00', 'confirmada'),
  cita('ct8', 7, 8, 4, HOY, '18:30', 'pendiente'),
  // semana 17-23 mar (sin duplicar todas en hoy)
  cita('ct9', 8, 1, 0, '2026-03-17', '09:00', 'completada'),
  cita('ct10', 9, 2, 1, '2026-03-17', '11:00', 'completada'),
  cita('ct11', 10, 9, 4, '2026-03-18', '10:00', 'confirmada'),
  cita('ct12', 11, 10, 4, '2026-03-18', '14:00', 'cancelada'),
  cita('ct13', 12, 3, 1, '2026-03-19', '09:30', 'completada'),
  cita('ct14', 13, 11, 0, '2026-03-19', '16:00', 'confirmada'),
  cita('ct15', 14, 13, 2, '2026-03-21', '10:00', 'confirmada'),
  cita('ct16', 15, 15, 3, '2026-03-21', '12:00', 'pendiente'),
  cita('ct17', 16, 16, 4, '2026-03-22', '11:00', 'confirmada'),
  cita('ct18', 17, 17, 4, '2026-03-22', '15:00', 'confirmada'),
  cita('ct19', 18, 18, 0, '2026-03-23', '10:00', 'pendiente'),
  cita('ct20', 19, 6, 3, '2026-03-23', '13:00', 'confirmada'),
  // históricas
  cita('ct21', 0, 5, 2, '2026-02-01', '10:00', 'completada'),
  cita('ct22', 1, 0, 0, '2026-02-05', '11:00', 'completada'),
  cita('ct23', 2, 8, 3, '2026-02-08', '09:00', 'completada'),
  cita('ct24', 3, 12, 2, '2026-02-12', '14:00', 'completada'),
  cita('ct25', 4, 4, 2, '2026-02-15', '16:00', 'completada'),
  cita('ct26', 5, 9, 4, '2026-02-20', '10:00', 'completada'),
  cita('ct27', 6, 1, 1, '2026-02-22', '11:30', 'completada'),
  cita('ct28', 7, 14, 3, '2026-02-25', '12:00', 'completada'),
  cita('ct29', 8, 6, 3, '2026-02-28', '15:00', 'completada'),
  cita('ct30', 9, 3, 1, '2026-03-01', '10:00', 'completada'),
];

export function getServicio(id: string): Servicio | undefined {
  return MOCK_SERVICIOS.find((s) => s.id === id);
}

export function getCliente(id: string): Cliente | undefined {
  return MOCK_CLIENTES.find((c) => c.id === id);
}

export function getEspecialista(id: string): Especialista | undefined {
  return MOCK_ESPECIALISTAS.find((e) => e.id === id);
}

export function citasHoy(citas: Cita[], fecha = HOY): Cita[] {
  return citas.filter((c) => c.fecha === fecha);
}

export function ingresosCompletadosHoy(citas: Cita[], fecha = HOY): number {
  return citas
    .filter((c) => c.fecha === fecha && c.status === 'completada')
    .reduce((s, c) => s + c.precio, 0);
}

export function clientesVIPCount(clientes: Cliente[]): number {
  return clientes.filter((c) => c.nivel === 'VIP').length;
}

export function especialistaMasSolicitadaStats(citas: Cita[]): { especialista: Especialista; count: number } | null {
  const map = new Map<string, number>();
  for (const c of citas) {
    if (c.status === 'cancelada') continue;
    map.set(c.especialistaId, (map.get(c.especialistaId) ?? 0) + 1);
  }
  let max = 0;
  let id = '';
  for (const [k, v] of map) {
    if (v > max) {
      max = v;
      id = k;
    }
  }
  const esp = MOCK_ESPECIALISTAS.find((e) => e.id === id);
  if (!esp || max === 0) return null;
  return { especialista: esp, count: max };
}

export function topServiciosSolicitados(citas: Cita[], n = 5): { nombre: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of citas) {
    if (c.status === 'cancelada') continue;
    const s = getServicio(c.servicioId);
    if (!s) continue;
    map.set(s.nombre, (map.get(s.nombre) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nombre, count]) => ({ nombre, count }));
}

export function ingresosPorCategoria(citas: Cita[]): { name: string; value: number; fill: string }[] {
  const map = new Map<string, number>();
  const colors: Record<string, string> = {
    Facial: '#9333ea',
    Masaje: '#ec4899',
    Corporal: '#a855f7',
    Uñas: '#f472b6',
    Depilación: '#c026d3',
  };
  for (const c of citas) {
    if (c.status !== 'completada') continue;
    const s = getServicio(c.servicioId);
    if (!s) continue;
    map.set(s.categoria, (map.get(s.categoria) ?? 0) + c.precio);
  }
  return [...map.entries()].map(([name, value]) => ({
    name,
    value,
    fill: colors[name] ?? '#9333ea',
  }));
}

export const FECHA_REF_DASHBOARD = HOY;

/** Minutos desde medianoche (ej. "10:30" → 630) */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map((x) => parseInt(x, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutosAHora(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Traslape mismo especialista y fecha (ignora canceladas) */
export function hayTraslape(
  citas: Cita[],
  espId: string,
  fecha: string,
  startMin: number,
  durMin: number,
  excludeId?: string
): boolean {
  const endMin = startMin + durMin;
  for (const c of citas) {
    if (c.id === excludeId) continue;
    if (c.especialistaId !== espId || c.fecha !== fecha) continue;
    if (c.status === 'cancelada') continue;
    const s = horaAMinutos(c.hora);
    const e = s + c.duracion;
    if (startMin < e && s < endMin) return true;
  }
  return false;
}

/** Reglas demo: horario local 8:00–20:00 */
export function especialistaPuedeEnHorario(esp: Especialista, startMin: number, durMin: number): boolean {
  const end = startMin + durMin;
  if (startMin < 8 * 60 || end > 20 * 60) return false;
  if (esp.turno === 'completo') return true;
  if (esp.turno === 'mañana') return startMin < 14 * 60 && end <= 15 * 60;
  if (esp.turno === 'tarde') return startMin >= 14 * 60 && end <= 20 * 60;
  return false;
}

export function parseISODate(s: string): Date {
  const [y, mo, d] = s.split('-').map((x) => parseInt(x, 10));
  return new Date(y!, mo! - 1, d!);
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Lunes de la semana ISO (lunes = inicio) */
export function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function labelSemana(lunes: Date): string {
  const dom = addDays(lunes, 6);
  const mismoMes = lunes.getMonth() === dom.getMonth();
  if (mismoMes) {
    return `${lunes.getDate()} al ${dom.getDate()} ${MESES[dom.getMonth()]} ${dom.getFullYear()}`;
  }
  return `${lunes.getDate()} ${MESES[lunes.getMonth()]} al ${dom.getDate()} ${MESES[dom.getMonth()]} ${dom.getFullYear()}`;
}

/** Filas de hora 8:00 … 19:00 (bloques hasta 20:00) */
export const HORAS_AGENDA = Array.from({ length: 12 }, (_, i) => 8 + i);
