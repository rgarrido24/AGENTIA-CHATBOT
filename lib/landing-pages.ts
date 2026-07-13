/** Landings de marketing — slug usado en analytics `demo` y/o prefijo de `page` */
export type LandingPage = {
  slug: string;
  label: string;
  path: string;
  /** Si true, solo cuenta visitas exactas a `path` */
  exact?: boolean;
};

export const LANDING_PAGES: LandingPage[] = [
  { slug: 'home', label: 'Agentia · Home', path: '/', exact: true },
  { slug: 'biovela', label: 'Biovela', path: '/biovela' },
  { slug: 'masa-madre', label: 'Masa Madre · Menú', path: '/demos/masa-madre' },
  { slug: 'lealtad', label: 'Masa Madre · Lealtad', path: '/demos/lealtad' },
  { slug: 'izzi', label: 'Izzi Mérida', path: '/izzi/merida' },
  { slug: 'paycesa', label: 'Paycesa', path: '/paycesa' },
  { slug: 'deco-house', label: 'Deco House', path: '/proyectos/deco-house' },
  { slug: 'luciano-ads', label: 'Luciano Ads', path: '/proyectos/luciano-ads' },
];

export function landingPageFilter(landing: LandingPage) {
  if (landing.exact) {
    return { $or: [{ page: landing.path }, { demo: landing.slug }] };
  }
  const escaped = landing.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    $or: [
      { page: { $regex: `^${escaped}` } },
      { demo: landing.slug },
    ],
  };
}
