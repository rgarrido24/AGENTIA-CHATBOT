/**
 * Demo ARWINGS / La Séptima — Bar & Kitchen
 */

export type CategoriaProducto = 'Hamburguesas' | 'Alitas' | 'Boneless' | 'Bebidas' | 'Extras';

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: CategoriaProducto;
  disponible: boolean;
  imagen: string;
  stockActual: number;
  stockMinimo: number;
  calorias?: number;
  esPicoso?: boolean;
  esPopular?: boolean;
};

export type Mesa = {
  id: number;
  nombre: string;
  capacidad: number;
  status: 'disponible' | 'ocupada' | 'cuenta_pedida' | 'reservada';
  ordenActual?: string;
  tiempoOcupada?: number;
  consumoActual?: number;
};

export type Orden = {
  id: string;
  tipo: 'mesa' | 'delivery';
  mesa?: number;
  cliente?: { nombre: string; telefono: string; direccion: string; colonia?: string };
  items: Array<{ productoId: string; nombre: string; cantidad: number; precio: number; notas?: string }>;
  subtotal: number;
  total: number;
  status: 'nueva' | 'en_preparacion' | 'lista' | 'entregada' | 'cancelada';
  area: 'cocina' | 'bar' | 'ambas';
  createdAt: string;
  tiempoEstimado: number;
};

export type ClienteDelivery = {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  colonia: string;
  ultimaVisita: string;
  totalPedidos: number;
  ticketPromedio: number;
  diasSinPedir: number;
  favorito: string;
};

export type Ingrediente = {
  id: string;
  nombre: string;
  unidad: 'kg' | 'pzas' | 'lt' | 'bolsas';
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  proveedor: string;
  ultimaCompra: string;
};

export type MovimientoCaja = {
  id: string;
  tipo: 'ingreso' | 'egreso';
  concepto: string;
  monto: number;
  hora: string;
  ordenId?: string;
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia';
};

export const BRAND = {
  nombre: 'ARWINGS — Bar & Kitchen',
  corto: 'La Séptima',
  tagline: 'La Séptima — Bar & Kitchen',
} as const;

