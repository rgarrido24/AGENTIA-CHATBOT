export type CitaData = {
  clienteNombre: string;
  servicio: string;
  fechaHora: string;
  tipoNegocio: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  cita?: CitaData | null;
  showGallery?: boolean;
  isLocation?: boolean;
  createdAt?: number;
};
