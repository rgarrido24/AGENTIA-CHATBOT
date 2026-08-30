export const RESTAURANT = {
  name: 'MASA MADRE',
  subtitle: 'restaurante',
  instagram: '@masamadremid',
  facebook: 'Masa Madre Restaurante',
  address: 'C. 49 464, Centro, 97100 Mérida, Yuc.',
  phone: '9999237022',
  whatsapp: '529999237022',
} as const;

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type MenuCategory = {
  id: string;
  label: string;
  image: string;
  items: MenuItem[];
};

const IMG = {
  panaderia: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
  toasts: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&q=80',
  frutas: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80',
  emparedados: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
  clasicos: 'https://images.unsplash.com/photo-1588137374945-4c2c5b5bb5a5?w=800&q=80',
  monchoso: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
  kids: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&q=80',
  extras: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
  cafes: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  tes: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
  jugos: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=800&q=80',
  otros: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80',
  hero: 'https://images.unsplash.com/photo-1608198093002-47d5578147d1?w=1600&q=80',
};

function item(id: string, name: string, description: string, price: number): MenuItem {
  return { id, name, description, price };
}

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'panaderia',
    label: 'La Panadería',
    image: IMG.panaderia,
    items: [
      item('pan-masa-madre', 'Pan de masa madre con mantequilla y mermelada artesanal', 'Corte grueso de pan de fermentación natural, mantequilla y mermelada de temporada.', 127),
      item('ny-roll', 'New York Roll', 'Roll dulce esponjoso con glaseado suave y relleno cremoso.', 87),
      item('croissant-frangipane', 'Croissant con frangipane y almendras', 'Hojaldre crujiente relleno de crema de almendra y almendras tostadas.', 87),
      item('roles-tocino-cheddar', 'Rol especial: Tocino y cheddar', 'Rol artesanal con tocino crujiente y queso cheddar fundido.', 87),
      item('roles-pina-coco', 'Rol especial: Piña y coco', 'Rol dulce con piña caramelizada y coco rallado.', 87),
      item('roles-dulce-leche', 'Rol especial: Dulce de leche y almendra', 'Rol relleno de dulce de leche y almendras fileteadas.', 87),
      item('roles-frutos-rojos', 'Rol especial: Frutos rojos y queso crema', 'Rol con compota de frutos rojos y queso crema suave.', 87),
      item('pan-zanahoria', 'Pan de zanahoria, cardamomo y frosting', 'Bizcocho húmedo con especias cálidas y frosting cremoso.', 47),
      item('pan-elote', 'Pan de elote dorado con mantequilla', 'Pan dulce de elote recién horneado con mantequilla.', 47),
      item('bisquets', 'Bisquets con mantequilla y mermelada', 'Bisquets esponjosos servidos con mantequilla y mermelada.', 87),
      item('muffin-chocolates', 'Muffin: 3 chocolates', 'Muffin con tres tipos de chocolate en cada bocado.', 47),
      item('muffin-blueberries', 'Muffin: Blueberries y queso', 'Muffin con arándanos frescos y queso crema.', 47),
    ],
  },
  {
    id: 'toasts',
    label: 'Los Toasts',
    image: IMG.toasts,
    items: [
      item('toast-salmon', 'Salmón ahumado, queso de oveja, aguacate y honey mustard', 'Pan tostado con salmón ahumado, queso de oveja, aguacate y mostaza miel.', 219),
      item('toast-jamon', 'Jamón serrano, manchego madurado, melón y aguacate', 'Combinación salada y dulce con jamón serrano, manchego, melón y aguacate.', 219),
      item('toast-burrata', 'Burrata, tomates, arúgula y aguacate', 'Burrata cremosa con tomates frescos, arúgula y aguacate.', 229),
      item('toast-gorgonzola', 'Gorgonzola, peras, nueces, arúgula y miel', 'Toast con gorgonzola, peras caramelizadas, nueces, arúgula y miel.', 219),
    ],
  },
  {
    id: 'frutas',
    label: 'Las Frutas',
    image: IMG.frutas,
    items: [
      item('frutas-mixtas', 'Plato de frutas mixtas', 'Selección de frutas de temporada frescas.', 119),
      item('fruta-yogurt', 'Fruta con yogurt, granola y miel', 'Frutas frescas con yogurt, granola crujiente y miel.', 129),
      item('yogurt-granola', 'Yogurt con granola', 'Yogurt natural con granola artesanal.', 89),
      item('parfait', 'Parfait', 'Capas de yogurt, granola y fruta en vaso elegante.', 119),
    ],
  },
  {
    id: 'emparedados',
    label: 'Emparedados',
    image: IMG.emparedados,
    items: [
      item('croque-madame', 'Croque Madame', 'Sándwich gratinado con jamón, queso y huevo estrellado.', 209),
      item('panini-pavo', 'Panini de pavo, salami y queso de bola', 'Panini caliente con pavo, salami y queso de bola.', 189),
      item('panini-veggie', 'Panini veggie, mozzarella, aguacate, tomate y arúgula', 'Panini vegetariano con mozzarella, aguacate, tomate y arúgula.', 189),
      item('ciabatta-serrano', 'Ciabatta de serrano, salami y queso gouda', 'Ciabatta crujiente con jamón serrano, salami y gouda.', 209),
      item('ciabatta-chorizo', 'Ciabatta de jamón, chorizo de pamplona y mozzarella', 'Ciabatta con jamón, chorizo de Pamplona y mozzarella fundida.', 209),
      item('emparedado-brioche', 'Emparedado de jamón y queso en pan brioche', 'Clásico de jamón y queso en pan brioche suave.', 189),
    ],
  },
  {
    id: 'clasicos',
    label: 'Clásicos',
    image: IMG.clasicos,
    items: [
      item('chilaquiles-verdes', 'Chilaquiles verdes con esquites, pollo, queso y crema', 'Totopos en salsa verde con esquites, pollo, queso y crema.', 219),
      item('chilaquiles-rojos', 'Chilaquiles rojos con maíz pozolero, lomo, queso y crema', 'Chilaquiles en salsa roja con maíz pozolero, lomo y crema.', 219),
      item('chilaquiles-mole', 'Chilaquiles de mole', 'Chilaquiles bañados en mole artesanal con queso y crema.', 219),
      item('omelette-chaya', 'Omelette de chaya con queso de bola', 'Omelette esponjoso con chaya y queso de bola.', 189),
      item('omelette-hongos', 'Omelette de hongos y queso de bola', 'Omelette con hongos salteados y queso de bola.', 189),
      item('motulenos', 'Motuleños tradicionales', 'Tres huevos estrellados, plátano macho y habanero.', 189),
      item('huevos-longaniza', 'Huevos con longaniza de Valladolid', 'Huevos al gusto con longaniza artesanal de Valladolid.', 179),
      item('huevos-benedict', 'Huevos Benedict con jamón serrano y pan de masa madre', 'Huevos pochados, jamón serrano y holandesa sobre pan de masa madre.', 219),
      item('quiche-lorraine', 'Quiche Lorraine', 'Quiche clásica con tocino, queso y crema.', 197),
      item('quiche-dia', 'Quiche del día', 'Quiche del día según ingredientes de temporada.', 197),
    ],
  },
  {
    id: 'monchoso',
    label: 'Lo Más Monchoso',
    image: IMG.monchoso,
    items: [
      item('french-brulee', 'French Brûlée', 'Pan francés caramelizado estilo crème brûlée.', 189),
      item('french-tiramisu', 'French Tiramisú', 'Pan francés con crema de mascarpone y café.', 189),
      item('waffles-pollo', 'Waffles con pollo', 'Waffles crujientes con pollo crujiente y salsa.', 219),
      item('hotcakes-pina', 'Hot Cakes de piña y almendras', 'Hot cakes esponjosos con piña y almendras.', 189),
      item('hotcakes-cinnamon', 'Hot Cakes Cinnamon Roll', 'Hot cakes con sabor a rol de canela.', 189),
      item('hotcakes-frutos', 'Hot Cakes con frutos rojos y chantilli', 'Hot cakes con frutos rojos y crema chantilli.', 189),
    ],
  },
  {
    id: 'kids',
    label: 'Kids',
    image: IMG.kids,
    items: [
      item('kids-huevos', 'Huevos con jamón', 'Huevos al gusto con jamón, porción infantil.', 139),
      item('kids-hotcakes', 'Hot Cakes kids', 'Hot cakes esponjosos porción para niños.', 139),
      item('kids-waffles', 'Waffles kids', 'Waffles crujientes porción infantil.', 159),
    ],
  },
  {
    id: 'extras',
    label: 'Extras',
    image: IMG.extras,
    items: [
      item('extra-pollo', 'Pollo', 'Porción extra de pollo.', 55),
      item('extra-papas', 'Papas', 'Porción extra de papas.', 45),
      item('extra-huevo', 'Huevo 2pz', 'Dos huevos extra.', 47),
      item('extra-ensalada', 'Ensalada', 'Porción extra de ensalada.', 55),
      item('extra-tocino', 'Tocino', 'Porción extra de tocino.', 55),
      item('extra-queso', 'Queso de bola', 'Porción extra de queso de bola.', 55),
      item('extra-salami', 'Salami', 'Porción extra de salami.', 55),
      item('extra-aguacate', 'Aguacate', 'Porción extra de aguacate.', 45),
    ],
  },
  {
    id: 'cafes',
    label: 'Cafés',
    image: IMG.cafes,
    items: [
      item('cafe-americano', 'Americano', 'Café de especialidad servido al estilo americano.', 57),
      item('cafe-descafeinado', 'Descafeinado', 'Café descafeinado de especialidad.', 57),
      item('cafe-perfil', 'Perfil', 'Café de origen con perfil de sabor destacado.', 69),
      item('cafe-prensa', 'Prensa Francesa', 'Café preparado en prensa francesa.', 69),
      item('cafe-cappuccino', 'Cappuccino', 'Espresso con leche espumada y equilibrio perfecto.', 69),
      item('cafe-latte', 'Latte', 'Espresso con leche vaporizada y espuma ligera.', 69),
      item('cafe-flat-white', 'Flat White', 'Espresso doble con microespuma sedosa.', 69),
      item('cafe-espresso', 'Espresso', 'Shot de espresso intenso.', 57),
      item('cafe-moka', 'Moka', 'Espresso con chocolate y leche.', 69),
      item('cafe-toffee', 'Toffee', 'Latte con sabor a toffee.', 69),
      item('cafe-cocada', 'Cocada', 'Bebida caliente con sabor a coco.', 69),
      item('cafe-hazelnut', 'Hazelnut', 'Latte con sabor a avellana.', 69),
      item('cafe-vainilla', 'Vainilla', 'Latte con sabor a vainilla.', 69),
      item('cafe-horchata', 'Horchata Express', 'Bebida con notas de horchata y espresso.', 69),
      item('cafe-golden', 'Golden Caramel', 'Latte con caramelo dorado.', 69),
      item('cafe-chocolate', 'Chocolate Francés', 'Chocolate caliente estilo francés.', 69),
    ],
  },
  {
    id: 'tes',
    label: 'Tés',
    image: IMG.tes,
    items: [
      item('te-manzanilla', 'Manzanilla', 'Infusión de manzanilla relajante.', 57),
      item('te-negro', 'Negro', 'Té negro clásico.', 57),
      item('te-hierbabuena', 'Hierbabuena', 'Infusión fresca de hierbabuena.', 57),
      item('te-irish', 'Irish Breakfast', 'Mezcla robusta estilo desayuno irlandés.', 57),
      item('te-infusiones', 'Infusiones', 'Selección de infusiones del día.', 57),
    ],
  },
  {
    id: 'jugos',
    label: 'Jugos & Smoothies',
    image: IMG.jugos,
    items: [
      item('jugo-naranja', 'Jugo de Naranja', 'Jugo recién exprimido de naranja.', 79),
      item('jugo-toronja', 'Toronja', 'Jugo fresco de toronja.', 79),
      item('jugo-verde', 'Verde', 'Jugo verde detox con vegetales y frutas.', 89),
      item('jugo-banana', 'Banana Republic', 'Mezcla tropical de plátano y frutas.', 89),
      item('smoothie-mango', 'Smoothie Mango', 'Smoothie cremoso de mango.', 99),
      item('smoothie-fresa', 'Fresa', 'Smoothie de fresa natural.', 99),
      item('smoothie-pina', 'Piña con Coco', 'Smoothie refrescante de piña y coco.', 99),
      item('smoothie-frutos', 'Frutos Rojos', 'Smoothie de frutos rojos de temporada.', 99),
    ],
  },
  {
    id: 'otros',
    label: 'Otros',
    image: IMG.otros,
    items: [
      item('limonada', 'Limonada', 'Limonada natural refrescante.', 59),
      item('naranjada', 'Naranjada', 'Bebida de naranja natural.', 59),
      item('soda-italiana', 'Sodas Italianas', 'Soda italiana artesanal.', 35),
      item('agua-embotellada', 'Agua Embotellada', 'Agua purificada embotellada.', 35),
      item('agua-mineral', 'Mineral', 'Agua mineral con gas.', 45),
      item('coca-cola', 'Coca Cola', 'Refresco Coca-Cola.', 45),
      item('coca-sin-azucar', 'Sin Azúcar', 'Coca-Cola sin azúcar.', 45),
      item('sprite', 'Sprite', 'Refresco Sprite.', 45),
      item('fanta', 'Fanta', 'Refresco Fanta.', 45),
      item('sidral', 'Sidral', 'Refresco Sidral Mundet.', 45),
    ],
  },
];

export const COVER_IMAGE = IMG.hero;

export const CART_STORAGE_KEY = 'masa-madre-cart';