export const MOCK_PRODUCTOS: Producto[] = [
  // Hamburguesas
  {
    id: 'p1',
    nombre: 'La Clásica',
    descripcion: 'Carne de res, lechuga, tomate, cebolla, aderezo de la casa',
    precio: 115,
    categoria: 'Hamburguesas',
    disponible: true,
    imagen: '🍔',
    stockActual: 40,
    stockMinimo: 15,
    calorias: 520,
    esPopular: true,
  },
  {
    id: 'p2',
    nombre: 'La BBQ Smokey',
    descripcion: 'Carne de res, queso cheddar, cebolla caramelizada, salsa BBQ ahumada',
    precio: 135,
    categoria: 'Hamburguesas',
    disponible: true,
    imagen: '🍔',
    stockActual: 35,
    stockMinimo: 12,
    esPopular: true,
  },
  {
    id: 'p3',
    nombre: 'La Doble Fuego',
    descripcion: 'Doble carne, jalapeños, queso pepper jack, salsa picante',
    precio: 155,
    categoria: 'Hamburguesas',
    disponible: true,
    imagen: '🍔',
    stockActual: 22,
    stockMinimo: 10,
    esPicoso: true,
  },
  {
    id: 'p4',
    nombre: 'La Veggie',
    descripcion: 'Portobello empanizado, aguacate, germinado, aderezo cítrico',
    precio: 125,
    categoria: 'Hamburguesas',
    disponible: true,
    imagen: '🥬',
    stockActual: 18,
    stockMinimo: 8,
  },
  {
    id: 'p5',
    nombre: 'La Séptima Especial',
    descripcion: 'Carne angus, queso gouda, tocino crujiente, huevo a la plancha',
    precio: 165,
    categoria: 'Hamburguesas',
    disponible: true,
    imagen: '🍔',
    stockActual: 15,
    stockMinimo: 6,
    esPopular: true,
  },
  // Alitas
  {
    id: 'p6',
    nombre: 'Alitas 6 pzas BBQ',
    descripcion: 'Orden 6 piezas con salsa BBQ ahumada',
    precio: 119,
    categoria: 'Alitas',
    disponible: true,
    imagen: '🍗',
    stockActual: 80,
    stockMinimo: 24,
  },
  {
    id: 'p7',
    nombre: 'Alitas 10 pzas Buffalo',
    descripcion: 'Orden 10 piezas estilo Buffalo con aderezo ranch',
    precio: 175,
    categoria: 'Alitas',
    disponible: true,
    imagen: '🍗',
    stockActual: 60,
    stockMinimo: 20,
    esPicoso: true,
    esPopular: true,
  },
  {
    id: 'p8',
    nombre: 'Alitas 6 pzas Mango Habanero',
    descripcion: 'Dulce y picante, glaseado de mango habanero',
    precio: 125,
    categoria: 'Alitas',
    disponible: true,
    imagen: '🍗',
    stockActual: 45,
    stockMinimo: 15,
    esPicoso: true,
  },
  {
    id: 'p9',
    nombre: 'Alitas 10 pzas Mixtas',
    descripcion: 'BBQ, Buffalo y Mango Habanero en una sola orden',
    precio: 185,
    categoria: 'Alitas',
    disponible: true,
    imagen: '🍗',
    stockActual: 30,
    stockMinimo: 10,
  },
  // Boneless
  {
    id: 'p10',
    nombre: 'Boneless 8 pzas Clásico',
    descripcion: 'Trozos de pechuga empanizada, salsa de la casa',
    precio: 109,
    categoria: 'Boneless',
    disponible: true,
    imagen: '🍖',
    stockActual: 50,
    stockMinimo: 16,
  },
  {
    id: 'p11',
    nombre: 'Boneless 8 pzas Chipotle',
    descripcion: 'Con aderezo chipotle cremoso',
    precio: 119,
    categoria: 'Boneless',
    disponible: true,
    imagen: '🍖',
    stockActual: 40,
    stockMinimo: 14,
  },
  {
    id: 'p12',
    nombre: 'Boneless 12 pzas Surtido',
    descripcion: 'Variedad de salsas: BBQ, Buffalo y Clásico',
    precio: 165,
    categoria: 'Boneless',
    disponible: true,
    imagen: '🍖',
    stockActual: 28,
    stockMinimo: 10,
  },
  // Bebidas
  {
    id: 'p13',
    nombre: 'Mojito',
    descripcion: 'Ron, menta, lima, soda',
    precio: 75,
    categoria: 'Bebidas',
    disponible: true,
    imagen: '🍹',
    stockActual: 120,
    stockMinimo: 40,
  },
  {
    id: 'p14',
    nombre: 'Michelada',
    descripcion: 'Cerveza con clamato y especias',
    precio: 65,
    categoria: 'Bebidas',
    disponible: true,
    imagen: '🍺',
    stockActual: 90,
    stockMinimo: 30,
  },
  {
    id: 'p15',
    nombre: 'Agua fresca',
    descripcion: 'Sabor del día: jamaica o horchata',
    precio: 35,
    categoria: 'Bebidas',
    disponible: true,
    imagen: '🥤',
    stockActual: 200,
    stockMinimo: 60,
  },
  {
    id: 'p16',
    nombre: 'Refresco',
    descripcion: 'Lata 355 ml',
    precio: 30,
    categoria: 'Bebidas',
    disponible: true,
    imagen: '🥤',
    stockActual: 150,
    stockMinimo: 48,
  },
  {
    id: 'p17',
    nombre: 'Cerveza',
    descripcion: 'Nacional o importada',
    precio: 55,
    categoria: 'Bebidas',
    disponible: true,
    imagen: '🍺',
    stockActual: 180,
    stockMinimo: 50,
  },
  // Extras
  {
    id: 'p18',
    nombre: 'Papas fritas',
    descripcion: 'Orden grande con sal de ajo',
    precio: 45,
    categoria: 'Extras',
    disponible: true,
    imagen: '🍟',
    stockActual: 70,
    stockMinimo: 20,
  },
  {
    id: 'p19',
    nombre: 'Aros de cebolla',
    descripcion: 'Crujientes con dip BBQ',
    precio: 55,
    categoria: 'Extras',
    disponible: true,
    imagen: '🧅',
    stockActual: 35,
    stockMinimo: 12,
  },
  {
    id: 'p20',
    nombre: 'Guacamole',
    descripcion: 'Con totopos recién hechos',
    precio: 40,
    categoria: 'Extras',
    disponible: false,
    imagen: '🥑',
    stockActual: 0,
    stockMinimo: 8,
  },
];

