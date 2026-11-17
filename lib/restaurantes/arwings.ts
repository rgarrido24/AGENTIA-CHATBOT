/**
 * ARWINGS — config de cliente. Alitas, boneless, hamburguesas, snacks y bebidas.
 * Precios y picor de salsas tomados del menú impreso. Sin datos de ejemplo: nace en producción.
 */
import type { Producto, Salsa } from './tipos';
import type { RestauranteConfig } from './config';

const P = (o: any): Producto => Object.assign({ avail: true, mods: [], desc: '', use: {} }, o);
const uno = (l: string, p: number) => [{ l, p, f: 1, s: 0 }];

/** Alitas y boneless se arman con salsa (el motor muestra el armador de picor). */
const PZ = (id: string, cat: string, name: string, desc: string, emoji: string) =>
  P({ id, cat, name, desc, emoji, station: 'cocina', salsas: true, v: [{ l: '5 pz', p: 70, f: 1, s: 0 }, { l: '10 pz', p: 120, f: 2, s: 1 }] });
const B = (id: string, name: string, p: number, desc = '') => P({ id, cat: 'Bebidas', name, desc, emoji: '🥤', station: 'barra', v: uno('Pieza', p) });
const S = (id: string, name: string, p: number, desc = '', emoji = '🍟') => P({ id, cat: 'Snacks', name, desc, emoji, station: 'cocina', v: uno('Orden', p) });

const MENU: Producto[] = [
  PZ('ali', 'Alitas', 'Alitas', 'Crujientes, bañadas en la salsa que elijas', '🍗'),
  PZ('bon', 'Boneless', 'Boneless', 'Pollo empanizado, bañado en la salsa que elijas', '🍗'),
  P({ id: 'hca', cat: 'Hamburguesas', name: 'Hamburguesa Arrachera', emoji: '🍔', station: 'cocina', v: uno('Pieza', 60) }),
  P({ id: 'hpo', cat: 'Hamburguesas', name: 'Hamburguesa de Pollo', emoji: '🍔', station: 'cocina', v: uno('Pieza', 60) }),
  S('cho', 'Choripan', 70, '', '🌭'),
  S('ddq', '6 Dedos de Queso', 50, '', '🧀'),
  S('nug', '8 Nuggets', 50, '', '🍗'),
  S('pap', 'Papas de la Casa', 50),
  S('chi', '5 Chimichangas', 50, '', '🌯'),
  S('acp', 'Arrachera con Papas', 80, '', '🥩'),
  S('aro', 'Aros de Cebolla', 50, '', '🧅'),
  S('hdj', 'Hot Dog Jumbo', 45, '', '🌭'),
  S('bro', 'Brocheta de Carne', 75, '', '🍢'),
  B('mch', 'Michelada Clásica 1 Lt', 85),
  B('mcu', 'Michelada Cubana', 90),
  B('azu', 'Azulito', 70),
  B('moj', 'Mojito 1 Lt', 70),
  B('mfr', 'Mojito Frutos Rojos', 90),
  B('mma', 'Mojito Mango', 90),
  B('mfe', 'Mojito Fresa', 90),
  B('cle', 'Clericot 1 Lt', 95),
  B('whi', 'Whisky 1 Lt (Red Label)', 120),
  B('cub', 'Cuba Libre', 60),
  B('pal', 'Paloma', 90),
  B('cer', 'Cerveza botella 355 ml', 35),
  B('san', 'Sangría Preparada', 45),
  B('ref', 'Refrescos', 25),
  B('cbt', 'Cubeta (8 cervezas)', 250),
];

/** Picor oficial del menú impreso. */
const SALSAS: Salsa[] = [
  { id: 'hab', nombre: 'Habanero', picor: 5 },
  { id: 'mhb', nombre: 'Mango Habanero', picor: 4 },
  { id: 'pip', nombre: "Pipo's Wings", picor: 3 },
  { id: 'taj', nombre: 'Tajín', picor: 3 },
  { id: 'pel', nombre: 'Pelón Pelo Rico', picor: 3 },
  { id: 'caj', nombre: 'Cajún', picor: 3 },
  { id: 'buf', nombre: 'Buffalo', picor: 3 },
  { id: 'bbq', nombre: 'BBQ', picor: 2 },
  { id: 'ori', nombre: 'Original', picor: 2 },
  { id: 'lem', nombre: 'Lemon Pepper', picor: 2 },
  { id: 'tam', nombre: 'Tamarindo', picor: 2 },
];

