export type CitaData = {
  clienteNombre: string;
  servicio: string;
  fechaHora: string;
  tipoNegocio: string;
};

export type { LoyaltyCardData } from './LoyaltyCard';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  cita?: CitaData | null;
  showGallery?: boolean;
  isLocation?: boolean;
  loyaltyCard?: import('./LoyaltyCard').LoyaltyCardData;
  createdAt?: number;
};
