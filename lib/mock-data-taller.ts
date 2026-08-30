/**
 * Demo Taller Mecánico AutoPro — Servicio Confiable
 */

export type Combustible = 'Gasolina' | 'Diesel' | 'Híbrido' | 'Eléctrico';

export type DanoVehiculo = {
  id: string;
  zona:
    | 'defensa_delantera'
    | 'defensa_trasera'
    | 'cofre'
    | 'cajuela'
    | 'puerta_del_izq'
    | 'puerta_del_der'
    | 'puerta_tra_izq'
    | 'puerta_tra_der'
    | 'techo'
    | 'costado_izq'
    | 'costado_der';
  tipo: 'golpe' | 'rayon' | 'abolladura' | 'quebrado';
  descripcion: string;
  nivel: 'leve' | 'moderado' | 'severo';
};

export type FotoOrden = {
  id: string;
  url: string;
  fecha: string;
  tipo: 'recepcion' | 'avance' | 'entrega';
  descripcion: string;
  tecnico: string;
  visibleCliente: boolean;
};

export type ChecklistOrden = {
  nivelGasolina: number;
  kilometraje: number;
  llavesEntregadas: boolean;
  llantaRefaccion: boolean;
  gato: boolean;
  herramientas: boolean;
  tapetes: boolean;
  radio: boolean;
  golpes: DanoVehiculo[];
  rayones: DanoVehiculo[];
  firmaCliente: boolean;
  fechaChecklist: string;
};

export type Vehiculo = {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  año: number;
  color: string;
  vin: string;
  kilometraje: number;
  combustible: Combustible;
  propietarioId: string;
  ultimoServicio: string;
  proximoServicio: string;
  proximoServicioKm: number;
  notas: string;
  emoji: string;
};

export type NivelCliente = 'Nuevo' | 'Regular' | 'VIP';

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  vehiculos: string[];
  nivel: NivelCliente;
  visitas: number;
  gasto_total: number;
};

export type TipoOrden = 'Mantenimiento' | 'Reparación' | 'Diagnóstico' | 'Hojalatería' | 'Eléctrico';

export type StatusOrden =
  | 'recibido'
  | 'diagnostico'
  | 'en_reparacion'
  | 'listo'
  | 'entregado';

export type OrdenServicio = {
  id: string;
  vehiculoId: string;
  clienteId: string;
  tecnico: string;
  tipo: TipoOrden;
  descripcionProblema: string;
  diagnostico: string;
  trabajosRealizados: Array<{ descripcion: string; tiempo: number; costo: number }>;
  refacciones: Array<{ nombre: string; cantidad: number; costoUnitario: number; total: number }>;
  subtotalManoObra: number;
  subtotalRefacciones: number;
  total: number;
  status: StatusOrden;
  fechaIngreso: string;
  fechaEstimadaEntrega: string;
  fechaEntrega?: string;
  kilometrajeEntrada: number;
  observaciones: string;
  garantia: string;
  checklist?: ChecklistOrden;
  fotosOrden: FotoOrden[];
};

export type MovimientoCaja = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  hora: string;
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
  rubro?: 'mano_obra' | 'refacciones';
};

export const BRAND_TALLER = {
  nombre: 'Taller Mecánico AutoPro — Servicio Confiable',
  corto: 'AutoPro',
  rfc: 'AUT123456XX',
  tel: '999-000-2222',
} as const;

export const TECNICOS = [
  { id: 't1', nombre: 'Miguel Ángel', especialidad: 'Motor' },
  { id: 't2', nombre: 'Roberto', especialidad: 'Eléctrico / Diagnóstico' },
  { id: 't3', nombre: 'Jesús', especialidad: 'Transmisión' },
  { id: 't4', nombre: 'Armando', especialidad: 'Hojalatería y pintura' },
] as const;