const FRIT = '#F2B544';
const ARTE: Record<string, string> = {
  /* muslito de alita: carne + hueso con dos nudos */
  Alitas:
    '<path d="M25 36L10 51" stroke-width="7" stroke="#F3E6D3"/><path d="M25 36L10 51" stroke-width="3"/><circle cx="8" cy="49" r="5" fill="#F3E6D3"/><circle cx="13" cy="55" r="5" fill="#F3E6D3"/><path d="M36 7c12 0 21 8 21 19 0 10-8 17-18 18-5 1-9 0-12-3L22 33c-3-3-4-7-3-11C21 12 28 7 36 7z" fill="#E8791C"/><path d="M33 14c6-2 12 1 14 6M30 22c4-1 8 0 11 3" stroke="#FFC928" stroke-width="2.5" opacity=".75"/><path d="M44 36c3-2 6-5 7-9" stroke="#E32216" stroke-width="3" opacity=".7"/>',
  /* boneless: tres piezas empanizadas con salsa */
  Boneless:
    '<path d="M6 38c-2-8 4-15 12-15 3-5 11-5 15 0 8 0 13 7 10 15-3 8-12 9-18 8-8 1-17-1-19-8z" fill="#D9892A"/><path d="M30 24c3-6 12-6 15 0 8 0 13 6 11 14-2 7-9 9-15 8-7 2-16 0-17-7-1-5 2-10 6-15z" fill="#E59A35"/><circle cx="16" cy="32" r="1.6" fill="#8a4b10" stroke="none"/><circle cx="24" cy="38" r="1.6" fill="#8a4b10" stroke="none"/><circle cx="42" cy="33" r="1.6" fill="#8a4b10" stroke="none"/><circle cx="48" cy="40" r="1.6" fill="#8a4b10" stroke="none"/><path d="M14 22c4 6 10 8 16 6 6-2 10-8 18-9" stroke="#E32216" stroke-width="4" opacity=".9"/>',
  Hamburguesas:
    '<path d="M9 28a23 19 0 0 1 46 0z" fill="#E8A24A"/><circle cx="22" cy="21" r="1.4" fill="#F6E3B4" stroke="none"/><circle cx="32" cy="17" r="1.4" fill="#F6E3B4" stroke="none"/><circle cx="42" cy="21" r="1.4" fill="#F6E3B4" stroke="none"/><path d="M7 31h50l-4 5H11z" fill="#8CC152"/><path d="M8 38h48l-4 5H12z" fill="#FFC928"/><rect x="10" y="43" width="44" height="8" rx="4" fill="#7A4A2B"/><path d="M12 53h40a4 4 0 0 1-4 7H16a4 4 0 0 1-4-7z" fill="#E8A24A"/>',
  Snacks:
    '<rect x="17" y="10" width="6" height="26" fill="#F5D45E"/><rect x="26" y="6" width="6" height="30" fill="#F5D45E"/><rect x="35" y="10" width="6" height="26" fill="#F5D45E"/><rect x="43" y="14" width="5" height="22" fill="#F5D45E"/><path d="M14 32h36l-4 26H18z" fill="#E32216"/>',
  Bebidas:
    '<path d="M18 10h28l-4 46a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="#FFC928"/><path d="M20 24h24" stroke-width="3"/><path d="M36 4l4 14" stroke-width="3"/><circle cx="29" cy="38" r="3" fill="#fff"/><circle cx="36" cy="46" r="2.5" fill="#fff"/>',
  /* hot dog y choripan */
  cho:
    '<rect x="5" y="30" width="54" height="20" rx="10" fill="#E8A24A"/><rect x="3" y="24" width="58" height="12" rx="6" fill="#C0392B"/><path d="M9 30l5-4 5 4 5-4 5 4 5-4 5 4 5-4 5 4" stroke="#FFC928" stroke-width="3" fill="none"/>',
  hdj:
    '<rect x="5" y="30" width="54" height="20" rx="10" fill="#E8A24A"/><rect x="3" y="24" width="58" height="12" rx="6" fill="#C0392B"/><path d="M9 30l5-4 5 4 5-4 5 4 5-4 5 4 5-4 5 4 5-4 5 4" stroke="#FFC928" stroke-width="3" fill="none"/>',
  nug:
    '<path d="M8 34c-2-8 4-14 12-13 4-5 12-4 14 2 7-1 11 5 9 12-2 6-9 8-15 7-7 1-18 0-20-8z" fill="' + FRIT + '"/><path d="M34 40c-1-6 3-11 9-11 5-2 11 2 10 8 1 6-3 11-9 11-6 1-10-2-10-8z" fill="#E59A35"/><circle cx="18" cy="31" r="1.5" fill="#8a4b10" stroke="none"/><circle cx="26" cy="37" r="1.5" fill="#8a4b10" stroke="none"/><circle cx="45" cy="38" r="1.5" fill="#8a4b10" stroke="none"/>',
  ddq:
    '<rect x="10" y="14" width="14" height="34" rx="6" transform="rotate(-12 17 31)" fill="' + FRIT + '"/><rect x="26" y="10" width="14" height="36" rx="6" fill="' + FRIT + '"/><rect x="42" y="14" width="14" height="34" rx="6" transform="rotate(12 49 31)" fill="' + FRIT + '"/><path d="M33 46c-2 6 2 10-1 13M17 44c-2 5 1 8-1 11" stroke="#FFC928" stroke-width="4"/>',
  chi:
    '<rect x="8" y="26" width="42" height="18" rx="9" transform="rotate(-18 29 35)" fill="' + FRIT + '"/><rect x="14" y="36" width="42" height="18" rx="9" transform="rotate(-18 35 45)" fill="#E59A35"/><path d="M22 33l8-3M28 47l8-3" stroke="#8a4b10" stroke-width="2.5" opacity=".6"/>',
  aro:
    '<ellipse cx="26" cy="34" rx="18" ry="14" fill="' + FRIT + '"/><ellipse cx="26" cy="34" rx="8" ry="6" fill="#141414"/><ellipse cx="40" cy="26" rx="15" ry="11" fill="#E59A35"/><ellipse cx="40" cy="26" rx="6.5" ry="4.5" fill="#141414"/>',
  bro:
    '<path d="M6 52L58 12" stroke-width="3"/><rect x="14" y="30" width="12" height="12" rx="3" transform="rotate(-38 20 36)" fill="#8B4A2B"/><rect x="26" y="22" width="12" height="12" rx="3" transform="rotate(-38 32 28)" fill="#C0392B"/><rect x="38" y="14" width="12" height="12" rx="3" transform="rotate(-38 44 20)" fill="#8B4A2B"/>',
  acp:
    '<rect x="38" y="10" width="5" height="22" fill="#F5D45E"/><rect x="46" y="14" width="5" height="18" fill="#F5D45E"/><path d="M6 40c0-9 8-15 19-15 12 0 22 6 22 15s-10 15-23 15C13 55 6 49 6 40z" fill="#8B4A2B"/><path d="M14 38c6-4 14-4 22 0M16 46c8 3 16 2 22-2" stroke="#4a2410" stroke-width="2.5" opacity=".6"/>',
  cer:
    '<path d="M26 4h12v12l5 8v32a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4V24l5-8z" fill="#3B8F3B"/><rect x="22" y="32" width="20" height="14" fill="#FFC928"/><rect x="26" y="4" width="12" height="5" fill="#C9A24A"/>',
  cbt:
    '<path d="M10 34h44l-5 24H15z" fill="#A5A5A5"/><path d="M10 34h44" stroke-width="4"/><rect x="18" y="8" width="8" height="26" rx="2" fill="#3B8F3B"/><rect x="30" y="4" width="8" height="30" rx="2" fill="#3B8F3B"/><rect x="42" y="10" width="8" height="24" rx="2" fill="#3B8F3B"/>',
};