export const MOCK_MESAS: Mesa[] = [
  { id: 1, nombre: 'Mesa 1', capacidad: 2, status: 'disponible' },
  { id: 2, nombre: 'Mesa 2', capacidad: 4, status: 'ocupada', ordenActual: 'ord-042', tiempoOcupada: 45, consumoActual: 320 },
  { id: 3, nombre: 'Mesa 3', capacidad: 4, status: 'ocupada', ordenActual: 'ord-039', tiempoOcupada: 28, consumoActual: 460 },
  { id: 4, nombre: 'Mesa 4', capacidad: 4, status: 'cuenta_pedida', ordenActual: 'ord-041', tiempoOcupada: 62, consumoActual: 580 },
  { id: 5, nombre: 'Mesa 5', capacidad: 6, status: 'reservada' },
  { id: 6, nombre: 'Mesa 6', capacidad: 6, status: 'disponible' },
];

function todayIso(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const MOCK_ORDENES: Orden[] = [
  {
    id: 'ord-042',
    tipo: 'mesa',
    mesa: 2,
    items: [
      { productoId: 'p7', nombre: 'Alitas 10 pzas Buffalo', cantidad: 2, precio: 175 },
      { productoId: 'p2', nombre: 'La BBQ Smokey', cantidad: 1, precio: 135 },
    ],
    subtotal: 485,
    total: 485,
    status: 'nueva',
    area: 'ambas',
    createdAt: todayIso(14, 10),
    tiempoEstimado: 25,
  },
  {
    id: 'ord-039',
    tipo: 'mesa',
    mesa: 3,
    items: [
      { productoId: 'p5', nombre: 'La Séptima Especial', cantidad: 1, precio: 165 },
      { productoId: 'p13', nombre: 'Mojito', cantidad: 2, precio: 75 },
    ],
    subtotal: 315,
    total: 315,
    status: 'en_preparacion',
    area: 'ambas',
    createdAt: todayIso(13, 45),
    tiempoEstimado: 20,
  },
  {
    id: 'ord-041',
    tipo: 'mesa',
    mesa: 4,
    items: [{ productoId: 'p9', nombre: 'Alitas 10 pzas Mixtas', cantidad: 1, precio: 185 }],
    subtotal: 185,
    total: 185,
    status: 'lista',
    area: 'cocina',
    createdAt: todayIso(12, 30),
    tiempoEstimado: 18,
  },
  {
    id: 'ord-040',
    tipo: 'delivery',
    cliente: { nombre: 'Laura Méndez', telefono: '9991234567', direccion: 'Calle 45 #102', colonia: 'Centro' },
    items: [
      { productoId: 'p10', nombre: 'Boneless 8 pzas Clásico', cantidad: 3, precio: 109 },
      { productoId: 'p14', nombre: 'Michelada', cantidad: 1, precio: 65 },
    ],
    subtotal: 392,
    total: 392,
    status: 'nueva',
    area: 'ambas',
    createdAt: todayIso(14, 55),
    tiempoEstimado: 35,
  },
  {
    id: 'ord-038',
    tipo: 'mesa',
    mesa: 1,
    items: [{ productoId: 'p1', nombre: 'La Clásica', cantidad: 2, precio: 115 }],
    subtotal: 230,
    total: 230,
    status: 'entregada',
    area: 'cocina',
    createdAt: todayIso(12, 0),
    tiempoEstimado: 15,
  },
  {
    id: 'ord-037',
    tipo: 'delivery',
    cliente: { nombre: 'Omar Ruiz', telefono: '9997654321', direccion: 'Av. Reforma 220', colonia: 'Norte' },
    items: [
      { productoId: 'p12', nombre: 'Boneless 12 pzas Surtido', cantidad: 1, precio: 165 },
      { productoId: 'p17', nombre: 'Cerveza', cantidad: 3, precio: 55 },
    ],
    subtotal: 330,
    total: 330,
    status: 'entregada',
    area: 'ambas',
    createdAt: todayIso(13, 0),
    tiempoEstimado: 30,
  },
  {
    id: 'ord-036',
    tipo: 'mesa',
    mesa: 5,
    items: [{ productoId: 'p6', nombre: 'Alitas 6 pzas BBQ', cantidad: 1, precio: 119 }],
    subtotal: 119,
    total: 119,
    status: 'entregada',
    area: 'cocina',
    createdAt: todayIso(11, 20),
    tiempoEstimado: 12,
  },
  {
    id: 'ord-035',
    tipo: 'mesa',
    mesa: 6,
    items: [{ productoId: 'p18', nombre: 'Papas fritas', cantidad: 2, precio: 45 }],
    subtotal: 90,
    total: 90,
    status: 'entregada',
    area: 'cocina',
    createdAt: todayIso(10, 45),
    tiempoEstimado: 8,
  },
  {
    id: 'ord-034',
    tipo: 'delivery',
    cliente: { nombre: 'Ana Torres', telefono: '9991112233', direccion: 'Calle 60 #45', colonia: 'García Ginerés' },
    items: [{ productoId: 'p2', nombre: 'La BBQ Smokey', cantidad: 1, precio: 135 }],
    subtotal: 135,
    total: 135,
    status: 'entregada',
    area: 'cocina',
    createdAt: todayIso(19, 30),
    tiempoEstimado: 25,
  },
  {
    id: 'ord-033',
    tipo: 'mesa',
    mesa: 3,
    items: [{ productoId: 'p13', nombre: 'Mojito', cantidad: 4, precio: 75 }],
    subtotal: 300,
    total: 300,
    status: 'entregada',
    area: 'bar',
    createdAt: todayIso(20, 15),
    tiempoEstimado: 10,
  },
];

export const MOCK_CLIENTES_DELIVERY: ClienteDelivery[] = [
  { id: 'c1', nombre: 'Laura Méndez', telefono: '9991234567', direccion: 'Calle 45 #102', colonia: 'Centro', ultimaVisita: '2026-01-10', totalPedidos: 12, ticketPromedio: 285, diasSinPedir: 45, favorito: 'La BBQ Smokey' },
  { id: 'c2', nombre: 'Omar Ruiz', telefono: '9997654321', direccion: 'Av. Reforma 220', colonia: 'Norte', ultimaVisita: '2026-02-01', totalPedidos: 8, ticketPromedio: 310, diasSinPedir: 38, favorito: 'Boneless surtido' },
  { id: 'c3', nombre: 'Patricia Solís', telefono: '9992223344', direccion: 'Itzáes 400', colonia: 'Vergel', ultimaVisita: '2026-02-05', totalPedidos: 15, ticketPromedio: 195, diasSinPedir: 34, favorito: 'Alitas Buffalo' },
  { id: 'c4', nombre: 'Diego Chan', telefono: '9993334455', direccion: 'Pérez Ponce 12', colonia: 'Centro', ultimaVisita: '2026-02-08', totalPedidos: 6, ticketPromedio: 420, diasSinPedir: 31, favorito: 'La Séptima Especial' },
  { id: 'c5', nombre: 'María León', telefono: '9994445566', direccion: 'Colón 88', colonia: 'García Ginerés', ultimaVisita: '2026-02-12', totalPedidos: 20, ticketPromedio: 175, diasSinPedir: 32, favorito: 'Mojito' },
  { id: 'c6', nombre: 'Hugo Paz', telefono: '9995556677', direccion: 'Calle 21 #300', colonia: 'Itzimná', ultimaVisita: '2026-02-18', totalPedidos: 4, ticketPromedio: 260, diasSinPedir: 22, favorito: 'Michelada' },
  { id: 'c7', nombre: 'Sofía Herrera', telefono: '9996667788', direccion: 'Paseo Montejo 450', colonia: 'Centro', ultimaVisita: '2026-02-22', totalPedidos: 9, ticketPromedio: 198, diasSinPedir: 18, favorito: 'La Clásica' },
  { id: 'c8', nombre: 'Luis Campos', telefono: '9997778899', direccion: 'Av. Jacinto Canek', colonia: 'Villas', ultimaVisita: '2026-02-25', totalPedidos: 11, ticketPromedio: 305, diasSinPedir: 20, favorito: 'Alitas mixtas' },
  { id: 'c9', nombre: 'Renata Vidal', telefono: '9998889900', direccion: 'Calle 7 #201', colonia: 'Chuburná', ultimaVisita: '2026-02-28', totalPedidos: 7, ticketPromedio: 240, diasSinPedir: 16, favorito: 'Boneless chipotle' },
  { id: 'c10', nombre: 'Iván Molina', telefono: '9999990011', direccion: 'Circuito Colonias 102', colonia: 'Norte', ultimaVisita: '2026-03-01', totalPedidos: 5, ticketPromedio: 290, diasSinPedir: 12, favorito: 'La Doble Fuego' },
  { id: 'c11', nombre: 'Fernanda Ortiz', telefono: '9991002003', direccion: 'Calle 59 #400', colonia: 'Centro', ultimaVisita: '2026-03-05', totalPedidos: 14, ticketPromedio: 210, diasSinPedir: 8, favorito: 'Guacamole' },
  { id: 'c12', nombre: 'Carlos Pech', telefono: '9992003004', direccion: 'Av. Andrómeda', colonia: 'Las Américas', ultimaVisita: '2026-03-08', totalPedidos: 3, ticketPromedio: 380, diasSinPedir: 5, favorito: 'La Veggie' },
  { id: 'c13', nombre: 'Alejandra Baez', telefono: '9993004005', direccion: 'Calle 18 #55', colonia: 'Centro', ultimaVisita: '2026-03-10', totalPedidos: 18, ticketPromedio: 165, diasSinPedir: 3, favorito: 'Agua fresca' },
  { id: 'c14', nombre: 'Miguel Arceo', telefono: '9994005006', direccion: 'Zacatal 12', colonia: 'Dzityá', ultimaVisita: '2026-03-12', totalPedidos: 6, ticketPromedio: 275, diasSinPedir: 1, favorito: 'Cerveza' },
  { id: 'c15', nombre: 'Valeria Uc', telefono: '9995006007', direccion: 'Periférico 2000', colonia: 'Juan Pablo II', ultimaVisita: '2026-03-14', totalPedidos: 10, ticketPromedio: 220, diasSinPedir: 0, favorito: 'Papas fritas' },
];

export const MOCK_INGREDIENTES: Ingrediente[] = [
  { id: 'i1', nombre: 'Carne de res molida', unidad: 'kg', stockActual: 8, stockMinimo: 15, costoUnitario: 185, proveedor: 'Carnes del Norte', ultimaCompra: '2026-03-10' },
  { id: 'i2', nombre: 'Pan brioche', unidad: 'pzas', stockActual: 45, stockMinimo: 60, costoUnitario: 8, proveedor: 'Panadería La Esquina', ultimaCompra: '2026-03-12' },
  { id: 'i3', nombre: 'Pechuga de pollo', unidad: 'kg', stockActual: 22, stockMinimo: 18, costoUnitario: 95, proveedor: 'Avícola Peninsular', ultimaCompra: '2026-03-11' },
  { id: 'i4', nombre: 'Alitas enteras', unidad: 'kg', stockActual: 30, stockMinimo: 20, costoUnitario: 72, proveedor: 'Avícola Peninsular', ultimaCompra: '2026-03-11' },
  { id: 'i5', nombre: 'Papa para freír', unidad: 'kg', stockActual: 40, stockMinimo: 25, costoUnitario: 18, proveedor: 'Distribuidora Sur', ultimaCompra: '2026-03-09' },
  { id: 'i6', nombre: 'Cebolla', unidad: 'kg', stockActual: 12, stockMinimo: 8, costoUnitario: 22, proveedor: 'Mercado local', ultimaCompra: '2026-03-13' },
  { id: 'i7', nombre: 'Tomate', unidad: 'kg', stockActual: 10, stockMinimo: 6, costoUnitario: 28, proveedor: 'Mercado local', ultimaCompra: '2026-03-13' },
  { id: 'i8', nombre: 'Queso cheddar', unidad: 'kg', stockActual: 6, stockMinimo: 5, costoUnitario: 210, proveedor: 'Lácteos Yucatán', ultimaCompra: '2026-03-08' },
  { id: 'i9', nombre: 'Salsa BBQ', unidad: 'lt', stockActual: 4, stockMinimo: 3, costoUnitario: 85, proveedor: 'Salsas Gourmet', ultimaCompra: '2026-03-05' },
  { id: 'i10', nombre: 'Salsa Buffalo', unidad: 'lt', stockActual: 3, stockMinimo: 2, costoUnitario: 92, proveedor: 'Salsas Gourmet', ultimaCompra: '2026-03-05' },
  { id: 'i11', nombre: 'Ron blanco', unidad: 'lt', stockActual: 8, stockMinimo: 4, costoUnitario: 320, proveedor: 'Licores del Mayab', ultimaCompra: '2026-03-01' },
  { id: 'i12', nombre: 'Cerveza lata', unidad: 'pzas', stockActual: 200, stockMinimo: 80, costoUnitario: 18, proveedor: 'Distribuidora Cerveza', ultimaCompra: '2026-03-12' },
  { id: 'i13', nombre: 'Clamato', unidad: 'lt', stockActual: 10, stockMinimo: 5, costoUnitario: 45, proveedor: 'Abarrotes Central', ultimaCompra: '2026-03-10' },
  { id: 'i14', nombre: 'Aguacate', unidad: 'kg', stockActual: 5, stockMinimo: 4, costoUnitario: 95, proveedor: 'Mercado local', ultimaCompra: '2026-03-14' },
  { id: 'i15', nombre: 'Aceite para freír', unidad: 'lt', stockActual: 15, stockMinimo: 10, costoUnitario: 55, proveedor: 'Distribuidora Sur', ultimaCompra: '2026-03-07' },
];

const horas = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
export const VENTAS_POR_HORA = horas.map((h, i) => ({
  hora: `${h}:00`,
  venta: 800 + i * 120 + (i % 3) * 50,
}));

export const VENTAS_POR_CATEGORIA = [
  { name: 'Hamburguesas', value: 4200, fill: '#dc2626' },
  { name: 'Alitas', value: 3100, fill: '#f59e0b' },
  { name: 'Boneless', value: 1850, fill: '#eab308' },
  { name: 'Bebidas', value: 2400, fill: '#3b82f6' },
  { name: 'Extras', value: 650, fill: '#22c55e' },
];

export const TOP_PRODUCTOS_HOY = [
  { rank: 1, nombre: 'Alitas 10 pzas Buffalo', monto: 1750 },
  { rank: 2, nombre: 'La BBQ Smokey', monto: 1485 },
  { rank: 3, nombre: 'Mojito', monto: 1200 },
  { rank: 4, nombre: 'La Séptima Especial', monto: 990 },
  { rank: 5, nombre: 'Michelada', monto: 845 },
];

function mkMov(
  id: string,
  tipo: MovimientoCaja['tipo'],
  concepto: string,
  monto: number,
  hora: string,
  metodo?: MovimientoCaja['metodoPago'],
  ordenId?: string
): MovimientoCaja {
  return { id, tipo, concepto, monto, hora, metodoPago: metodo, ordenId };
}

export const MOCK_CAJA_HOY: MovimientoCaja[] = [
  mkMov('m1', 'ingreso', 'Venta mesa 2', 320, '12:15', 'efectivo', 'ord-042'),
  mkMov('m2', 'ingreso', 'Venta delivery Laura', 285, '12:42', 'transferencia', 'ord-034'),
  mkMov('m3', 'egreso', 'Cambio de monedas', 200, '13:00', 'efectivo'),
  mkMov('m4', 'ingreso', 'Venta bar Mojitos', 450, '13:20', 'tarjeta'),
  mkMov('m5', 'ingreso', 'Venta mesa 4', 580, '13:45', 'tarjeta', 'ord-041'),
  mkMov('m6', 'egreso', 'Compra de hielo', 120, '14:00', 'efectivo'),
  mkMov('m7', 'ingreso', 'Delivery Omar', 392, '14:18', 'transferencia', 'ord-040'),
  mkMov('m8', 'ingreso', 'Propinas', 180, '14:30', 'efectivo'),
  mkMov('m9', 'ingreso', 'Venta mesa 3', 460, '14:55', 'tarjeta', 'ord-039'),
  mkMov('m10', 'egreso', 'Gastos varios limpieza', 85, '15:10', 'efectivo'),
  mkMov('m11', 'ingreso', 'Cerveza tarde', 330, '15:40', 'efectivo'),
  mkMov('m12', 'ingreso', 'Boneless delivery', 327, '16:05', 'transferencia'),
  mkMov('m13', 'ingreso', 'Combo alitas', 238, '16:30', 'tarjeta'),
  mkMov('m14', 'egreso', 'Reparto gasolina', 250, '17:00', 'transferencia'),
  mkMov('m15', 'ingreso', 'Mesa 6 cuenta', 190, '17:25', 'tarjeta'),
  mkMov('m16', 'ingreso', 'Walk-in bar', 220, '18:10', 'efectivo'),
  mkMov('m17', 'ingreso', 'Delivery noche', 410, '19:00', 'transferencia'),
  mkMov('m18', 'ingreso', 'Happy hour', 560, '19:30', 'tarjeta'),
  mkMov('m19', 'egreso', 'Propina reparto', 60, '20:00', 'efectivo'),
  mkMov('m20', 'ingreso', 'Cierre parcial', 890, '20:45', 'tarjeta'),
];

export function getProductoById(id: string): Producto | undefined {
  return MOCK_PRODUCTOS.find((p) => p.id === id);
}

export function categoriaEsCocina(cat: CategoriaProducto): boolean {
  return cat !== 'Bebidas';
}

export function itemsCocina(orden: Orden) {
  return orden.items.filter((it) => {
    const p = getProductoById(it.productoId);
    return p && categoriaEsCocina(p.categoria);
  });
}

export function itemsBar(orden: Orden) {
  return orden.items.filter((it) => {
    const p = getProductoById(it.productoId);
    return p?.categoria === 'Bebidas';
  });
}

export function ingresosDelDia(movs: MovimientoCaja[]): number {
  return movs.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
}

export function egresosDelDia(movs: MovimientoCaja[]): number {
  return movs.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
}

export function ordenesCompletadas(ordenes: Orden[]): number {
  return ordenes.filter((o) => o.status === 'entregada').length;
}

export function mesaMasConsumo(mesas: Mesa[]): Mesa | null {
  const withCons = mesas.filter((m) => (m.consumoActual ?? 0) > 0);
  if (withCons.length === 0) return null;
  return [...withCons].sort((a, b) => (b.consumoActual ?? 0) - (a.consumoActual ?? 0))[0]!;
}