const EMOJIS = ['🚗', '🚙', '🚕', '🛻'] as const;
const MARCAS = [
  'Honda',
  'Toyota',
  'Nissan',
  'VW',
  'Chevrolet',
  'Mazda',
  'Hyundai',
  'Kia',
  'Ford',
  'Suzuki',
];
const MODELOS: Record<string, string[]> = {
  Honda: ['Civic', 'CR-V', 'City'],
  Toyota: ['Corolla', 'Hilux', 'RAV4'],
  Nissan: ['Versa', 'Sentra', 'NP300'],
  VW: ['Jetta', 'Tiguan', 'Virtus'],
  Chevrolet: ['Onix', 'Tracker', 'Aveo'],
  Mazda: ['3', 'CX-5', '2'],
  Hyundai: ['Creta', 'Accent', 'Tucson'],
  Kia: ['Rio', 'Sportage', 'Forte'],
  Ford: ['Fiesta', 'Ranger', 'EcoSport'],
  Suzuki: ['Swift', 'Vitara', 'Ertiga'],
};

const NOMBRES = [
  'Juan Pérez',
  'María González',
  'Carlos Hernández',
  'Ana Martínez',
  'Luis Ramírez',
  'Laura Sánchez',
  'Roberto López',
  'Patricia Ruiz',
  'Fernando Castro',
  'Gabriela Morales',
  'Diego Vargas',
  'Alejandra Jiménez',
  'Miguel Torres',
  'Sofía Mendoza',
  'Ricardo Díaz',
  'Daniela Flores',
  'Jorge Reyes',
  'Monica Ortega',
  'Andrés Navarro',
  'Claudia Ramos',
];

function placa(i: number): string {
  const a = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const n = String(100 + i).slice(-3);
  return `${a[i % 24]}${a[(i * 3) % 24]}${a[(i * 7) % 24]}-${n}-D`;
}

function isoDaysAgo(d: number): string {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().slice(0, 10);
}

