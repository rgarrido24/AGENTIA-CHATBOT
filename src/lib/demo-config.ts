export type ServiceConfig = {
  name: string;
  price: string;
  tipo?: string;
  duracionEstimada?: number; // minutos
};

export type DemoBusinessConfig = {
  businessName: string;
  logoUrl: string;
  coverUrl: string;
  address: string;
  mapUrl: string;
  schedule: string;
  capacidadSimultanea: number;
  services: ServiceConfig[];
};

const STORAGE_KEY = 'agentia_demo_business_config';

const DEFAULT_SERVICES: ServiceConfig[] = [
  { name: 'Corte', price: '200', tipo: 'Barbería', duracionEstimada: 30 },
  { name: 'Barba', price: '100', tipo: 'Barbería', duracionEstimada: 20 },
  { name: 'Tinte', price: '850', tipo: 'Estética', duracionEstimada: 120 },
  { name: 'Peinado', price: '450', tipo: 'Estética', duracionEstimada: 60 },
  { name: 'Acrygel', price: '400', tipo: 'Uñas', duracionEstimada: 60 },
  { name: 'Retoque', price: '250', tipo: 'Uñas', duracionEstimada: 45 },
  { name: 'Corte niño', price: '180', tipo: 'Infantil', duracionEstimada: 25 },
];

const DEFAULT_CONFIG: DemoBusinessConfig = {
  businessName: 'Agentia Barber',
  logoUrl: '',
  coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200',
  address: 'Mérida, Yucatán',
  mapUrl: 'https://www.google.com/maps/place/Plaza+Altabrisa,+97130+M%C3%A9rida,+Yuc.',
  schedule: 'Lunes a Sábado 9:00 - 20:00',
  capacidadSimultanea: 1,
  services: DEFAULT_SERVICES,
};

export function getDefaultConfig(): DemoBusinessConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function getStoredConfig(): DemoBusinessConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoBusinessConfig>;
    const merged = { ...getDefaultConfig(), ...parsed };
    if (merged.services && !merged.services.some((s) => s.duracionEstimada != null)) {
      merged.services = merged.services.map((s, i) => ({
        ...s,
        duracionEstimada: DEFAULT_SERVICES[i]?.duracionEstimada ?? 30,
      }));
    }
    return merged;
  } catch {
    return null;
  }
}

export function setStoredConfig(config: Partial<DemoBusinessConfig>): void {
  if (typeof window === 'undefined') return;
  const current = getStoredConfig() || getDefaultConfig();
  const next = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getDuracionMinutos(servicio: string, config: DemoBusinessConfig): number {
  const s = config.services.find(
    (x) => x.name.toLowerCase() === servicio.toLowerCase()
  );
  return s?.duracionEstimada ?? 30;
}
