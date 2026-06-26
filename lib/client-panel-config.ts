export type FunnelStage =
  | 'pregunton'
  | 'interesado'
  | 'venta_cerrada'
  | 'pedido_enviado'
  | 'entregado';

export const PANEL_FUNNEL_STAGES: { id: FunnelStage; label: string; emoji: string }[] = [
  { id: 'pregunton', label: 'Preguntón', emoji: '🔍' },
  { id: 'interesado', label: 'Interesado', emoji: '🕯' },
  { id: 'venta_cerrada', label: 'Venta cerrada', emoji: '✅' },
  { id: 'pedido_enviado', label: 'Pedido enviado', emoji: '📦' },
  { id: 'entregado', label: 'Entregado', emoji: '🤝' },
];

export const PANEL_TAGS = [
  'mayoreo',
  'menudeo',
  'aromas',
  'ceras',
  'colores',
  'nuevo',
  'recurrente',
] as const;

export type PanelTag = (typeof PANEL_TAGS)[number];

export type ClientPanelBrand = {
  name: string;
  primary: string;
  bg: string;
  success: string;
  text: string;
  border: string;
  radius: string;
  logoUrl: string;
};

export type ClientConfigDoc = {
  clientId: string;
  name?: string;
  logoUrl?: string;
  accent?: string;
};

export function getClientPanelBrand(clientId: string, config?: ClientConfigDoc | null): ClientPanelBrand {
  const accent = config?.accent || '#D4860A';
  const name =
    config?.name ||
    (clientId === 'biovela' ? 'Biovela' : clientId.charAt(0).toUpperCase() + clientId.slice(1));
  const logoUrl =
    config?.logoUrl || (clientId === 'biovela' ? '/logos/biovela.png' : `/logos/${clientId}.png`);

  return {
    name,
    primary: accent,
    bg: '#FAF9F7',
    success: '#2E7D52',
    text: '#1C1A18',
    border: '#E5E0D8',
    radius: '10px',
    logoUrl,
  };
}

export function stageLabel(stage: string): string {
  const found = PANEL_FUNNEL_STAGES.find((s) => s.id === stage);
  return found ? `${found.emoji} ${found.label}` : stage;
}