export const ARWINGS: RestauranteConfig = {
  slug: 'arwings',
  ruta: '/arwings',
  api: '/api/restaurante/arwings',
  lsPrefix: 'arw_',
  marca: {
    nombre: 'Arwings',
    nombreMayus: 'ARWINGS',
    tagline: 'El sabor tiene alas',
    descripcion: 'Pide alitas, boneless, hamburguesas y snacks de Arwings. Acumula saldo en cada pedido.',
    logo: '/arwings/logo.jpg',
    logoAlt: 'Arwings, el sabor tiene alas',
    logoW: 764,
    logoH: 701,
    mark: '/arwings/mark.webp',
    markAlt: 'Bulldog de Arwings con alas de fuego',
    markW: 430,
    markH: 400,
    icono192: '/arwings/icon-192.png',
    icono512: '/arwings/icon-512.png',
    iconoMaskable: '/arwings/icon-maskable-512.png',
    iconoApple: '/arwings/apple-touch-icon.png',
    themeColor: '#080808',
    themeColorEquipo: '#080808',
    fondoManifest: '#080808',
    tema: 'th-arwings',
    impresion: { fondo: '#141414', top: '#FF7000', topTxt: '#080808', tinta: '#F4F1EA', pagina: '#080808' },
    trazo: '#080808',
    splash: {
      lineas: ['EL SABOR', 'TIENE ALAS'],
      sub: 'Alitas, boneless y más. Pide a domicilio o para llevar.',
      boton: 'ORDENAR AHORA',
      efecto: 'brasas',
      img: { src: '/arwings/logo.jpg', w: 764, h: 701, alt: 'Arwings, el sabor tiene alas' },
    },
  },
  textos: {
    buscar: 'Busca alitas, boneless, papas…',
    consulta: 'Pide por WhatsApp',
    premioEjemplo: 'unas alitas gratis',
    ejemploReceta: 'alitas 5 pz = 5 piezas de pollo (5 pza) y 1 porción de salsa (0.05 l).',
    ejemploUnidad: '50 g de papa se captura como 0.05 (kg).',
    mesasTxt: 'en cada mesa',
  },
  contacto: {
    whatsapp: '525561159340',
    whatsappVista: '55 6115 9340',
    facebook: '@Arwings',
    facebookUrl: 'https://www.facebook.com/Arwings',
    domicilio: 'Servicio a domicilio',
  },
  pago: 'contraentrega',
  produccion: true,
  categorias: ['Alitas', 'Boneless', 'Hamburguesas', 'Snacks', 'Bebidas'],
  colores: { Alitas: '#FF7000', Boneless: '#E32216', Hamburguesas: '#FFC928', Snacks: '#A5A5A5', Bebidas: '#F2F2F2' },
  menu: MENU,
  insumos: [],
  mesas: Array.from({ length: 8 }, (_, i) => ({ k: 'm' + (i + 1), label: 'Mesa ' + (i + 1), tipo: 'mesa' })),
  maridaje: {
    Alitas: ['Snacks', 'Bebidas'],
    Boneless: ['Bebidas', 'Snacks'],
    Hamburguesas: ['Snacks', 'Bebidas'],
    Snacks: ['Bebidas'],
    Bebidas: ['Alitas', 'Snacks'],
  },
  maridajeTxt: {
    Alitas: 'Con papas y algo bien frío',
    Boneless: 'Acompáñalas con algo bien frío',
    Hamburguesas: 'Con papas y refresco',
    Snacks: 'Qué rico con una bebida',
    Bebidas: 'Combínala con unas alitas',
  },
  pares: {
    ali: ['pap', 'ref'],
    bon: ['pap', 'ref'],
    hca: ['pap', 'ref'],
    hpo: ['pap', 'ref'],
  },
  rapidas: {
    Alitas: 'Salsa aparte, Extra crujientes, Bien bañadas, Con limón',
    Boneless: 'Salsa aparte, Extra crujientes, Bien bañados, Con limón',
    Hamburguesas: 'Sin cebolla, Sin jitomate, Sin mayonesa, Sin chile',
    Snacks: 'Salsa aparte, Con limón, Sin chile',
    Bebidas: 'Sin hielo, Poco hielo, Con limón',
  },
  ajustes: { pedLlevar: true, pedEntrega: true, pedMesa: false, aprobar: true, envio: 0, dosSabores: false },
  arte: ARTE,
  armador: {
    productos: ['ali', 'bon'],
    kicker: 'ARMA TU PEDIDO',
    titulo: 'Elige tu fuego',
    paso1: 'Tamaño',
    paso2: 'Salsa',
    paso3: 'Segunda salsa (opcional)',
  },
  salsas: SALSAS,
  etiquetas: ['Más vendido', 'Favorito', 'Nuevo', 'Recomendado'],
  niveles: ['Suave', 'Suavecito', 'Medio', 'Picoso', 'Extra fuego'],
};
