/** Configuración de giros disponibles en la demo Barbería / Nail Studio. */

export type GiroId = 'barberia' | 'nail';

export type GiroService = {
  emoji: string;
  imageUrl: string;
  nombre: string;
  precio: number;
  min: number;
  costo?: number;          // costo del servicio (para finanzas)
  comisionPct?: number;    // % comisión al artista
  descripcion?: string;
  stats?: string;
};

export type GiroStaff = {
  nombre: string;
  emoji: string;
  imageUrl: string;
  especialidad: string;
  rol: 'principal' | 'ayudante';
  comisionPct: number;
};

export type ReturningClient = {
  nombre: string;
  ultimoServicio: string;
  ultimoArtista: string;
};

export type GiroCliente = {
  nombre: string;
  tel: string;
  ultimo: string;
  proxima: string;
  visitas: number;
  gasto: number;
};

export type GiroRecordatorio = {
  nombre: string;
  fecha: string;
  hora: string;
};

export type GiroInventarioItem = {
  nombre: string;
  imageUrl: string;
  stock: number;
  stockMinimo: number;
  unidad: string;
  costoUnitario: number;
  consumoPorServicio: number; // unidades consumidas por servicio promedio
};

export type GiroGasto = {
  concepto: string;
  monto: number;
  categoria: 'fijo' | 'variable' | 'inventario';
  fecha: string;
};

export type GiroConfig = {
  id: GiroId;
  nombre: string;
  emoji: string;
  acento: string;
  acentoSoft: string;
  tagline: string;
  termArtista: string;    // "barbero" | "nail artist"
  termServicio: string;   // "corte" | "aplicación"
  termCliente: string;    // "cliente" | "clienta"
  staff: GiroStaff[];
  servicios: GiroService[];
  clientes: GiroCliente[];
  recordatoriosManana: GiroRecordatorio[];
  recordatoriosPasado: GiroRecordatorio[];
  recordatoriosInactivos: string[];
  inventario: GiroInventarioItem[];
  gastosFijos: GiroGasto[];
  metaVisitas: number;
  recompensaNombre: string;
  clienteRegreso: ReturningClient;
  chipsStaff: string[];
  chipsCliente: string[];
  welcomeMsg: string;
  temaOscuro: boolean;
  recordatorioPlantilla: (n: string, f: string, h: string) => string;
  recordatorioPasadoPlantilla: (n: string, f: string, h: string) => string;
  reactivacionPlantilla: (n: string) => string;
};

// ─── Imágenes Unsplash (URLs estáticas, optimizadas) ──────────────────────────
const IMG = {
  // Barbería
  corteCabello:    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
  corteCejas:      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80',
  corteBarba:      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80',
  barba:           'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&q=80',
  paqueteSilver:   'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&q=80',
  paqueteGold:     'https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=400&q=80',
  ceja:            'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80',
  mascarilla:      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&q=80',
  parches:         'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
  // Nail
  acrilicas:       'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
  gelNails:        'https://images.unsplash.com/photo-1610992015734-2c6e8e2e8e8a?w=400&q=80',
  manicure:        'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
  pedicure:        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80',
  nailArt:         'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=400&q=80',
  retoque:         'https://images.unsplash.com/photo-1612382008002-0a8d3a0e2e6e?w=400&q=80',
  remocion:        'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&q=80',
  // Staff
  staffSofia:      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
  staffFernando:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
  staffValeria:    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
  staffAyudanteB:  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
  staffAyudanteN:  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80',
  // Inventario barbería
  invShampoo:      'https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=300&q=80',
  invCera:         'https://images.unsplash.com/photo-1626015449970-0e3c0baeed27?w=300&q=80',
  invAceiteBarba:  'https://images.unsplash.com/photo-1621607512020-2ab02d3d75b3?w=300&q=80',
  invCuchillas:    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&q=80',
  invToallas:      'https://images.unsplash.com/photo-1620912189865-aab5f1d3aef8?w=300&q=80',
  // Inventario nails
  invEsmalte:      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=300&q=80',
  invGelBase:      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&q=80',
  invAcrilico:     'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=300&q=80',
  invLijas:        'https://images.unsplash.com/photo-1610992015734-2c6e8e2e8e8a?w=300&q=80',
  invDesinfectant: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=300&q=80',
};