function isoDaysFromNow(d: number): string {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export const MOCK_CLIENTES: Cliente[] = NOMBRES.map((nombre, i) => {
  const nivel: NivelCliente = i < 3 ? 'VIP' : i < 12 ? 'Regular' : 'Nuevo';
  return {
    id: `c${i + 1}`,
    nombre,
    telefono: `+52 999 ${100 + i} ${1000 + i}`,
    email: `cliente${i + 1}@email.com`,
    vehiculos: [],
    nivel,
    visitas: 2 + (i % 15),
    gasto_total: 5000 + i * 1200,
  };
});

const vehiculoIds: string[] = [];
for (let i = 0; i < 25; i++) {
  const marca = MARCAS[i % MARCAS.length];
  const mods = MODELOS[marca] ?? ['Sedán'];
  const modelo = mods[i % mods.length];
  const propIdx = i < 20 ? i : i % 20;
  const cid = `c${propIdx + 1}`;
  const vid = `v${i + 1}`;
  vehiculoIds.push(vid);
  MOCK_CLIENTES[propIdx].vehiculos.push(vid);
  if (i >= 20) {
    const sec = (i % 5) + 15;
    MOCK_CLIENTES[sec].vehiculos.push(vid);
  }
}

export const MOCK_VEHICULOS: Vehiculo[] = Array.from({ length: 25 }, (_, i) => {
  const marca = MARCAS[i % MARCAS.length];
  const mods = MODELOS[marca] ?? ['Sedán'];
  const modelo = mods[i % mods.length];
  const propIdx = i < 20 ? i : i % 20;
  const cid = `c${propIdx + 1}`;
  const km = 45000 + i * 1800;
  return {
    id: `v${i + 1}`,
    placa: placa(i),
    marca,
    modelo,
    año: 2016 + (i % 8),
    color: ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul'][i % 5],
    vin: `1HGBH41JXMN${String(100000 + i).slice(-6)}`,
    kilometraje: km,
    combustible: (['Gasolina', 'Diesel', 'Híbrido', 'Eléctrico'] as Combustible[])[i % 4],
    propietarioId: cid,
    ultimoServicio: isoDaysAgo(30 + (i % 60)),
    proximoServicio: isoDaysFromNow(5 + (i % 20)),
    proximoServicioKm: km + (i % 2 === 0 ? 800 : 5000),
    notas: i % 4 === 0 ? 'Cliente prefiere aceite sintético' : '',
    emoji: EMOJIS[i % 4],
  };
});

const TECN_NOMBRES = ['Miguel Ángel', 'Roberto', 'Jesús', 'Armando'] as const;
const TIPOS: TipoOrden[] = [
  'Mantenimiento',
  'Reparación',
  'Diagnóstico',
  'Hojalatería',
  'Eléctrico',
];
const STATUS_ROT: StatusOrden[] = [
  'recibido',
  'diagnostico',
  'en_reparacion',
  'listo',
  'entregado',
];

// ── Mock checklists para las primeras 8 órdenes ──────────────────────────────
const NIVELES_GAS = [2, 4, 6, 7, 2, 6, 4, 7] as const;

const CHECKLISTS_MOCK: ChecklistOrden[] = [
  {
    nivelGasolina: 2, kilometraje: 47800, llavesEntregadas: true, llantaRefaccion: false,
    gato: false, herramientas: true, tapetes: true, radio: true, firmaCliente: true,
    fechaChecklist: isoDaysAgo(1),
    golpes: [{ id: 'd1', zona: 'defensa_delantera', tipo: 'golpe', descripcion: 'Abolladuras considerables lado derecho', nivel: 'severo' }],
    rayones: [{ id: 'd2', zona: 'puerta_del_izq', tipo: 'rayon', descripcion: 'Rayón superficial ~15cm aprox', nivel: 'leve' }],
  },
  {
    nivelGasolina: 4, kilometraje: 62300, llavesEntregadas: true, llantaRefaccion: true,
    gato: true, herramientas: false, tapetes: false, radio: true, firmaCliente: true,
    fechaChecklist: isoDaysAgo(2),
    golpes: [{ id: 'd3', zona: 'costado_der', tipo: 'abolladura', descripcion: 'Abolladura en costado derecho trasero', nivel: 'moderado' }],
    rayones: [],
  },
  {
    nivelGasolina: 6, kilometraje: 53100, llavesEntregadas: true, llantaRefaccion: false,
    gato: false, herramientas: false, tapetes: true, radio: false, firmaCliente: true,
    fechaChecklist: isoDaysAgo(3),
    golpes: [],
    rayones: [
      { id: 'd4', zona: 'cofre', tipo: 'rayon', descripcion: 'Rayones finos por ramas en cofre', nivel: 'leve' },
      { id: 'd5', zona: 'cajuela', tipo: 'rayon', descripcion: 'Rayón diagonal en cajuela', nivel: 'moderado' },
    ],
  },
  {
    nivelGasolina: 7, kilometraje: 78400, llavesEntregadas: true, llantaRefaccion: true,
    gato: true, herramientas: true, tapetes: true, radio: true, firmaCliente: true,
    fechaChecklist: isoDaysAgo(1),
    golpes: [
      { id: 'd6', zona: 'defensa_trasera', tipo: 'golpe', descripcion: 'Impacto leve en estacionamiento', nivel: 'leve' },
    ],
    rayones: [],
  },
  {
    nivelGasolina: 2, kilometraje: 91200, llavesEntregadas: true, llantaRefaccion: false,
    gato: false, herramientas: false, tapetes: false, radio: true, firmaCliente: true,
    fechaChecklist: isoDaysAgo(4),
    golpes: [
      { id: 'd7', zona: 'puerta_del_der', tipo: 'golpe', descripcion: 'Golpe de puerta en puerta delantera derecha', nivel: 'moderado' },
      { id: 'd8', zona: 'puerta_tra_der', tipo: 'abolladura', descripcion: 'Abolladura menor puerta trasera der.', nivel: 'leve' },
    ],
    rayones: [{ id: 'd9', zona: 'costado_izq', tipo: 'rayon', descripcion: 'Rayaduras largas costado izquierdo', nivel: 'severo' }],
  },
  {
    nivelGasolina: 6, kilometraje: 44700, llavesEntregadas: true, llantaRefaccion: true,
    gato: false, herramientas: true, tapetes: true, radio: true, firmaCliente: true,
    fechaChecklist: isoDaysAgo(1),
    golpes: [],
    rayones: [{ id: 'd10', zona: 'techo', tipo: 'rayon', descripcion: 'Rayones finos en techo (granizo)', nivel: 'leve' }],
  },
  {
    nivelGasolina: 4, kilometraje: 67900, llavesEntregadas: true, llantaRefaccion: false,
    gato: false, herramientas: false, tapetes: true, radio: false, firmaCliente: true,
    fechaChecklist: isoDaysAgo(2),
    golpes: [{ id: 'd11', zona: 'cofre', tipo: 'abolladura', descripcion: 'Abolladura central en cofre por impacto', nivel: 'moderado' }],
    rayones: [],
  },
  {
    nivelGasolina: 7, kilometraje: 55500, llavesEntregadas: true, llantaRefaccion: true,
    gato: true, herramientas: true, tapetes: false, radio: true, firmaCliente: true,
    fechaChecklist: isoDaysAgo(1),
    golpes: [],
    rayones: [
      { id: 'd12', zona: 'puerta_tra_izq', tipo: 'rayon', descripcion: 'Rayón puerta trasera izquierda ~20cm', nivel: 'leve' },
    ],
  },
];

const FOTOS_MOCK: FotoOrden[][] = [
  [
    { id: 'f1', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(1), tipo: 'recepcion', descripcion: 'Vehículo al ingreso — frente', tecnico: 'Miguel Ángel', visibleCliente: true },
    { id: 'f2', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(1), tipo: 'avance', descripcion: 'Motor abierto — filtro por cambiar', tecnico: 'Miguel Ángel', visibleCliente: false },
  ],
  [
    { id: 'f3', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(2), tipo: 'recepcion', descripcion: 'Estado frenos al ingreso', tecnico: 'Roberto', visibleCliente: true },
    { id: 'f4', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(2), tipo: 'avance', descripcion: 'Pastillas desgastadas al 20%', tecnico: 'Roberto', visibleCliente: true },
    { id: 'f5', url: 'https://placehold.co/400x300/1a1a2a/ffffff?text=%E2%9C%85+Entrega', fecha: isoDaysAgo(1), tipo: 'entrega', descripcion: 'Frenos nuevos instalados', tecnico: 'Roberto', visibleCliente: true },
  ],
  [
    { id: 'f6', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(3), tipo: 'recepcion', descripcion: 'Diagnóstico escáner OBD2', tecnico: 'Roberto', visibleCliente: false },
    { id: 'f7', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(2), tipo: 'avance', descripcion: 'Códigos activos P0300 detectados', tecnico: 'Roberto', visibleCliente: true },
  ],
  [
    { id: 'f8', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(1), tipo: 'recepcion', descripcion: 'Suspensión delantera vista inferior', tecnico: 'Jesús', visibleCliente: true },
    { id: 'f9', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(1), tipo: 'avance', descripcion: 'Rotula delantera desgastada', tecnico: 'Jesús', visibleCliente: false },
  ],
  [
    { id: 'f10', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(4), tipo: 'recepcion', descripcion: 'Daños de hojalatería laterales', tecnico: 'Armando', visibleCliente: true },
    { id: 'f11', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(3), tipo: 'avance', descripcion: 'Masilla y preparación de superficie', tecnico: 'Armando', visibleCliente: false },
    { id: 'f12', url: 'https://placehold.co/400x300/1a1a2a/ffffff?text=%E2%9C%85+Entrega', fecha: isoDaysAgo(1), tipo: 'entrega', descripcion: 'Terminado pintura — lacado final', tecnico: 'Armando', visibleCliente: true },
  ],
  [
    { id: 'f13', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(1), tipo: 'recepcion', descripcion: 'Sistema eléctrico al ingreso', tecnico: 'Roberto', visibleCliente: false },
    { id: 'f14', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(1), tipo: 'avance', descripcion: 'Alternador revisado — OK', tecnico: 'Roberto', visibleCliente: true },
  ],
  [
    { id: 'f15', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(2), tipo: 'recepcion', descripcion: 'Afinación general — estado inicial', tecnico: 'Miguel Ángel', visibleCliente: true },
    { id: 'f16', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(2), tipo: 'avance', descripcion: 'Bujías y filtros cambiados', tecnico: 'Miguel Ángel', visibleCliente: true },
    { id: 'f17', url: 'https://placehold.co/400x300/1a1a2a/ffffff?text=%E2%9C%85+Entrega', fecha: isoDaysAgo(1), tipo: 'entrega', descripcion: 'Prueba de ruta completada OK', tecnico: 'Miguel Ángel', visibleCliente: true },
  ],
  [
    { id: 'f18', url: 'https://placehold.co/400x300/1a1a1a/ffffff?text=%F0%9F%93%B8+Recepcion', fecha: isoDaysAgo(1), tipo: 'recepcion', descripcion: 'Vista general vehículo al ingreso', tecnico: 'Jesús', visibleCliente: true },
    { id: 'f19', url: 'https://placehold.co/400x300/1a2a1a/ffffff?text=%F0%9F%94%A7+Avance', fecha: isoDaysAgo(1), tipo: 'avance', descripcion: 'Transmisión abierta revisada', tecnico: 'Jesús', visibleCliente: false },
  ],
];

// ── Datos de trabajo variados por tipo ────────────────────────────────────────
type TrabajoDef = { descripcion: string; tiempo: number; costo: number };
type RefDef = { nombre: string; cantidad: number; costoUnitario: number; total: number };

const TRABAJOS_POR_TIPO: Record<TipoOrden, TrabajoDef[][]> = {
  Mantenimiento: [
    [
      { descripcion: 'Cambio de aceite y filtro', tiempo: 0.5, costo: 150 },
      { descripcion: 'Revisión general 27 puntos', tiempo: 0.5, costo: 200 },
    ],
    [
      { descripcion: 'Cambio de aceite sintético', tiempo: 0.5, costo: 220 },
      { descripcion: 'Cambio de filtro de aire', tiempo: 0.3, costo: 120 },
      { descripcion: 'Limpieza de inyectores', tiempo: 1, costo: 350 },
    ],
  ],
  Reparación: [
    [
      { descripcion: 'Cambio pastillas frenos delanteros', tiempo: 1.5, costo: 450 },
      { descripcion: 'Rectificación discos', tiempo: 1, costo: 600 },
    ],
    [
      { descripcion: 'Cambio de banda de distribución', tiempo: 3, costo: 900 },
      { descripcion: 'Cambio de tensor y polea', tiempo: 1, costo: 350 },
    ],
  ],
  Diagnóstico: [
    [
      { descripcion: 'Diagnóstico electrónico escáner', tiempo: 1, costo: 350 },
      { descripcion: 'Inspección visual motor', tiempo: 0.5, costo: 150 },
    ],
    [
      { descripcion: 'Diagnóstico sistema ABS/ESP', tiempo: 1.5, costo: 500 },
      { descripcion: 'Revisión sensores O2', tiempo: 0.5, costo: 200 },
    ],
  ],
  Hojalatería: [
    [
      { descripcion: 'Reparación puerta lateral', tiempo: 4, costo: 1200 },
      { descripcion: 'Pintura y lacado zona reparada', tiempo: 3, costo: 900 },
    ],
    [
      { descripcion: 'Reparación defensa delantera', tiempo: 5, costo: 1500 },
      { descripcion: 'Pintura completa defensa', tiempo: 3, costo: 1200 },
      { descripcion: 'Instalación emblemas', tiempo: 0.5, costo: 200 },
    ],
  ],
  Eléctrico: [
    [
      { descripcion: 'Revisión sistema de carga', tiempo: 1, costo: 300 },
      { descripcion: 'Cambio de alternador', tiempo: 2, costo: 600 },
    ],
    [
      { descripcion: 'Diagnóstico sistema de arranque', tiempo: 1, costo: 350 },
      { descripcion: 'Cambio de batería', tiempo: 0.5, costo: 200 },
    ],
  ],
};

const REFS_POR_TIPO: Record<TipoOrden, RefDef[][]> = {
  Mantenimiento: [
    [
      { nombre: 'Aceite 5W30 4L', cantidad: 1, costoUnitario: 320, total: 320 },
      { nombre: 'Filtro de aceite', cantidad: 1, costoUnitario: 95, total: 95 },
    ],
    [
      { nombre: 'Aceite sintético 5W40 4L', cantidad: 1, costoUnitario: 480, total: 480 },
      { nombre: 'Filtro de aceite', cantidad: 1, costoUnitario: 95, total: 95 },
      { nombre: 'Filtro de aire', cantidad: 1, costoUnitario: 180, total: 180 },
    ],
  ],
  Reparación: [
    [
      { nombre: 'Pastillas freno delanteras', cantidad: 1, costoUnitario: 450, total: 450 },
      { nombre: 'Líquido de frenos DOT4', cantidad: 1, costoUnitario: 62, total: 62 },
    ],
    [
      { nombre: 'Kit banda distribución', cantidad: 1, costoUnitario: 850, total: 850 },
      { nombre: 'Tensor distribución', cantidad: 1, costoUnitario: 320, total: 320 },
    ],
  ],
  Diagnóstico: [
    [
      { nombre: 'Bujías NGK (4 pzas)', cantidad: 4, costoUnitario: 55, total: 220 },
    ],
    [
      { nombre: 'Sensor O2 universal', cantidad: 1, costoUnitario: 380, total: 380 },
    ],
  ],
  Hojalatería: [
    [
      { nombre: 'Masilla automotriz 1kg', cantidad: 2, costoUnitario: 180, total: 360 },
      { nombre: 'Pintura base poliuretano', cantidad: 1, costoUnitario: 420, total: 420 },
      { nombre: 'Barniz acabado', cantidad: 1, costoUnitario: 380, total: 380 },
    ],
    [
      { nombre: 'Masilla automotriz 1kg', cantidad: 3, costoUnitario: 180, total: 540 },
      { nombre: 'Pintura base poliuretano', cantidad: 2, costoUnitario: 420, total: 840 },
      { nombre: 'Barniz acabado', cantidad: 2, costoUnitario: 380, total: 760 },
    ],
  ],
  Eléctrico: [
    [
      { nombre: 'Alternador remanufacturado', cantidad: 1, costoUnitario: 1800, total: 1800 },
    ],
    [
      { nombre: 'Batería 12V 70Ah', cantidad: 1, costoUnitario: 1200, total: 1200 },
      { nombre: 'Cable terminal batería', cantidad: 1, costoUnitario: 85, total: 85 },
    ],
  ],
};

const PROBLEMAS_POR_TIPO: Record<TipoOrden, string[]> = {
  Mantenimiento: ['Servicio de mantenimiento preventivo', 'Cambio de aceite y revisión general', 'Afinación completa solicitada por cliente'],
  Reparación: ['Ruido en frenos al frenar', 'Vibración en dirección al acelerar', 'Testigo de motor encendido — revisión solicitada'],
  Diagnóstico: ['Testigo "Check Engine" encendido', 'Pérdida de potencia sin causa aparente', 'Luz ABS activa — diagnóstico solicitado'],
  Hojalatería: ['Golpe lateral derecho en estacionamiento', 'Daño en defensa por choque menor', 'Rayones profundos en costado — requiere pintura'],
  Eléctrico: ['No enciende fácilmente por las mañanas', 'Testigo de batería encendido', 'Fallas intermitentes en arranque'],
};

const DIAGNOSTICOS_POR_TIPO: Record<TipoOrden, string[]> = {
  Mantenimiento: ['Aceite degradado, filtros colmatados', 'Mantenimiento preventivo en tiempo y forma', 'Revisión 27 puntos sin anomalías adicionales'],
  Reparación: ['Pastillas freno al límite, discos con ranuras', 'Banda distribución con desgaste visible — cambio inmediato', 'Bujías carbonizadas, bobina #3 defectuosa'],
  Diagnóstico: ['Códigos P0301-P0304 activos — fallo en cilindros 1-4', 'Sensor O2 aguas abajo desconectado', 'Sensor velocidad rueda trasera derecha dañado'],
  Hojalatería: ['Deformación en chapa — requiere conformado y pintura', 'Defensa dañada — cambio de pieza y pintura', 'Rayones profundos hasta imprimación — pintura parcial'],
  Eléctrico: ['Alternador generando 11.2V — por debajo del mínimo', 'Batería con 280 CCA, original requiere 450 CCA', 'Sistema de arranque OK — batería descargada'],
};

function buildOrden(i: number): OrdenServicio {
  const vid = `v${(i % 25) + 1}`;
  const v = MOCK_VEHICULOS.find((x) => x.id === vid)!;
  const cliente = MOCK_CLIENTES.find((c) => c.vehiculos.includes(vid))!;
  const tipo = TIPOS[i % TIPOS.length]!;
  const status = STATUS_ROT[i % STATUS_ROT.length]!;
  const tec = TECN_NOMBRES[i % 4]!;
  const diasTaller = i % 8;

  const trabaOpts = TRABAJOS_POR_TIPO[tipo];
  const trabajos = trabaOpts[i % trabaOpts.length]!;
  const refOpts = REFS_POR_TIPO[tipo];
  const refs = refOpts[i % refOpts.length]!;

  const sub = trabajos.reduce((s, t) => s + t.costo, 0);
  const refT = refs.reduce((s, r) => s + r.total, 0);
  const total = sub + refT;

  const probOpts = PROBLEMAS_POR_TIPO[tipo];
  const diagOpts = DIAGNOSTICOS_POR_TIPO[tipo];

  return {
    id: `o${i + 1}`,
    vehiculoId: vid,
    clienteId: cliente.id,
    tecnico: tec,
    tipo,
    descripcionProblema: probOpts[i % probOpts.length]!,
    diagnostico: diagOpts[i % diagOpts.length]!,
    trabajosRealizados: trabajos,
    refacciones: refs,
    subtotalManoObra: sub,
    subtotalRefacciones: refT,
    total,
    status,
    fechaIngreso: isoDaysAgo(diasTaller + 1),
    fechaEstimadaEntrega: isoDaysFromNow(status === 'listo' ? 0 : 1),
    fechaEntrega:
      status === 'entregado' ? (i % 4 === 0 ? isoDaysAgo(7) : isoDaysAgo(1)) : undefined,
    kilometrajeEntrada: v.kilometraje,
    observaciones: i % 5 === 0
      ? 'Encontramos que los frenos también necesitan cambio. ¿Autoriza? Costo adicional: $850 MXN'
      : 'Cliente autorizado — trabajo en proceso.',
    garantia: tipo === 'Hojalatería' ? '90 días en pintura' : '30 días o 3,000 km',
    checklist: i < 8 ? CHECKLISTS_MOCK[i] : undefined,
    fotosOrden: i < 8 ? (FOTOS_MOCK[i] ?? []) : [],
  };
}

export const MOCK_ORDENES: OrdenServicio[] = Array.from({ length: 30 }, (_, i) => buildOrden(i));

export function getCliente(id: string): Cliente | undefined {
  return MOCK_CLIENTES.find((c) => c.id === id);
}

export function getVehiculo(id: string): Vehiculo | undefined {
  return MOCK_VEHICULOS.find((v) => v.id === id);
}

export function getOrden(id: string): OrdenServicio | undefined {
  return MOCK_ORDENES.find((o) => o.id === id);
}

export function ordenesPorStatus(s: StatusOrden): OrdenServicio[] {
  return MOCK_ORDENES.filter((o) => o.status === s);
}

/** Días desde fecha ISO (solo fecha) */
export function diasDesde(fechaIso: string): number {
  const t = new Date(fechaIso + 'T12:00:00').getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor((today - t) / 86400000);
}

export function diasHasta(fechaIso: string): number {
  const t = new Date(fechaIso + 'T12:00:00').getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.floor((t - today) / 86400000);
}

export const MOCK_CAJA_HOY: MovimientoCaja[] = [
  { id: 'mc1', tipo: 'ingreso', concepto: 'Orden o5 — Mano de obra', monto: 2400, hora: '09:15', metodoPago: 'efectivo', rubro: 'mano_obra' },
  { id: 'mc2', tipo: 'ingreso', concepto: 'Orden o5 — Refacciones', monto: 1800, hora: '09:16', metodoPago: 'efectivo', rubro: 'refacciones' },
  { id: 'mc3', tipo: 'ingreso', concepto: 'Orden o12 — Total', monto: 4200, hora: '11:40', metodoPago: 'tarjeta' },
  { id: 'mc4', tipo: 'ingreso', concepto: 'Anticipo orden o18', monto: 1500, hora: '12:05', metodoPago: 'transferencia' },
  { id: 'mc5', tipo: 'egreso', concepto: 'Compra urgent aceite (proveedor)', monto: 890, hora: '14:22', metodoPago: 'efectivo' },
  { id: 'mc6', tipo: 'ingreso', concepto: 'Servicio express frenos', monto: 2100, hora: '16:50', metodoPago: 'tarjeta', rubro: 'mano_obra' },
];

export function ingresosDelDia(movs: MovimientoCaja[]): number {
  return movs.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + m.monto, 0);
}

