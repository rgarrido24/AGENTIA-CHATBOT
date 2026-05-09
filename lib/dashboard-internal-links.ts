/**
 * Enlaces internos para el dashboard de Agentia (landings, demos, activos de marketing).
 * Solo uso operativo: que el equipo tenga las rutas a la mano.
 */

export type InternalLinkItem = {
  href: string;
  label: string;
  hint?: string;
};

export type InternalLinkSection = {
  title: string;
  items: InternalLinkItem[];
};

export const INTERNAL_DASHBOARD_LINKS: InternalLinkSection[] = [
  {
    title: 'Landings y páginas públicas',
    items: [
      { href: '/', label: 'Landing principal (agentia.software)' },
      { href: '/ready', label: 'Ready (landing corta)' },
      { href: '/book', label: 'Agenda / book' },
      { href: '/contratar/luciano', label: 'Contratar — Luciano' },
      { href: '/contratar/decohouse', label: 'Contratar — Deco House' },
    ],
  },
  {
    title: 'Portales (ejemplos)',
    items: [
      {
        href: '/portal/luciano/brief',
        label: 'Brief digital — Luciano',
        hint: 'Formulario + links públicos /brief/[token]',
      },
      {
        href: '/portal/luciano/dashboard',
        label: 'Portal reseller — Luciano (dashboard)',
      },
      {
        href: '/portal/luciano/cliente/antonio-campetella',
        label: 'Panel cliente — Antonio Campetella',
      },
    ],
  },
  {
    title: 'Demos por industria (home del demo)',
    items: [
      { href: '/demo/barber', label: 'Barbería' },
      { href: '/demo/restaurante', label: 'Restaurante' },
      { href: '/demo/spa', label: 'Spa' },
      { href: '/demo/nutricion', label: 'Nutrición' },
      { href: '/demo/dentista', label: 'Dentista' },
      { href: '/demo/medico', label: 'Médico' },
      { href: '/demo/taller', label: 'Taller' },
      { href: '/demo/grooming', label: 'Grooming' },
      { href: '/demo/cobranza', label: 'Cobranza / academia' },
    ],
  },
  {
    title: 'Demos y casos especiales',
    items: [
      { href: '/demo/esmeralda-breeze', label: 'Hotel (Esmeralda Breeze)' },
      { href: '/demo/deco-house', label: 'Deco House — panel / cotizador' },
      { href: '/demo/deco-house/bridge', label: 'Deco House — bridge (requiere login demo)' },
      { href: '/demo/vidrieria', label: 'Vidriería (mock Deco)' },
      { href: '/demo/tortas-barra', label: 'Tortas barra' },
      { href: '/demo-luciano', label: 'Redirect → panel Antonio (demo Luciano)' },
      {
        href: '/demo/fotos-escuela',
        label: 'Fotos escolares — kinder (anuario + fiesta)',
        hint: 'Demo estática con 2 sub-demos: anuario.html y fiesta.html',
      },
      {
        href: '/demo-fotos-escuela/anuario.html',
        label: 'Fotos escolares — Anuario digital (HTML directo)',
      },
      {
        href: '/demo-fotos-escuela/fiesta.html',
        label: 'Fotos escolares — Fiesta de kinder (HTML directo)',
      },
    ],
  },
  {
    title: 'Activos estáticos (reels HTML)',
    items: [
      { href: '/reel-demo.html', label: 'Reel demo (barbería / WhatsApp)' },
      { href: '/reel-nutricion.html', label: 'Reel nutrición' },
    ],
  },
  {
    title: 'Dashboard interno',
    items: [
      {
        href: '/brief',
        label: 'Cuestionario de diagnóstico tecnológico',
        hint: 'Requiere login admin; guarda en project_briefs',
      },
      {
        href: '/dashboard/demos-internos',
        label: 'Demos internos (página legacy)',
        hint: 'Rutas que no están en el menú público',
      },
    ],
  },
];
