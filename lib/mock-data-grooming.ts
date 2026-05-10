/**
 * Demo Patitas Felices — Grooming & Spa Canino
 */
import {
  addDays,
  formatISODate,
  horaAMinutos,
  HORAS_AGENDA,
  labelSemana,
  parseISODate,
  startOfWeekMonday,
} from '@/lib/mock-data-spa';

export { addDays, formatISODate, horaAMinutos, HORAS_AGENDA, labelSemana, parseISODate, startOfWeekMonday };

export const BRAND_GROOMING = {
  nombre: 'Patitas Felices — Grooming & Spa Canino',
  corto: 'Patitas Felices',
} as const;

export type TamañoMascota = 'Pequeño' | 'Mediano' | 'Grande' | 'Extra Grande';
export type Comportamiento = 'Tranquilo' | 'Nervioso' | 'Agresivo' | 'Juguetón';
export type NivelDueño = 'Nuevo' | 'Regular' | 'VIP';
export type PreferenciaDueño = 'Sucursal' | 'Domicilio' | 'Ambos';
export type CategoriaServicio = 'Baño' | 'Corte' | 'Spa' | 'Tratamiento' | 'Extra';

export type PrecioPorTamaño = {
  pequeño: number;
  mediano: number;
  grande: number;
  extraGrande: number;
};

export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string;
  precioBase: PrecioPorTamaño;
  duracion: PrecioPorTamaño;
  categoria: CategoriaServicio;
  emoji: string;
  imagen: string;
  disponible: boolean;
};

export type Mascota = {
  id: string;
  nombre: string;
  raza: string;
  tamaño: TamañoMascota;
  edad: number;
  peso: number;
  dueñoId: string;
  foto: string;
  alergias: string;
  comportamiento: Comportamiento;
  ultimoGrooming: string;
  notasEspeciales: string;
};

export type Dueño = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  mascotas: string[];
  visitas: number;
  gasto_total: number;
  nivel: NivelDueño;
  preferencia: PreferenciaDueño;
};

export type Groomer = {
  id: string;
  nombre: string;
  foto: string;
  citas_hoy: number;
  disponibleAhora: boolean;
  turno: 'mañana' | 'tarde' | 'completo';
};

export type StatusCitaGrooming =
  | 'pendiente'
  | 'confirmada'
  | 'en_camino'
  | 'atendiendo'
  | 'completada'
  | 'cancelada';

export type CitaGrooming = {
  id: string;
  dueñoId: string;
  mascotaId: string;
  servicioId: string;
  groomerId: string;
  fecha: string;
  hora: string;
  duracion: number;
  precio: number;
  modalidad: 'sucursal' | 'domicilio';
  status: StatusCitaGrooming;
  direccion?: string;
  notas: string;
};

export type KanbanDomicilioStatus = 'confirmado' | 'en_camino' | 'atendiendo' | 'completado';

export type OrdenDomicilio = {
  id: string;
  mascotaId: string;
  dueñoId: string;
  direccion: string;
  groomerId: string;
  eta: string;
  status: KanbanDomicilioStatus;
};

const P = (a: number, b: number, c: number, d: number): PrecioPorTamaño => ({
  pequeño: a,
  mediano: b,
  grande: c,
  extraGrande: d,
});

const IMG_GROOM = {
  banoBasico:    'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600&q=80',
  banoSecado:    'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600&q=80',
  banoMedicado:  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80',
  corteEstandar: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80',
  corteRaza:     'https://images.unsplash.com/photo-1583511655802-41310279cc92?w=600&q=80',
  recortePuntas: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=600&q=80',
  spaCompleto:   'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80',
  hidratacion:   'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&q=80',
  desrizador:    'https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&q=80',
  antipulgas:    'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=600&q=80',
  vitamina:      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80',
  trataPiel:     'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&q=80',
  uñas:          'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&q=80',
  oidos:         'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&q=80',
  dental:        'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=600&q=80',
};