export function egresosDelDia(movs: MovimientoCaja[]): number {
  return movs.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + m.monto, 0);
}

export function ingresosPorRubro(movs: MovimientoCaja[]): { mano_obra: number; refacciones: number; otro: number } {
  let mano_obra = 0;
  let refacciones = 0;
  let otro = 0;
  for (const m of movs) {
    if (m.tipo !== 'ingreso') continue;
    if (m.rubro === 'mano_obra') mano_obra += m.monto;
    else if (m.rubro === 'refacciones') refacciones += m.monto;
    else otro += m.monto;
  }
  return { mano_obra, refacciones, otro };
}

/** Inventario refacciones demo */
export type ItemInventario = {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  minimo: number;
  precioCompra: number;
  proveedor: string;
};

export const MOCK_INVENTARIO: ItemInventario[] = [
  { id: 'i1', nombre: 'Aceite 5W30 4L', categoria: 'Lubricantes', stock: 24, minimo: 10, precioCompra: 320, proveedor: 'LubriMX' },
  { id: 'i2', nombre: 'Filtro de aceite universal', categoria: 'Filtros', stock: 8, minimo: 12, precioCompra: 95, proveedor: 'RefaNorte' },
  { id: 'i3', nombre: 'Pastillas de freno delanteras', categoria: 'Frenos', stock: 15, minimo: 6, precioCompra: 450, proveedor: 'BrakePro' },
  { id: 'i4', nombre: 'Bujías NGK', categoria: 'Encendido', stock: 40, minimo: 20, precioCompra: 55, proveedor: 'SparkMX' },
  { id: 'i5', nombre: 'Anticongelante 1L', categoria: 'Refrigeración', stock: 3, minimo: 8, precioCompra: 78, proveedor: 'CoolAuto' },
  { id: 'i6', nombre: 'Líquido de frenos DOT4', categoria: 'Frenos', stock: 18, minimo: 10, precioCompra: 62, proveedor: 'BrakePro' },
];
