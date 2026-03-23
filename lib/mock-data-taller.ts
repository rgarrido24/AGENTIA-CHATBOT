/**
 * Demo Taller Mecánico AutoPro — Servicio Confiable
 */

export type Combustible = 'Gasolina' | 'Diesel' | 'Híbrido' | 'Eléctrico';

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

function buildOrden(i: number): OrdenServicio {
  const vid = `v${(i % 25) + 1}`;
  const v = MOCK_VEHICULOS.find((x) => x.id === vid)!;
  const cliente = MOCK_CLIENTES.find((c) => c.vehiculos.includes(vid))!;
  const tipo = TIPOS[i % TIPOS.length];
  const status = STATUS_ROT[i % STATUS_ROT.length];
  const tec = TECN_NOMBRES[i % 4];
  const trabajos = [
    { descripcion: 'Cambio de aceite y filtro', tiempo: 0.5, costo: 150 },
    { descripcion: 'Revisión de frenos delanteros', tiempo: 1, costo: 300 },
  ];
  const refs = [
    { nombre: 'Aceite 5W30 1L', cantidad: 4, costoUnitario: 85, total: 340 },
    { nombre: 'Filtro de aceite', cantidad: 1, costoUnitario: 120, total: 120 },
  ];
  const sub = 450;
  const refT = 460;
  const total = sub + refT;
  const diasTaller = i % 8;
  return {
    id: `o${i + 1}`,
    vehiculoId: vid,
    clienteId: cliente.id,
    tecnico: tec,
    tipo,
    descripcionProblema:
      i % 3 === 0
        ? 'Ruido en motor al acelerar'
        : i % 3 === 1
          ? 'Testigo de motor encendido'
          : 'Golpe en lateral derecho',
    diagnostico:
      tipo === 'Diagnóstico'
        ? 'Códigos P0301-P0304; revisar bobinas'
        : 'Desgaste normal en banda de accesorios',
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
    observaciones: 'Cliente autorizado en espera.',
    garantia: '30 días o 3,000 km',
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
