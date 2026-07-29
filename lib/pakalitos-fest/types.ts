export type Tutor = {
  id: string;
  nombre: string;
  telefono: string;
  membresiaActiva: boolean;
  horasRestantes: number;
  /** Horas de servicio entregadas hacia lealtad (10h → 1h gratis) */
  horasLealtad: number;
  hijosNombres: string[];
};

export type NinoActivo = {
  sessionId: string;
  ninoNombre: string;
  tutorId: string;
  checkInAt: number;
  conNinera: boolean;
};

export type SesionCerrada = {
  sessionId: string;
  ninoNombre: string;
  tutorId: string;
  tutorNombre: string;
  checkInAt: number;
  checkOutAt: number;
  minutosJugados: number;
  horasCobradas: number;
  conNinera: boolean;
  modoCobro: 'membresia' | 'efectivo';
  montoCobrado: number;
  horasDescontadas: number;
  /** Horas gratis de lealtad otorgadas en este cierre */
  horasPremioLealtad: number;
};

export type DiaCaja = {
  sesiones: SesionCerrada[];
  recargasMembresia: { tutorId: string; paquete: string; monto: number; at: number }[];
};

/** Lista de precios vigente Pakalitos Fest */
export const PRICE_TIERS = [
  { hours: 1, solo: 100, ninera: 170 },
  { hours: 2, solo: 180, ninera: 300 },
  { hours: 3, solo: 260, ninera: 450 },
] as const;

/** Valor de referencia 1h (para excedente >3h y valor de membresía) */
export const RATE_1H_SOLO = 100;
export const RATE_1H_NINERA = 170;

export const LOYALTY_EVERY_HOURS = 10;
export const LOYALTY_REWARD_HOURS = 1;

export const PACKAGES = [
  { id: 'pkg10', label: 'Paquete 10 horas', horas: 10, precio: 800 },
] as const;
