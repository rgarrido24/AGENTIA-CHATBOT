export type CatalogProduct = {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
};

export const BIOVELA_CATALOG: CatalogProduct[] = [
  {
    id: 'vela-soja-lavanda',
    name: 'Vela de soja Lavanda',
    price: '$189 MXN',
    image: '/logos/biovela.png',
    category: 'aromas',
  },
  {
    id: 'vela-soja-vainilla',
    name: 'Vela de soja Vainilla',
    price: '$189 MXN',
    image: '/logos/biovela.png',
    category: 'aromas',
  },
  {
    id: 'cera-soja-kg',
    name: 'Cera de soja 1 kg',
    price: '$145 MXN',
    image: '/logos/biovela.png',
    category: 'ceras',
  },
  {
    id: 'cera-soja-5kg',
    name: 'Cera de soja 5 kg (mayoreo)',
    price: '$620 MXN',
    image: '/logos/biovela.png',
    category: 'ceras',
  },
  {
    id: 'colorante-liquido',
    name: 'Colorante líquido premium',
    price: '$95 MXN',
    image: '/logos/biovela.png',
    category: 'colores',
  },
  {
    id: 'kit-iniciacion',
    name: 'Kit iniciación velas',
    price: '$499 MXN',
    image: '/logos/biovela.png',
    category: 'menudeo',
  },
];

export function formatProductMessage(p: CatalogProduct): string {
  return `🕯 *${p.name}*\nPrecio: ${p.price}\n¿Te gustaría cotizar este producto?`;
}