export const MOCK_SERVICIOS: Servicio[] = [
  {
    id: 'gs1',
    nombre: 'Baño básico',
    descripcion: 'Shampoo hipoalergénico y secado.',
    precioBase: P(150, 220, 290, 360),
    duracion: P(45, 55, 65, 75),
    categoria: 'Baño',
    emoji: '🛁',
    imagen: IMG_GROOM.banoBasico,
    disponible: true,
  },
  {
    id: 'gs2',
    nombre: 'Baño + secado',
    descripcion: 'Baño profundo con secado profesional.',
    precioBase: P(190, 270, 350, 430),
    duracion: P(55, 65, 75, 85),
    categoria: 'Baño',
    emoji: '💨',
    imagen: IMG_GROOM.banoSecado,
    disponible: true,
  },
  {
    id: 'gs3',
    nombre: 'Baño medicado',
    descripcion: 'Tratamiento dermatológico (sarna/hongos) supervisado.',
    precioBase: P(280, 360, 440, 520),
    duracion: P(60, 70, 80, 90),
    categoria: 'Baño',
    emoji: '🧴',
    imagen: IMG_GROOM.banoMedicado,
    disponible: true,
  },
  {
    id: 'gs4',
    nombre: 'Corte estándar',
    descripcion: 'Tijera y máquina según raza.',
    precioBase: P(200, 290, 380, 470),
    duracion: P(50, 60, 70, 80),
    categoria: 'Corte',
    emoji: '✂️',
    imagen: IMG_GROOM.corteEstandar,
    disponible: true,
  },
  {
    id: 'gs5',
    nombre: 'Corte de raza',
    descripcion: 'Perfil estándar de raza con acabado show.',
    precioBase: P(320, 420, 520, 620),
    duracion: P(70, 85, 95, 110),
    categoria: 'Corte',
    emoji: '🐩',
    imagen: IMG_GROOM.corteRaza,
    disponible: true,
  },
  {
    id: 'gs6',
    nombre: 'Recorte de puntas',
    descripcion: 'Mantenimiento ligero sin cambio de estilo.',
    precioBase: P(160, 220, 280, 340),
    duracion: P(35, 40, 45, 50),
    categoria: 'Corte',
    emoji: '✨',
    imagen: IMG_GROOM.recortePuntas,
    disponible: true,
  },
  {
    id: 'gs7',
    nombre: 'Spa completo',
    descripcion: 'Baño + corte + masaje + aromaterapia.',
    precioBase: P(420, 540, 660, 780),
    duracion: P(90, 105, 120, 135),
    categoria: 'Spa',
    emoji: '🌿',
    imagen: IMG_GROOM.spaCompleto,
    disponible: true,
  },
  {
    id: 'gs8',
    nombre: 'Hidratación de pelo',
    descripcion: 'Mascarilla keratina y cepillado.',
    precioBase: P(240, 320, 400, 480),
    duracion: P(50, 60, 70, 80),
    categoria: 'Spa',
    emoji: '💧',
    imagen: IMG_GROOM.hidratacion,
    disponible: true,
  },
  {
    id: 'gs9',
    nombre: 'Desrizador',
    descripcion: 'Desenredo profundo y spray acondicionador.',
    precioBase: P(260, 350, 440, 530),
    duracion: P(55, 65, 75, 85),
    categoria: 'Spa',
    emoji: '🪮',
    imagen: IMG_GROOM.desrizador,
    disponible: true,
  },
  {
    id: 'gs10',
    nombre: 'Antipulgas',
    descripcion: 'Tratamiento pipeta + baño complementario.',
    precioBase: P(220, 300, 380, 460),
    duracion: P(45, 55, 65, 75),
    categoria: 'Tratamiento',
    emoji: '🐜',
    imagen: IMG_GROOM.antipulgas,
    disponible: true,
  },
  {
    id: 'gs11',
    nombre: 'Vitamina pelo opaco',
    descripcion: 'Ampolla revitalizante y secado.',
    precioBase: P(200, 280, 360, 440),
    duracion: P(40, 50, 60, 70),
    categoria: 'Tratamiento',
    emoji: '💊',
    imagen: IMG_GROOM.vitamina,
    disponible: true,
  },
  {
    id: 'gs12',
    nombre: 'Tratamiento de piel',
    descripcion: 'Enjuague calmante y control de irritación.',
    precioBase: P(250, 330, 410, 490),
    duracion: P(50, 60, 70, 80),
    categoria: 'Tratamiento',
    emoji: '🩹',
    imagen: IMG_GROOM.trataPiel,
    disponible: true,
  },
  {
    id: 'gs13',
    nombre: 'Corte de uñas',
    descripcion: 'Lima y protección de almohadillas.',
    precioBase: P(80, 100, 120, 140),
    duracion: P(15, 18, 20, 22),
    categoria: 'Extra',
    emoji: '🔸',
    imagen: IMG_GROOM.uñas,
    disponible: true,
  },
  {
    id: 'gs14',
    nombre: 'Limpieza de oídos',
    descripcion: 'Solución suave y revisión otológica.',
    precioBase: P(90, 110, 130, 150),
    duracion: P(15, 18, 20, 22),
    categoria: 'Extra',
    emoji: '👂',
    imagen: IMG_GROOM.oidos,
    disponible: true,
  },
  {
    id: 'gs15',
    nombre: 'Cepillado dental',
    descripcion: 'Gel enzimático y masaje gingival.',
    precioBase: P(100, 120, 140, 160),
    duracion: P(18, 20, 22, 25),
    categoria: 'Extra',
    emoji: '🦷',
    imagen: IMG_GROOM.dental,
    disponible: true,
  },
];