export const GIRO_CONFIGS: Record<GiroId, GiroConfig> = {
  barberia: {
    id: 'barberia',
    nombre: 'Barbería El Estilo',
    emoji: '✂️',
    acento: '#0d9488',
    acentoSoft: 'rgba(13, 148, 136, 0.22)',
    tagline: 'Cortes, barba y estilo',
    termArtista: 'barbero',
    termServicio: 'corte',
    termCliente: 'cliente',
    staff: [
      { nombre: 'Sofia',    emoji: '✂️', imageUrl: IMG.staffSofia,     especialidad: 'Cortes y degradados',     rol: 'principal', comisionPct: 50 },
      { nombre: 'Fernando', emoji: '💈', imageUrl: IMG.staffFernando,  especialidad: 'Barba y tratamientos',    rol: 'principal', comisionPct: 50 },
      { nombre: 'Diego',    emoji: '💈', imageUrl: IMG.staffAyudanteB, especialidad: 'Apoyo y aprendiz',        rol: 'ayudante',  comisionPct: 30 },
    ],
    servicios: [
      { emoji: '✂️',  imageUrl: IMG.corteCabello,  nombre: 'Corte de cabello',       precio: 250, min: 30, costo: 25, comisionPct: 50, stats: 'Más solicitado' },
      { emoji: '✂️🪮', imageUrl: IMG.corteCejas,    nombre: 'Corte + cejas',           precio: 270, min: 40, costo: 30, comisionPct: 50, stats: 'Popular entre semana' },
      { emoji: '✂️💈', imageUrl: IMG.corteBarba,    nombre: 'Corte y barba',           precio: 370, min: 50, costo: 45, comisionPct: 50, stats: 'Combo estrella' },
      { emoji: '💈',  imageUrl: IMG.barba,         nombre: 'Corte de barba',          precio: 220, min: 25, costo: 20, comisionPct: 50, stats: 'Alta rotación viernes' },
      { emoji: '💎',  imageUrl: IMG.paqueteSilver, nombre: 'Corte + barba + ceja',    precio: 380, min: 60, costo: 45, comisionPct: 50, stats: 'Top ventas' },
      { emoji: '🥈',  imageUrl: IMG.paqueteSilver, nombre: 'Paquete Silver',          precio: 400, min: 60, costo: 60, comisionPct: 45,
        descripcion: 'Corte + delineado ceja + mascarilla negra + parches colágeno' },
      { emoji: '🥇',  imageUrl: IMG.paqueteGold,   nombre: 'Paquete Gold',            precio: 550, min: 75, costo: 80, comisionPct: 45,
        descripcion: 'Corte + barba + delineado ceja + mascarilla negra + parches colágeno' },
      { emoji: '🪮',  imageUrl: IMG.ceja,          nombre: 'Delineado de ceja',       precio: 80,  min: 15, costo: 8,  comisionPct: 50 },
      { emoji: '🖤',  imageUrl: IMG.mascarilla,    nombre: 'Mascarilla negra',        precio: 90,  min: 20, costo: 15, comisionPct: 40 },
      { emoji: '💧',  imageUrl: IMG.parches,       nombre: 'Parches de colágeno',     precio: 50,  min: 10, costo: 12, comisionPct: 40 },
    ],
    clientes: [
      { nombre: 'Carlos Mendoza',     tel: '+52 55 1001 0001', ultimo: 'Corte y barba',        proxima: 'Hoy 4:00 pm',     visitas: 12, gasto: 4280 },
      { nombre: 'Juan García',        tel: '+52 55 1002 0002', ultimo: 'Corte de cabello',     proxima: 'Mañana 11:00 am', visitas: 4,  gasto: 1520 },
      { nombre: 'Roberto López',      tel: '+52 55 1003 0003', ultimo: 'Corte + Barba',        proxima: '—',               visitas: 8,  gasto: 2890 },
      { nombre: 'Miguel Torres',      tel: '+52 55 1004 0004', ultimo: 'Arreglo de barba',     proxima: 'Vie 3:30 pm',     visitas: 2,  gasto: 480  },
      { nombre: 'Andrés Hernández',   tel: '+52 55 1005 0005', ultimo: 'Paquete Gold',         proxima: '—',               visitas: 15, gasto: 6200 },
      { nombre: 'Diego Martínez',     tel: '+52 55 1006 0006', ultimo: 'Corte clásico',        proxima: 'Hoy 6:00 pm',     visitas: 6,  gasto: 2100 },
      { nombre: 'Luis Ramírez',       tel: '+52 55 1007 0007', ultimo: 'Fade',                 proxima: 'Mar 10:00 am',    visitas: 3,  gasto: 980  },
      { nombre: 'Fernando Castro',    tel: '+52 55 1008 0008', ultimo: 'Afeitado',             proxima: '—',               visitas: 1,  gasto: 150  },
      { nombre: 'Pablo Jiménez',      tel: '+52 55 1009 0009', ultimo: 'Corte + Barba',        proxima: 'Jue 5:00 pm',     visitas: 11, gasto: 4100 },
      { nombre: 'Alejandro Morales',  tel: '+52 55 1010 0010', ultimo: 'Mascarilla negra',     proxima: '—',               visitas: 5,  gasto: 1750 },
      { nombre: 'Eduardo Vargas',     tel: '+52 55 1011 0011', ultimo: 'Corte clásico',        proxima: 'Mañana 9:30 am',  visitas: 7,  gasto: 2340 },
      { nombre: 'Ricardo Díaz',       tel: '+52 55 1012 0012', ultimo: 'Corte de barba',       proxima: '—',               visitas: 9,  gasto: 2680 },
      { nombre: 'Sergio Reyes',       tel: '+52 55 1013 0013', ultimo: 'Fade',                 proxima: 'Sáb 12:00 pm',    visitas: 4,  gasto: 1200 },
      { nombre: 'Antonio Flores',     tel: '+52 55 1014 0014', ultimo: 'Corte niño',           proxima: '—',               visitas: 2,  gasto: 360  },
      { nombre: 'Javier González',    tel: '+52 55 1015 0015', ultimo: 'Corte + Barba',        proxima: 'Mié 4:00 pm',     visitas: 13, gasto: 5020 },
    ],
    recordatoriosManana: [
      { nombre: 'Carlos Mendoza',  fecha: '24 de marzo', hora: '10:00' },
      { nombre: 'Eduardo Vargas',  fecha: '24 de marzo', hora: '09:30' },
      { nombre: 'Juan García',     fecha: '24 de marzo', hora: '11:00' },
    ],
    recordatoriosPasado: [
      { nombre: 'Luis Ramírez', fecha: '25 de marzo', hora: '10:00' },
      { nombre: 'Sergio Reyes', fecha: '25 de marzo', hora: '12:00' },
    ],
    recordatoriosInactivos: ['Fernando Castro', 'Antonio Flores', 'Miguel Torres'],
    inventario: [
      { nombre: 'Shampoo profesional',  imageUrl: IMG.invShampoo,     stock: 8,  stockMinimo: 5,  unidad: 'botellas',  costoUnitario: 180, consumoPorServicio: 0.05 },
      { nombre: 'Cera para cabello',    imageUrl: IMG.invCera,        stock: 12, stockMinimo: 6,  unidad: 'frascos',   costoUnitario: 95,  consumoPorServicio: 0.08 },
      { nombre: 'Aceite de barba',      imageUrl: IMG.invAceiteBarba, stock: 4,  stockMinimo: 5,  unidad: 'frascos',   costoUnitario: 220, consumoPorServicio: 0.1  },
      { nombre: 'Cuchillas desechables',imageUrl: IMG.invCuchillas,   stock: 24, stockMinimo: 30, unidad: 'piezas',    costoUnitario: 12,  consumoPorServicio: 1    },
      { nombre: 'Toallas calientes',    imageUrl: IMG.invToallas,     stock: 18, stockMinimo: 10, unidad: 'piezas',    costoUnitario: 35,  consumoPorServicio: 1    },
    ],
    gastosFijos: [
      { concepto: 'Renta del local',         monto: 12000, categoria: 'fijo',     fecha: '01/03/2025' },
      { concepto: 'Luz y agua',              monto: 1800,  categoria: 'fijo',     fecha: '05/03/2025' },
      { concepto: 'Internet + WhatsApp Biz', monto: 599,   categoria: 'fijo',     fecha: '03/03/2025' },
      { concepto: 'Reposición de cera',      monto: 1140,  categoria: 'inventario', fecha: '12/03/2025' },
      { concepto: 'Reposición de cuchillas', monto: 720,   categoria: 'inventario', fecha: '15/03/2025' },
      { concepto: 'Publicidad redes',        monto: 2200,  categoria: 'variable', fecha: '08/03/2025' },
    ],
    metaVisitas: 5,
    recompensaNombre: 'corte de cabello',
    clienteRegreso: {
      nombre: 'Carlos',
      ultimoServicio: 'Corte y barba',
      ultimoArtista: 'Fernando',
    },
    chipsStaff: [
      '¿Quién tiene cita hoy?',
      'Generar recordatorio para mañana',
      '¿Cuánto llevamos de ingresos hoy?',
      'Cliente sin visitar hace más de 30 días',
    ],
    chipsCliente: [
      'Quiero cita para corte y barba',
      '¿Qué incluye el Paquete Gold?',
      '¿Qué horarios tienen disponibles?',
      'Mis puntos de lealtad',
    ],
    welcomeMsg:
      '¡Hola! Soy el asistente de Barbería El Estilo. Intenta agendar una cita — escribe algo como "quiero una cita mañana".',
    temaOscuro: true,
    recordatorioPlantilla: (n, f, h) =>
      `Hola ${n}, tu cita en Barbería El Estilo es mañana ${f} a las ${h}. ¿Necesitas cambiar algo? ¡Te esperamos!`,
    recordatorioPasadoPlantilla: (n, f, h) =>
      `Hola ${n}, te recordamos tu cita en Barbería El Estilo para ${f} a las ${h}. ¿Confirmas asistencia?`,
    reactivacionPlantilla: (n) =>
      `Hola ${n}! Te extrañamos en Barbería El Estilo. Esta semana tenemos un 20% de descuento especial para clientes frecuentes. ¿Agendamos?`,
  },

  nail: {
    id: 'nail',
    nombre: 'Nail Studio Demo',
    emoji: '💅',
    acento: '#ec4899',
    acentoSoft: 'rgba(236, 72, 153, 0.18)',
    tagline: 'Uñas, nail art y cuidado',
    termArtista: 'nail artist',
    termServicio: 'aplicación',
    termCliente: 'clienta',
    staff: [
      { nombre: 'Sofia',    emoji: '💅', imageUrl: IMG.staffSofia,     especialidad: 'Uñas gel y nail art',        rol: 'principal', comisionPct: 55 },
      { nombre: 'Valeria',  emoji: '✨', imageUrl: IMG.staffValeria,   especialidad: 'Acrílicas y diseños',        rol: 'principal', comisionPct: 55 },
      { nombre: 'Mariana',  emoji: '💖', imageUrl: IMG.staffAyudanteN, especialidad: 'Apoyo y manicure express',  rol: 'ayudante',  comisionPct: 35 },
    ],
    servicios: [
      { emoji: '💅', imageUrl: IMG.acrilicas,  nombre: 'Uñas acrílicas',       precio: 350, min: 90, costo: 60, comisionPct: 55, stats: 'Más solicitado' },
      { emoji: '✨', imageUrl: IMG.gelNails,   nombre: 'Uñas gel',              precio: 300, min: 75, costo: 50, comisionPct: 55, stats: 'Muy popular' },
      { emoji: '💖', imageUrl: IMG.manicure,   nombre: 'Manicure tradicional', precio: 150, min: 45, costo: 20, comisionPct: 50, stats: 'Incluye hidratación' },
      { emoji: '🦶', imageUrl: IMG.pedicure,   nombre: 'Pedicure',              precio: 200, min: 60, costo: 25, comisionPct: 50, stats: 'Completo con exfoliación' },
      { emoji: '🎨', imageUrl: IMG.nailArt,    nombre: 'Nail art (diseño)',    precio: 50,  min: 20, costo: 8,  comisionPct: 60, descripcion: 'Precio adicional por diseño' },
      { emoji: '🔄', imageUrl: IMG.retoque,    nombre: 'Retoque',               precio: 180, min: 60, costo: 30, comisionPct: 55, stats: 'Aplica en gel y acrílico' },
      { emoji: '🧴', imageUrl: IMG.remocion,   nombre: 'Remoción',              precio: 100, min: 30, costo: 12, comisionPct: 45 },
    ],
    clientes: [
      { nombre: 'Ana Sofía Ramírez',  tel: '+52 55 2001 0001', ultimo: 'Uñas acrílicas',     proxima: 'Hoy 4:00 pm',     visitas: 14, gasto: 5460 },
      { nombre: 'María Fernanda Ruiz',tel: '+52 55 2002 0002', ultimo: 'Uñas gel',           proxima: 'Mañana 11:00 am', visitas: 6,  gasto: 2100 },
      { nombre: 'Valentina Pérez',    tel: '+52 55 2003 0003', ultimo: 'Manicure + nail art',proxima: '—',               visitas: 9,  gasto: 3320 },
      { nombre: 'Camila Torres',      tel: '+52 55 2004 0004', ultimo: 'Retoque gel',        proxima: 'Vie 3:30 pm',     visitas: 3,  gasto: 720  },
      { nombre: 'Daniela Hernández',  tel: '+52 55 2005 0005', ultimo: 'Pedicure spa',       proxima: '—',               visitas: 17, gasto: 7080 },
      { nombre: 'Isabella Romero',    tel: '+52 55 2006 0006', ultimo: 'Uñas acrílicas',     proxima: 'Hoy 6:00 pm',     visitas: 7,  gasto: 2800 },
      { nombre: 'Sofía Beltrán',      tel: '+52 55 2007 0007', ultimo: 'Nail art temático',  proxima: 'Mar 10:00 am',    visitas: 4,  gasto: 1380 },
      { nombre: 'Renata Vázquez',     tel: '+52 55 2008 0008', ultimo: 'Manicure tradicional',proxima: '—',              visitas: 1,  gasto: 150  },
      { nombre: 'Ximena Aguilar',     tel: '+52 55 2009 0009', ultimo: 'Uñas gel + diseño',  proxima: 'Jue 5:00 pm',     visitas: 12, gasto: 4500 },
      { nombre: 'Mariana Soto',       tel: '+52 55 2010 0010', ultimo: 'Retoque acrílico',   proxima: '—',               visitas: 5,  gasto: 1740 },
      { nombre: 'Lucía Méndez',       tel: '+52 55 2011 0011', ultimo: 'Uñas gel',           proxima: 'Mañana 9:30 am',  visitas: 8,  gasto: 2640 },
      { nombre: 'Regina Castillo',    tel: '+52 55 2012 0012', ultimo: 'Pedicure',           proxima: '—',               visitas: 10, gasto: 3200 },
      { nombre: 'Andrea Morales',     tel: '+52 55 2013 0013', ultimo: 'Manicure francés',   proxima: 'Sáb 12:00 pm',    visitas: 4,  gasto: 1100 },
      { nombre: 'Paulina Reyes',      tel: '+52 55 2014 0014', ultimo: 'Remoción',           proxima: '—',               visitas: 2,  gasto: 380  },
      { nombre: 'Elena Domínguez',    tel: '+52 55 2015 0015', ultimo: 'Uñas acrílicas',     proxima: 'Mié 4:00 pm',     visitas: 13, gasto: 5180 },
    ],
    recordatoriosManana: [
      { nombre: 'Ana Sofía Ramírez',   fecha: '24 de marzo', hora: '10:00' },
      { nombre: 'Lucía Méndez',        fecha: '24 de marzo', hora: '09:30' },
      { nombre: 'María Fernanda Ruiz', fecha: '24 de marzo', hora: '11:00' },
    ],
    recordatoriosPasado: [
      { nombre: 'Sofía Beltrán',  fecha: '25 de marzo', hora: '10:00' },
      { nombre: 'Andrea Morales', fecha: '25 de marzo', hora: '12:00' },
    ],
    recordatoriosInactivos: ['Renata Vázquez', 'Paulina Reyes', 'Camila Torres'],
    inventario: [
      { nombre: 'Esmalte gel (paleta)',     imageUrl: IMG.invEsmalte,       stock: 12, stockMinimo: 8,  unidad: 'frascos', costoUnitario: 240, consumoPorServicio: 0.04 },
      { nombre: 'Base + top coat',          imageUrl: IMG.invGelBase,       stock: 6,  stockMinimo: 5,  unidad: 'frascos', costoUnitario: 320, consumoPorServicio: 0.08 },
      { nombre: 'Polvo acrílico',           imageUrl: IMG.invAcrilico,      stock: 3,  stockMinimo: 4,  unidad: 'tarros',  costoUnitario: 480, consumoPorServicio: 0.05 },
      { nombre: 'Lijas y limas',            imageUrl: IMG.invLijas,         stock: 28, stockMinimo: 20, unidad: 'piezas',  costoUnitario: 18,  consumoPorServicio: 0.5  },
      { nombre: 'Desinfectante / acetona',  imageUrl: IMG.invDesinfectant,  stock: 2,  stockMinimo: 4,  unidad: 'litros',  costoUnitario: 280, consumoPorServicio: 0.05 },
    ],
    gastosFijos: [
      { concepto: 'Renta del local',         monto: 11000, categoria: 'fijo',       fecha: '01/03/2025' },
      { concepto: 'Luz y agua',              monto: 1500,  categoria: 'fijo',       fecha: '05/03/2025' },
      { concepto: 'Internet + WhatsApp Biz', monto: 599,   categoria: 'fijo',       fecha: '03/03/2025' },
      { concepto: 'Reposición esmaltes',     monto: 1920,  categoria: 'inventario', fecha: '12/03/2025' },
      { concepto: 'Reposición acrílico',     monto: 960,   categoria: 'inventario', fecha: '15/03/2025' },
      { concepto: 'Publicidad Instagram',    monto: 2800,  categoria: 'variable',   fecha: '08/03/2025' },
    ],
    metaVisitas: 5,
    recompensaNombre: 'manicure',
    clienteRegreso: {
      nombre: 'Ana',
      ultimoServicio: 'Uñas acrílicas',
      ultimoArtista: 'Sofia',
    },
    chipsStaff: [
      '¿Quién tiene cita hoy?',
      'Generar recordatorio para diseño de uñas',
      '¿Cuánto llevamos de ingresos hoy?',
      'Clienta sin visitar hace más de 30 días',
    ],
    chipsCliente: [
      'Quiero cita para uñas acrílicas',
      '¿Cuánto cuesta el nail art?',
      '¿Qué horarios tienen disponibles?',
      'Mis puntos de lealtad',
    ],
    welcomeMsg:
      '¡Hola! Soy la asistente de Nail Studio. Agenda tu cita de uñas — escribe algo como "quiero cita mañana".',
    temaOscuro: false,
    recordatorioPlantilla: (n, f, h) =>
      `Hola ${n}, tu cita en Nail Studio es mañana ${f} a las ${h}. ¡No olvides traer la inspiración de tu diseño! Te esperamos.`,
    recordatorioPasadoPlantilla: (n, f, h) =>
      `Hola ${n}, te recordamos tu cita en Nail Studio para ${f} a las ${h}. ¿Confirmas asistencia?`,
    reactivacionPlantilla: (n) =>
      `Hola ${n}! Te extrañamos en Nail Studio. Esta semana 20% de descuento en uñas gel y nail art para clientas frecuentes. ¿Agendamos?`,
  },
};
