/** Configuración de giros disponibles en la demo Barbería / Nail Studio. */

export type GiroId = 'barberia' | 'nail';

export type GiroService = {
  emoji: string;
  nombre: string;
  precio: number;
  min: number;
  descripcion?: string;
  stats?: string;
};

export type GiroStaff = {
  nombre: string;
  emoji: string;
  especialidad: string;
};

export type ReturningClient = {
  nombre: string;
  ultimoServicio: string;
  ultimoArtista: string;
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
  metaVisitas: number;
  recompensaNombre: string;  // "corte de cabello" | "manicure"
  clienteRegreso: ReturningClient;
  chipsStaff: string[];
  chipsCliente: string[];
  welcomeMsg: string;
  temaOscuro: boolean;
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
      { nombre: 'Sofia', emoji: '✂️', especialidad: 'Cortes y degradados' },
      { nombre: 'Fernando', emoji: '💈', especialidad: 'Barba y tratamientos' },
    ],
    servicios: [
      { emoji: '✂️',  nombre: 'Corte de cabello',       precio: 250, min: 30, stats: 'Más solicitado' },
      { emoji: '✂️🪮', nombre: 'Corte + cejas',           precio: 270, min: 40, stats: 'Popular entre semana' },
      { emoji: '✂️💈', nombre: 'Corte y barba',           precio: 370, min: 50, stats: 'Combo estrella' },
      { emoji: '💈',  nombre: 'Corte de barba',          precio: 220, min: 25, stats: 'Alta rotación viernes' },
      { emoji: '💎',  nombre: 'Corte + barba + ceja',    precio: 380, min: 60, stats: 'Top ventas' },
      { emoji: '🥈',  nombre: 'Paquete Silver',           precio: 400, min: 60,
        descripcion: 'Corte + delineado ceja + mascarilla negra + parches colágeno' },
      { emoji: '🥇',  nombre: 'Paquete Gold',             precio: 550, min: 75,
        descripcion: 'Corte + barba + delineado ceja + mascarilla negra + parches colágeno' },
      { emoji: '🪮',  nombre: 'Delineado de ceja',        precio: 80,  min: 15 },
      { emoji: '🖤',  nombre: 'Mascarilla negra',         precio: 90,  min: 20 },
      { emoji: '💧',  nombre: 'Parches de colágeno',      precio: 50,  min: 10 },
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
      '💈 Quiero cita para corte y barba',
      '🥇 ¿Qué incluye el Paquete Gold?',
      '📅 ¿Qué horarios tienen disponibles?',
      '⭐ Mis puntos de lealtad',
    ],
    welcomeMsg:
      '¡Hola! ✂️ Soy el asistente de Barbería El Estilo. Intenta agendar una cita — escribe algo como "quiero una cita mañana" 😊',
    temaOscuro: true,
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
      { nombre: 'Sofia',  emoji: '💅', especialidad: 'Uñas gel y nail art' },
      { nombre: 'Valeria', emoji: '✨', especialidad: 'Acrílicas y diseños' },
    ],
    servicios: [
      { emoji: '💅', nombre: 'Uñas acrílicas',       precio: 350, min: 90, stats: 'Más solicitado' },
      { emoji: '✨', nombre: 'Uñas gel',              precio: 300, min: 75, stats: 'Muy popular' },
      { emoji: '💖', nombre: 'Manicure tradicional', precio: 150, min: 45, stats: 'Incluye hidratación' },
      { emoji: '🦶', nombre: 'Pedicure',              precio: 200, min: 60, stats: 'Completo con exfoliación' },
      { emoji: '🎨', nombre: 'Nail art (diseño)',    precio: 50,  min: 20, descripcion: 'Precio adicional por diseño' },
      { emoji: '🔄', nombre: 'Retoque',               precio: 180, min: 60, stats: 'Aplica en gel y acrílico' },
      { emoji: '🧴', nombre: 'Remoción',              precio: 100, min: 30 },
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
      '💅 Quiero cita para uñas acrílicas',
      '🎨 ¿Cuánto cuesta el nail art?',
      '📅 ¿Qué horarios tienen disponibles?',
      '⭐ Mis puntos de lealtad',
    ],
    welcomeMsg:
      '¡Hola! 💅 Soy la asistente de Nail Studio. Agenda tu cita de uñas — escribe algo como "quiero cita mañana" ✨',
    temaOscuro: false,
  },
};