export const MOCK_GROOMERS: Groomer[] = [
  { id: 'gr1', nombre: 'Valeria Soto',  foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', citas_hoy: 5, disponibleAhora: true,  turno: 'completo' },
  { id: 'gr2', nombre: 'Luis Camarena', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', citas_hoy: 4, disponibleAhora: true,  turno: 'completo' },
  { id: 'gr3', nombre: 'Daniela Neri',  foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', citas_hoy: 3, disponibleAhora: false, turno: 'mañana'   },
];

export const COSTO_DOMICILIO_EXTRA: PrecioPorTamaño = {
  pequeño: 80,
  mediano: 100,
  grande: 150,
  extraGrande: 170,
};

export function tamañoKey(t: TamañoMascota): keyof PrecioPorTamaño {
  const m: Record<TamañoMascota, keyof PrecioPorTamaño> = {
    Pequeño: 'pequeño',
    Mediano: 'mediano',
    Grande: 'grande',
    'Extra Grande': 'extraGrande',
  };
  return m[t];
}

export function precioServicioBase(s: Servicio, tam: TamañoMascota): number {
  const k = tamañoKey(tam);
  return s.precioBase[k];
}

export function duracionServicio(s: Servicio, tam: TamañoMascota): number {
  const k = tamañoKey(tam);
  return s.duracion[k];
}

export function extraDomicilio(tam: TamañoMascota): number {
  return COSTO_DOMICILIO_EXTRA[tamañoKey(tam)];
}

export function precioTotalCita(s: Servicio, tam: TamañoMascota, modalidad: 'sucursal' | 'domicilio'): number {
  let p = precioServicioBase(s, tam);
  if (modalidad === 'domicilio') p += extraDomicilio(tam);
  return p;
}

export function groomerPuedeEnHorario(g: Groomer, startMin: number, durMin: number): boolean {
  const end = startMin + durMin;
  if (startMin < 8 * 60 || end > 20 * 60) return false;
  if (g.turno === 'completo') return true;
  if (g.turno === 'mañana') return startMin < 14 * 60 && end <= 15 * 60;
  if (g.turno === 'tarde') return startMin >= 14 * 60 && end <= 20 * 60;
  return false;
}

export function hayTraslapeGroomer(
  citas: CitaGrooming[],
  groomerId: string,
  fecha: string,
  startMin: number,
  durMin: number,
  excludeId?: string
): boolean {
  const endMin = startMin + durMin;
  for (const c of citas) {
    if (c.id === excludeId) continue;
    if (c.groomerId !== groomerId || c.fecha !== fecha) continue;
    if (c.status === 'cancelada') continue;
    const s = horaAMinutos(c.hora);
    const e = s + c.duracion;
    if (startMin < e && s < endMin) return true;
  }
  return false;
}

/** Razas → tamaño sugerido (calculadora) */
export const RAZA_TAMAÑO_SUGERIDO: Record<string, TamañoMascota> = {
  Chihuahua: 'Pequeño',
  'Yorkshire Terrier': 'Pequeño',
  Pomerania: 'Pequeño',
  Maltés: 'Pequeño',
  Frenchie: 'Mediano',
  Beagle: 'Mediano',
  Cocker: 'Mediano',
  'Border Collie': 'Mediano',
  'Golden Retriever': 'Grande',
  Labrador: 'Grande',
  Husky: 'Grande',
  'Pastor Alemán': 'Grande',
  'San Bernardo': 'Extra Grande',
  Mastín: 'Extra Grande',
  'Terranova': 'Extra Grande',
};

const HOY = '2026-03-20';

const nombresDueños = [
  'Laura Martínez',
  'Carlos Vega',
  'Ana Torres',
  'Roberto Díaz',
  'María Herrera',
  'Fernando Ruiz',
  'Patricia López',
  'Jorge Sánchez',
  'Lucía Mendoza',
  'Diego Castillo',
  'Gabriela Ríos',
  'Héctor Núñez',
  'Sofía Paredes',
  'Miguel Ángel Flores',
  'Valentina Cruz',
];

const niveles: NivelDueño[] = [
  ...Array(5).fill('Nuevo' as NivelDueño),
  ...Array(7).fill('Regular' as NivelDueño),
  ...Array(3).fill('VIP' as NivelDueño),
];

const prefs: PreferenciaDueño[] = ['Sucursal', 'Domicilio', 'Ambos', 'Sucursal', 'Domicilio', 'Ambos', 'Sucursal', 'Domicilio', 'Ambos', 'Sucursal', 'Domicilio', 'Ambos', 'Sucursal', 'Domicilio', 'Ambos'];

export const MOCK_DUEÑOS: Dueño[] = nombresDueños.map((nombre, i) => ({
  id: `d${i + 1}`,
  nombre,
  telefono: `555-${String(1000 + i)}-${String(2000 + i)}`,
  email: `dueño${i + 1}@email.com`,
  mascotas: [],
  visitas: 2 + (i % 8),
  gasto_total: 800 + i * 350,
  nivel: niveles[i]!,
  preferencia: prefs[i % prefs.length]!,
}));

const razas = [
  'Chihuahua',
  'Frenchie',
  'Golden Retriever',
  'Maltés',
  'Beagle',
  'Labrador',
  'Yorkshire Terrier',
  'Cocker',
  'Husky',
  'Pomerania',
  'Border Collie',
  'Pastor Alemán',
  'San Bernardo',
  'Mastín',
  'Terranova',
  'Frenchie',
  'Chihuahua',
  'Golden Retriever',
  'Beagle',
  'Labrador',
];

const tams: TamañoMascota[] = [
  'Pequeño',
  'Mediano',
  'Grande',
  'Pequeño',
  'Mediano',
  'Grande',
  'Pequeño',
  'Mediano',
  'Grande',
  'Pequeño',
  'Mediano',
  'Grande',
  'Extra Grande',
  'Extra Grande',
  'Mediano',
  'Mediano',
  'Pequeño',
  'Grande',
  'Mediano',
  'Grande',
];

const dueñoPorMascota = [
  'd1',
  'd1',
  'd2',
  'd2',
  'd3',
  'd3',
  'd4',
  'd4',
  'd5',
  'd5',
  'd6',
  'd7',
  'd8',
  'd9',
  'd10',
  'd11',
  'd12',
  'd13',
  'd14',
  'd15',
];

const ultimosGrooming = [
  '2026-03-15',
  '2026-02-10',
  '2026-01-20',
  '2026-03-18',
  '2026-02-05',
  '2026-03-01',
  '2026-02-28',
  '2026-01-15',
  '2026-03-10',
  '2026-02-12',
  '2026-03-19',
  '2026-02-25',
  '2026-01-08',
  '2026-02-18',
  '2026-03-12',
  '2026-02-01',
  '2026-01-25',
  '2026-03-08',
  '2026-02-22',
  '2026-03-17',
];

export const MOCK_MASCOTAS: Mascota[] = Array.from({ length: 20 }, (_, i) => {
  const comp: Comportamiento[] = ['Tranquilo', 'Nervioso', 'Agresivo', 'Juguetón'];
  const fotos = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🐾', '🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🐕', '🐶', '🦮', '🐕‍🦺', '🐩', '🐕', '🐶', '🦮', '🐩'];
  return {
    id: `m${i + 1}`,
    nombre: ['Rocky', 'Luna', 'Max', 'Coco', 'Toby', 'Nala', 'Simba', 'Kira', 'Thor', 'Maya', 'Bruno', 'Lola', 'Zeus', 'Mila', 'Copito', 'Bolt', 'Duke', 'Chispa', 'Rex', 'Bella'][i]!,
    raza: razas[i]!,
    tamaño: tams[i]!,
    edad: 1 + (i % 10),
    peso: 4 + i * 2.5,
    dueñoId: dueñoPorMascota[i]!,
    foto: fotos[i]!,
    alergias: i % 5 === 0 ? 'Shampoo con fragancia fuerte' : 'Ninguna conocida',
    comportamiento: comp[i % 4]!,
    ultimoGrooming: ultimosGrooming[i]!,
    notasEspeciales: i % 3 === 0 ? 'No usar secadora alta' : 'OK con secado',
  };
});

for (const d of MOCK_DUEÑOS) {
  d.mascotas = MOCK_MASCOTAS.filter((m) => m.dueñoId === d.id).map((m) => m.id);
}

function cita(
  id: string,
  midx: number,
  sidx: number,
  gridx: number,
  fecha: string,
  hora: string,
  modalidad: 'sucursal' | 'domicilio',
  status: StatusCitaGrooming
): CitaGrooming {
  const m = MOCK_MASCOTAS[midx]!;
  const s = MOCK_SERVICIOS[sidx]!;
  const d = duracionServicio(s, m.tamaño);
  const p = precioTotalCita(s, m.tamaño, modalidad);
  return {
    id,
    dueñoId: m.dueñoId,
    mascotaId: m.id,
    servicioId: s.id,
    groomerId: MOCK_GROOMERS[gridx]!.id,
    fecha,
    hora,
    duracion: d,
    precio: p,
    modalidad,
    status,
    direccion:
      modalidad === 'domicilio'
        ? `Calle ${midx + 1} #${100 + midx}, Col. Patitas, CDMX`
        : undefined,
    notas: '',
  };
}

/** 30 citas: mix sucursal / domicilio */
export const MOCK_CITAS_GROOMING: CitaGrooming[] = [
  cita('cg1', 0, 6, 0, HOY, '09:00', 'sucursal', 'confirmada'),
  cita('cg2', 1, 0, 1, HOY, '09:30', 'domicilio', 'en_camino'),
  cita('cg3', 2, 4, 2, HOY, '10:00', 'sucursal', 'atendiendo'),
  cita('cg4', 3, 1, 0, HOY, '11:00', 'sucursal', 'confirmada'),
  cita('cg5', 4, 7, 1, HOY, '12:00', 'domicilio', 'confirmada'),
  cita('cg6', 5, 2, 2, HOY, '13:30', 'sucursal', 'completada'),
  cita('cg7', 6, 3, 0, HOY, '14:00', 'sucursal', 'confirmada'),
  cita('cg8', 7, 8, 1, HOY, '15:00', 'domicilio', 'pendiente'),
  cita('cg9', 8, 0, 2, HOY, '16:00', 'sucursal', 'pendiente'),
  cita('cg10', 9, 6, 0, HOY, '17:30', 'sucursal', 'confirmada'),
  cita('cg11', 10, 5, 1, '2026-03-17', '10:00', 'sucursal', 'completada'),
  cita('cg12', 11, 9, 2, '2026-03-18', '11:00', 'domicilio', 'completada'),
  cita('cg13', 12, 10, 0, '2026-03-19', '09:30', 'sucursal', 'completada'),
  cita('cg14', 13, 11, 1, '2026-03-21', '10:00', 'domicilio', 'confirmada'),
  cita('cg15', 14, 12, 2, '2026-03-22', '12:00', 'sucursal', 'confirmada'),
  cita('cg16', 15, 13, 0, '2026-03-23', '13:00', 'sucursal', 'pendiente'),
  cita('cg17', 16, 14, 1, '2026-03-23', '15:00', 'domicilio', 'confirmada'),
  cita('cg18', 17, 4, 2, '2026-03-24', '10:00', 'sucursal', 'confirmada'),
  cita('cg19', 18, 7, 0, '2026-03-24', '11:30', 'sucursal', 'pendiente'),
  cita('cg20', 19, 0, 1, '2026-03-25', '09:00', 'domicilio', 'confirmada'),
  cita('cg21', 0, 1, 2, '2026-02-10', '10:00', 'sucursal', 'completada'),
  cita('cg22', 2, 6, 0, '2026-02-15', '11:00', 'domicilio', 'completada'),
  cita('cg23', 4, 3, 1, '2026-02-20', '12:00', 'sucursal', 'completada'),
  cita('cg24', 6, 8, 2, '2026-02-22', '09:30', 'sucursal', 'completada'),
  cita('cg25', 8, 4, 0, '2026-02-28', '14:00', 'domicilio', 'completada'),
  cita('cg26', 10, 5, 1, '2026-03-01', '10:00', 'sucursal', 'completada'),
  cita('cg27', 12, 7, 2, '2026-03-05', '11:00', 'sucursal', 'completada'),
  cita('cg28', 14, 2, 0, '2026-03-08', '13:00', 'domicilio', 'completada'),
  cita('cg29', 16, 9, 1, '2026-03-10', '10:30', 'sucursal', 'completada'),
  cita('cg30', 18, 11, 2, '2026-03-12', '16:00', 'sucursal', 'completada'),
];

export const MOCK_ORDENES_DOMICILIO: OrdenDomicilio[] = [
  {
    id: 'od1',
    mascotaId: 'm2',
    dueñoId: 'd1',
    direccion: 'Av. Insurgentes 450, Roma Norte',
    groomerId: 'gr1',
    eta: '10:45',
    status: 'confirmado',
  },
  {
    id: 'od2',
    mascotaId: 'm5',
    dueñoId: 'd3',
    direccion: 'Calle Durango 88, Condesa',
    groomerId: 'gr2',
    eta: '11:20',
    status: 'en_camino',
  },
  {
    id: 'od3',
    mascotaId: 'm8',
    dueñoId: 'd4',
    direccion: 'Monte Everest 120, Lomas',
    groomerId: 'gr1',
    eta: '12:10',
    status: 'atendiendo',
  },
  {
    id: 'od4',
    mascotaId: 'm12',
    dueñoId: 'd7',
    direccion: 'Parque México s/n, Condesa',
    groomerId: 'gr2',
    eta: '09:50',
    status: 'completado',
  },
  {
    id: 'od5',
    mascotaId: 'm15',
    dueñoId: 'd10',
    direccion: 'Ejército Nacional 223, Polanco',
    groomerId: 'gr3',
    eta: '14:30',
    status: 'confirmado',
  },
];

export const FECHA_REF_GROOMING = HOY;

export function getDueño(id: string): Dueño | undefined {
  return MOCK_DUEÑOS.find((d) => d.id === id);
}

export function getMascota(id: string): Mascota | undefined {
  return MOCK_MASCOTAS.find((m) => m.id === id);
}

export function getServicioG(id: string): Servicio | undefined {
  return MOCK_SERVICIOS.find((s) => s.id === id);
}

export function getGroomer(id: string): Groomer | undefined {
  return MOCK_GROOMERS.find((g) => g.id === id);
}

export function citasHoyG(citas: CitaGrooming[], fecha = FECHA_REF_GROOMING): CitaGrooming[] {
  return citas.filter((c) => c.fecha === fecha);
}

export function ingresosCompletadosHoyG(citas: CitaGrooming[], fecha = FECHA_REF_GROOMING): number {
  return citas
    .filter((c) => c.fecha === fecha && c.status === 'completada')
    .reduce((s, c) => s + c.precio, 0);
}

export function mascotasAtendidasHoy(citas: CitaGrooming[], fecha = FECHA_REF_GROOMING): number {
  const set = new Set<string>();
  for (const c of citas) {
    if (c.fecha === fecha && c.status === 'completada') set.add(c.mascotaId);
  }
  return set.size;
}

export function domiciliosActivosHoy(citas: CitaGrooming[], fecha = FECHA_REF_GROOMING): number {
  return citas.filter(
    (c) =>
      c.fecha === fecha &&
      c.modalidad === 'domicilio' &&
      c.status !== 'completada' &&
      c.status !== 'cancelada'
  ).length;
}

export function topServiciosGrooming(citas: CitaGrooming[], n = 5): { nombre: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of citas) {
    if (c.status === 'cancelada') continue;
    const s = getServicioG(c.servicioId);
    if (!s) continue;
    map.set(s.nombre, (map.get(s.nombre) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nombre, count]) => ({ nombre, count }));
}

export function ingresosPorTamaño(citas: CitaGrooming[]): { name: string; value: number; fill: string }[] {
  const map = new Map<string, number>();
  const colors: Record<string, string> = {
    Pequeño: '#fb923c',
    Mediano: '#f97316',
    Grande: '#ea580c',
    'Extra Grande': '#c2410c',
  };
  for (const c of citas) {
    if (c.status !== 'completada') continue;
    const m = getMascota(c.mascotaId);
    if (!m) continue;
    map.set(m.tamaño, (map.get(m.tamaño) ?? 0) + c.precio);
  }
  return [...map.entries()].map(([name, value]) => ({
    name,
    value,
    fill: colors[name] ?? '#f97316',
  }));
}

export function diasDesde(fechaISO: string, hoy = FECHA_REF_GROOMING): number {
  const a = parseISODate(fechaISO).getTime();
  const b = parseISODate(hoy).getTime();
  return Math.floor((b - a) / (86400 * 1000));
}

export function mascotasNecesitanBañoMensual(hoy = FECHA_REF_GROOMING): Mascota[] {
  return MOCK_MASCOTAS.filter((m) => diasDesde(m.ultimoGrooming, hoy) > 28);
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEM = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function proximoDiaDisponibleLabel(desde: Date = parseISODate(FECHA_REF_GROOMING)): string {
  const d = addDays(desde, 3);
  const ds = DIAS_SEM[d.getDay()];
  return `${ds} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function mensajeBañoMensual(m: Mascota, dueño: Dueño, hoy = FECHA_REF_GROOMING): string {
  const dia = proximoDiaDisponibleLabel(parseISODate(hoy));
  return `Hola ${dueño.nombre} 🐾 Ya pasó un mes desde el último baño de ${m.nombre}.\n¿Agendamos esta semana? Tenemos disponibilidad el ${dia}.\n${m.nombre} te lo agradecerá 🛁✨`;
}

export function historialMockParaMascota(mascotaId: string): { servicio: string; fecha: string; antes: string; después: string }[] {
  const base = [
    { servicio: 'Spa completo', fecha: '2026-02-10', antes: '🐾', después: '✨' },
    { servicio: 'Baño básico', fecha: '2026-01-05', antes: '💨', después: '🌟' },
  ];
  const idx = parseInt(mascotaId.replace('m', ''), 10) || 1;
  return base.map((x, i) => ({
    ...x,
    fecha: i === 0 ? `2026-02-${String(10 + (idx % 10)).padStart(2, '0')}` : `2026-01-${String(5 + (idx % 15)).padStart(2, '0')}`,
  }));
}
