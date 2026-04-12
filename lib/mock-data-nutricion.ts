/** Demo NutriVida — datos ficticios para /demo/nutricion */

export const BRAND_NUTRICION = {
  centro: 'NutriVida — Centro de Nutrición y Bienestar',
  doctora: 'Dra. Andrea Morales',
  tagline: 'Tu transformación, paso a paso',
  nutriologaNombre: 'Dra. Andrea Morales',
} as const;

export type PacienteObjetivo = 'Bajar peso' | 'Ganar músculo' | 'Mantenimiento' | 'Salud general';
export type PacienteStatus = 'activo' | 'pausado' | 'objetivo_logrado';
export type PacienteNivel = 'Inicio' | 'En progreso' | 'Avanzado' | 'Objetivo logrado';

export type Paciente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  edad: number;
  sexo: 'M' | 'F';
  objetivo: PacienteObjetivo;
  fechaInicio: string;
  status: PacienteStatus;
  nutriologa: string;
  motivacion: string;
  diasSinRegistro: number;
  nivel: PacienteNivel;
  /** Meta de peso corporal (kg) — UI */
  pesoMetaKg: number;
};

export type MedicionInBody = {
  id: string;
  pacienteId: string;
  fecha: string;
  peso: number;
  grasaCorporal: number;
  masaMuscular: number;
  grasaVisceral: number;
  aguaCorporal: number;
  edadMetabolica: number;
  IMC: number;
  pesoIdeal: number;
  fotoTicket?: string;
};

export type Receta = {
  id: string;
  nombre: string;
  descripcion: string;
  tiempoPrep: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  ingredientes: string[];
  preparacion: string[];
  foto?: string;
  equivalentesSMAE: string;
  tags: string[];
};

export type TiempoComidaDia = {
  nombre: 'Desayuno' | 'Colación AM' | 'Comida' | 'Merienda' | 'Cena';
  emoji: string;
  hora: string;
  calorias: number;
  recetas: Receta[];
};

export type DiaMenu = {
  dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  totalCalorias: number;
  tiempos: TiempoComidaDia[];
};

export type DietaActual = {
  id: string;
  pacienteId: string;
  fechaAsignacion: string;
  nombre: string;
  contenido?: string;
  semana?: DiaMenu[];
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  restricciones: string[];
  alimentos_permitidos: string[];
  alimentos_prohibidos: string[];
};

export type Logro = {
  id: string;
  pacienteId: string;
  fecha: string;
  tipo: 'peso' | 'medida' | 'habito' | 'semanas' | 'especial';
  descripcion: string;
  emoji: string;
};

export type RecordatorioConfig = {
  pacienteId: string;
  activo: boolean;
  diasSemana: number[];
  hora: string;
  mensajePersonalizado: string;
};

export type CitaNutricion = {
  id: string;
  pacienteId: string;
  fecha: string;
  hora: string;
  motivo: string;
};

export type PlanDietaId = 'plan-a' | 'plan-b' | 'plan-c';

const ALIMENTOS_PERMITIDOS_A = [
  'Pechuga de pollo', 'Pescado blanco', 'Huevo', 'Yogurt griego natural', 'Avena integral',
  'Arroz integral', 'Pasta integral', 'Frijol cocido', 'Lenteja', 'Verduras de hoja verde',
  'Calabaza', 'Jitomate', 'Pepino', 'Manzana', 'Pera', 'Fresa', 'Almendras', 'Semillas de chía',
  'Aguacate (porción)', 'Pan integral',
];

const ALIMENTOS_PROHIBIDOS_A = [
  'Refrescos', 'Jugos industriales', 'Frituras', 'Pan blanco', 'Dulces y chocolates',
  'Botanas saladas', 'Embutidos', 'Quesos grasos', 'Cremas', 'Salsas azucaradas',
];

const CONTENIDO_PLAN_A = `
PLAN DE ALIMENTACIÓN — 1,400 kcal/día

DESAYUNO (7:00 AM):
- 2 equivalentes de cereal sin grasa
  (ej: 2 tortillas de maíz o 2 rebanadas pan integral)
- 1 equivalente de proteína de origen animal bajo en grasa
  (ej: 30g pollo cocido, 1 clara de huevo, 30g atún al natural)
- 1 equivalente de fruta
  (ej: 1 manzana mediana, 1 taza de fresas, 1 pera)
- 1 equivalente de leche descremada

COLACIÓN AM (10:00 AM):
- 1 equivalente de fruta
- 1 equivalente de proteína vegetal (leguminosa)
  (ej: 1/2 taza frijoles cocidos, 1/2 taza lentejas)

COMIDA (2:00 PM):
- 3 equivalentes de cereal sin grasa
  (ej: 3 tortillas de maíz o 3/4 taza arroz integral cocido)
- 2 equivalentes de proteína de origen animal bajo en grasa
  (ej: 60g pechuga de pollo, 60g pescado blanco)
- 2 equivalentes de verdura
  (ej: 1 taza ensalada mixta + 1/2 taza calabaza cocida)
- 1 equivalente de grasa sin proteína
  (ej: 1 cdta aceite de oliva o 1/8 aguacate)

COLACIÓN PM (5:00 PM):
- 1 equivalente de fruta
- 1 equivalente de leche descremada

CENA (8:00 PM):
- 2 equivalentes de cereal sin grasa
- 1 equivalente de proteína de origen animal
  (ej: 30g atún al natural, 1 huevo entero)
- 2 equivalentes de verdura

Hidratación: 2–2.5 L agua simple al día. Evitar alcohol.
`.trim();

const ALIMENTOS_PERMITIDOS_B = [
  'Salmón', 'Atún', 'Pechuga', 'Carne magra', 'Claras de huevo', 'Yogurt griego', 'Queso cottage',
  'Avena', 'Arroz', 'Papa al horno', 'Camote', 'Brócoli', 'Espinaca', 'Pasta integral',
  'Plátano', 'Arándanos', 'Pasta de maní natural', 'Nueces', 'Aceite de oliva', 'Quinoa',
];

const ALIMENTOS_PROHIBIDOS_B = [
  'Azúcares añadidos', 'Harinas refinadas', 'Comida rápida', 'Embutidos grasos', 'Helados',
  'Galletas dulces', 'Cereales azucarados', 'Bebidas energéticas', 'Alcohol', 'Exceso de frituras',
];

const CONTENIDO_PLAN_B = `
PLAN DE ALIMENTACIÓN — 1,600 kcal/día

DESAYUNO (7:00 AM):
- 3 equivalentes de cereal sin grasa
  (ej: 3/4 taza avena cocida o 3 rebanadas pan integral)
- 2 equivalentes de proteína de origen animal bajo en grasa
  (ej: 2 claras de huevo + 30g queso cottage)
- 1 equivalente de fruta
  (ej: 1 plátano pequeño, 1 taza arándanos)
- 1 equivalente de leche semidescremada

COLACIÓN AM (10:00 AM):
- 1 equivalente de fruta
- 1 equivalente de proteína de origen animal
  (ej: 30g pechuga, 1 huevo cocido)

COMIDA (2:00 PM):
- 4 equivalentes de cereal sin grasa
  (ej: 1 taza arroz integral cocido + 1 tortilla)
- 3 equivalentes de proteína de origen animal bajo en grasa
  (ej: 90g pechuga de pollo o 90g salmón)
- 2 equivalentes de verdura
- 1 equivalente de grasa sin proteína
  (ej: 1/4 aguacate o 1 cdta aceite de oliva)

COLACIÓN PM (5:00 PM):
- 1 equivalente de fruta
- 1 equivalente de leche semidescremada
- 1 equivalente de grasa con proteína
  (ej: 10 almendras o 15g nueces)

CENA (8:00 PM):
- 2 equivalentes de cereal sin grasa
- 2 equivalentes de proteína de origen animal
  (ej: 60g pescado blanco, 60g atún al natural)
- 2 equivalentes de verdura
- 1 equivalente de grasa sin proteína

Priorizar proteína en cada comida; hidratar 2.5–3 L/día.
`.trim();

const ALIMENTOS_PERMITIDOS_C = [
  'Pollo', 'Pavo', 'Pescado', 'Huevo entero', 'Leguminosas', 'Arroz integral', 'Pasta integral',
  'Pan integral', 'Verduras variadas', 'Fruta de temporada', 'Lácteos bajos en grasa',
  'Aceites vegetales', 'Frutos secos en porción', 'Semillas', 'Cottage', 'Yogurt natural',
  'Quinoa', 'Avena', 'Tortilla de maíz', 'Aguacate moderado', 'Chocolate >70% (porción)',
];

const ALIMENTOS_PROHIBIDOS_C = [
  'Exceso de ultraprocesados', 'Bebidas azucaradas', 'Frituras diarias', 'Cremas industriales',
  'Salsas embotelladas azucaradas', 'Botanas saladas en exceso', 'Alcohol frecuente',
  'Pan blanco habitual', 'Postres diarios', 'Comida rápida',
];

const CONTENIDO_PLAN_C = `
PLAN DE ALIMENTACIÓN — 1,800 kcal/día

DESAYUNO (7:00 AM):
- 3 equivalentes de cereal sin grasa
  (ej: 2 rebanadas pan integral + 1/3 taza avena)
- 2 equivalentes de proteína de origen animal
  (ej: 2 huevos enteros o 1 huevo + 30g queso panela)
- 1 equivalente de fruta
- 1 equivalente de leche entera o semidescremada

COLACIÓN AM (10:00 AM):
- 1 equivalente de fruta
- 1 equivalente de grasa con proteína
  (ej: 15g nueces, 10 almendras, 1 cda mantequilla de maní natural)

COMIDA (2:00 PM):
- 4 equivalentes de cereal sin grasa
  (ej: 1 taza arroz integral + 2 tortillas de maíz)
- 3 equivalentes de proteína de origen animal moderado
  (ej: 90g pollo, 90g pavo, 90g pescado)
- 2 equivalentes de verdura
  (ej: 1 taza ensalada + 1/2 taza verduras cocidas)
- 1 equivalente de leguminosa
  (ej: 1/2 taza frijoles o lentejas cocidas)
- 1 equivalente de grasa sin proteína
  (ej: 1/4 aguacate o 1 cdta aceite de oliva)

COLACIÓN PM (5:00 PM):
- 1 equivalente de fruta
- 1 equivalente de leche descremada o natural

CENA (8:00 PM):
- 2 equivalentes de cereal sin grasa
  (ej: 2 tortillas de maíz o 1/2 taza arroz integral)
- 2 equivalentes de proteína de origen animal
  (ej: 60g pollo, 60g atún, 2 claras de huevo)
- 2 equivalentes de verdura

Mantener 3 comidas + 2 colaciones; ajustar porciones por actividad física.
`.trim();

// ═══════════════════════════════════════════════════════
// BANCO DE RECETAS MEXICANAS SALUDABLES
// ═══════════════════════════════════════════════════════

// DESAYUNOS
const rQuesadillasPavo: Receta = {
  id: 'r-d1', nombre: 'Quesadillas de pechuga de pavo',
  descripcion: 'Tortillas de maíz con pechuga de pavo ahumada, espinacas y aguacate.',
  tiempoPrep: 10, calorias: 340, proteinas: 28, carbohidratos: 32, grasas: 10,
  ingredientes: ['2 tortillas de maíz', '90 g pechuga de pavo ahumada', 'Espinacas al gusto', '⅓ aguacate en rebanadas'],
  preparacion: ['Calienta las tortillas en comal sin aceite', 'Coloca la pechuga y espinacas', 'Dobla y calienta 2 min por lado', 'Sirve con aguacate'],
  equivalentesSMAE: '2 cereales sin grasa + 3 proteína AOA bajo + 1 grasa',
  tags: ['mexicana', 'alta proteína'],
};
const rHuevosRancheros: Receta = {
  id: 'r-d2', nombre: 'Huevos rancheros light',
  descripcion: 'Huevos sobre tortillas tostadas con salsa roja casera y cilantro.',
  tiempoPrep: 15, calorias: 310, proteinas: 18, carbohidratos: 28, grasas: 12,
  ingredientes: ['2 tortillas de maíz tostadas', '2 claras + 1 huevo entero', '3 cdas salsa roja casera', 'Cilantro al gusto'],
  preparacion: ['Tueste las tortillas en comal', 'Cocine los huevos al gusto con aceite spray', 'Calienta la salsa', 'Arme: tortilla → huevo → salsa → cilantro'],
  equivalentesSMAE: '2 cereales sin grasa + 1½ proteína AOA bajo',
  tags: ['mexicana', 'clásica'],
};
const rAvenaFruta: Receta = {
  id: 'r-d3', nombre: 'Avena con fruta y canela',
  descripcion: 'Avena cocida en leche descremada con plátano y canela.',
  tiempoPrep: 8, calorias: 280, proteinas: 12, carbohidratos: 44, grasas: 5,
  ingredientes: ['½ taza avena en hojuelas', '1 taza leche descremada', '½ plátano en rodajas', 'Canela al gusto'],
  preparacion: ['Cuece la avena en leche a fuego medio', 'Mueve constantemente 5 min', 'Agrega plátano y canela', 'Sirve caliente'],
  equivalentesSMAE: '2 cereales sin grasa + 1 leche descremada + 1 fruta',
  tags: ['rápida', 'alta fibra'],
};
const rChilaquilesVerdes: Receta = {
  id: 'r-d4', nombre: 'Chilaquiles verdes fit',
  descripcion: 'Totopos horneados bañados en salsa verde con pechuga deshebrada.',
  tiempoPrep: 15, calorias: 365, proteinas: 22, carbohidratos: 40, grasas: 12,
  ingredientes: ['6 totopos horneados (40 g)', '60 g pechuga cocida deshebrada', '½ taza salsa verde', '1 cda crema light', 'Cilantro'],
  preparacion: ['Calienta la salsa verde en sartén', 'Agrega los totopos y mezcla rápido', 'Añade la pechuga deshebrada', 'Sirve con crema y cilantro'],
  equivalentesSMAE: '2 cereales sin grasa + 2 proteína AOA bajo + 1 grasa',
  tags: ['mexicana', 'alta proteína'],
};
const rMolleteFrijol: Receta = {
  id: 'r-d5', nombre: 'Molletes de frijol con pico de gallo',
  descripcion: 'Bolillo integral con frijoles refritos, queso panela y pico de gallo fresco.',
  tiempoPrep: 10, calorias: 320, proteinas: 14, carbohidratos: 45, grasas: 8,
  ingredientes: ['1 bolillo integral partido', '3 cdas frijoles refritos sin grasa', '40 g queso panela', '2 cdas pico de gallo'],
  preparacion: ['Tueste el bolillo en comal', 'Unta los frijoles generosamente', 'Agrega el queso panela', 'Hornea 5 min y sirve con pico de gallo'],
  equivalentesSMAE: '2 cereales sin grasa + 1 leguminosa + 1 proteína AOA bajo',
  tags: ['mexicana', 'vegetariana'],
};
const rOmeletteNopales: Receta = {
  id: 'r-d6', nombre: 'Omelette de claras con nopales',
  descripcion: 'Omelette esponjoso de claras con nopales salteados y cebolla.',
  tiempoPrep: 12, calorias: 260, proteinas: 20, carbohidratos: 12, grasas: 14,
  ingredientes: ['3 claras + 1 huevo entero', '½ taza nopales cocidos en cubos', '2 cdas cebolla picada', 'Sal y pimienta', 'Aceite spray'],
  preparacion: ['Saltea nopales y cebolla con aceite spray 4 min', 'Bate los huevos y vierte en sartén', 'Añade los nopales al centro', 'Dobla y cocina 1 min más'],
  equivalentesSMAE: '1½ proteína AOA bajo + 1 verdura + 1 grasa',
  tags: ['mexicana', 'alta proteína', 'rápida'],
};

// COLACIONES
const rJicamaChile: Receta = {
  id: 'r-c1', nombre: 'Jícama con chile y limón',
  descripcion: 'Jícama fresca en bastones con limón, chile en polvo y sal.',
  tiempoPrep: 5, calorias: 65, proteinas: 1, carbohidratos: 14, grasas: 0,
  ingredientes: ['1 taza jícama en bastones', 'Jugo de 1 limón', 'Chile en polvo al gusto', 'Sal al gusto'],
  preparacion: ['Pela y corta la jícama en bastones', 'Rocía con limón y sal', 'Espolvorea chile en polvo', 'Sirve frío'],
  equivalentesSMAE: '1 fruta',
  tags: ['rápida', 'mexicana', 'bajo en calorías'],
};
const rManzanaCacahuate: Receta = {
  id: 'r-c2', nombre: 'Manzana con cacahuate natural',
  descripcion: 'Rebanadas de manzana con mantequilla de cacahuate natural.',
  tiempoPrep: 3, calorias: 155, proteinas: 4, carbohidratos: 22, grasas: 7,
  ingredientes: ['1 manzana mediana', '1 cda mantequilla de cacahuate natural (15 g)'],
  preparacion: ['Lava y rebana la manzana', 'Unta con mantequilla de cacahuate', 'Sirve inmediatamente'],
  equivalentesSMAE: '1 fruta + 1 grasa con proteína',
  tags: ['rápida', 'alta fibra'],
};
const rYogurtGranola: Receta = {
  id: 'r-c3', nombre: 'Yogurt griego con granola',
  descripcion: 'Yogurt griego natural con granola light y fresas frescas.',
  tiempoPrep: 3, calorias: 140, proteinas: 12, carbohidratos: 16, grasas: 3,
  ingredientes: ['150 g yogurt griego natural sin azúcar', '20 g granola light', '½ taza fresas rebanadas'],
  preparacion: ['Sirve el yogurt en tazón', 'Agrega la granola encima', 'Decora con fresas'],
  equivalentesSMAE: '1 leche descremada + 1 cereal sin grasa + 1 fruta',
  tags: ['rápida', 'alta proteína'],
};
const rPepinHummus: Receta = {
  id: 'r-c4', nombre: 'Pepino con hummus',
  descripcion: 'Rodajas de pepino fresco con hummus casero y pimentón.',
  tiempoPrep: 5, calorias: 90, proteinas: 3, carbohidratos: 10, grasas: 4,
  ingredientes: ['1 pepino mediano en rodajas', '3 cdas hummus (45 g)', 'Pimentón al gusto'],
  preparacion: ['Rebana el pepino en rodajas gruesas', 'Sirve con hummus al lado', 'Espolvorea pimentón'],
  equivalentesSMAE: '1 verdura + 1 grasa',
  tags: ['rápida', 'vegetariana'],
};
const rPlatanoAlmendras: Receta = {
  id: 'r-c5', nombre: 'Plátano con almendras',
  descripcion: 'Plátano dominico acompañado de almendras naturales.',
  tiempoPrep: 2, calorias: 160, proteinas: 4, carbohidratos: 26, grasas: 6,
  ingredientes: ['1 plátano dominico (100 g)', '10 almendras naturales (15 g)'],
  preparacion: ['Pela el plátano', 'Acompaña con almendras', 'Opcional: espolvorea canela'],
  equivalentesSMAE: '1 fruta + 1 grasa con proteína',
  tags: ['rápida', 'potasio'],
};

// COMIDAS
const rFideoPollo: Receta = {
  id: 'r-co1', nombre: 'Sopa de fideo seco con pollo',
  descripcion: 'Fideo tostado guisado en salsa de jitomate con pechuga de pollo.',
  tiempoPrep: 20, calorias: 430, proteinas: 28, carbohidratos: 52, grasas: 10,
  ingredientes: ['½ taza fideo delgado', '120 g pechuga de pollo cocida', '2 jitomates guaje', '½ cebolla', '1 diente ajo', '1 taza caldo de pollo bajo en sodio'],
  preparacion: ['Tuesta el fideo en sartén con aceite spray', 'Licúa jitomate, cebolla y ajo', 'Vierte la salsa sobre el fideo', 'Agrega caldo y pollo, cocina 12 min tapado'],
  equivalentesSMAE: '3 cereales sin grasa + 4 proteína AOA bajo + 1 verdura',
  tags: ['mexicana', 'alta proteína'],
};
const rArrozCalabacita: Receta = {
  id: 'r-co2', nombre: 'Arroz rojo con calabacitas y pollo',
  descripcion: 'Arroz integral guisado con pollo en tiras, calabacita y chícharos.',
  tiempoPrep: 25, calorias: 450, proteinas: 30, carbohidratos: 55, grasas: 10,
  ingredientes: ['½ taza arroz integral', '120 g pechuga en tiras', '1 calabacita en cubos', '½ taza chícharos', '1 jitomate picado', 'Caldo de pollo'],
  preparacion: ['Sofríe pollo y verduras 5 min', 'Agrega arroz y caldo (1:2)', 'Cocina tapado 20 min a fuego bajo', 'Destapa y esponja con tenedor'],
  equivalentesSMAE: '3 cereales sin grasa + 4 proteína AOA bajo + 2 verduras',
  tags: ['mexicana', 'alta proteína', 'completo'],
};
const rLentejasChorizoPavo: Receta = {
  id: 'r-co3', nombre: 'Lentejas guisadas con chorizo de pavo',
  descripcion: 'Lentejas cocidas con chorizo de pavo, jitomate y especias.',
  tiempoPrep: 20, calorias: 415, proteinas: 28, carbohidratos: 50, grasas: 8,
  ingredientes: ['½ taza lentejas cocidas', '60 g chorizo de pavo', '1 jitomate', '¼ cebolla', '1 diente ajo', '2 tortillas de maíz'],
  preparacion: ['Sofríe chorizo de pavo 3 min', 'Agrega jitomate, cebolla y ajo picados', 'Incorpora las lentejas con caldo', 'Hierve 10 min; sirve con tortillas'],
  equivalentesSMAE: '2 leguminosas + 2 proteína AOA med + 2 cereales sin grasa',
  tags: ['mexicana', 'alta proteína'],
};
const rTacosPickadillo: Receta = {
  id: 'r-co4', nombre: 'Tacos de picadillo',
  descripcion: 'Picadillo de res magra con papa, chícharos y jitomate en tortillas de maíz.',
  tiempoPrep: 20, calorias: 440, proteinas: 26, carbohidratos: 46, grasas: 14,
  ingredientes: ['120 g carne molida de res magra', '2 papas chicas en cubos', '½ taza chícharos', '1 jitomate picado', '3 tortillas de maíz'],
  preparacion: ['Cuece papa al vapor 8 min', 'Sofríe la carne hasta dorar', 'Agrega papa, chícharos y jitomate', 'Cocina 5 min; sirve en tortillas'],
  equivalentesSMAE: '3 cereales sin grasa + 3 proteína AOA mod + 1 verdura',
  tags: ['mexicana', 'clásica'],
};
const rCaldoTalpeno: Receta = {
  id: 'r-co5', nombre: 'Caldo tlalpeño',
  descripcion: 'Caldo de pollo con garbanzo, chipotle y epazote. Reconfortante y nutritivo.',
  tiempoPrep: 25, calorias: 390, proteinas: 30, carbohidratos: 35, grasas: 10,
  ingredientes: ['120 g pechuga de pollo', '½ taza garbanzos cocidos', '1 chile chipotle (opcional)', 'Epazote al gusto', '1 zanahoria', 'Ejotes', 'Caldo de pollo'],
  preparacion: ['Hierve el pollo con verduras 20 min', 'Agrega garbanzos y chipotle', 'Sazona con epazote y sal', 'Sirve caliente con limón'],
  equivalentesSMAE: '4 proteína AOA bajo + 1 leguminosa + 2 verduras',
  tags: ['mexicana', 'alta fibra'],
};
const rPozoleRojoFit: Receta = {
  id: 'r-co6', nombre: 'Pozole rojo fit',
  descripcion: 'Pozole con lomo magro, maíz pozolero y toppings frescos. Sin piel ni exceso de grasa.',
  tiempoPrep: 35, calorias: 420, proteinas: 32, carbohidratos: 48, grasas: 8,
  ingredientes: ['120 g lomo de cerdo magro', '½ taza maíz pozolero cocido', '2 chiles guajillo', 'Lechuga, cebolla, orégano', '2 tostadas horneadas'],
  preparacion: ['Tuesta y remoja chiles 15 min', 'Licúa chiles con ajo y caldo', 'Hierve lomo, agrega maíz y salsa', 'Sazona y sirve con toppings'],
  equivalentesSMAE: '4 proteína AOA bajo + 2 cereales sin grasa + 1 verdura',
  tags: ['mexicana', 'clásica'],
};
const rEnchiladasVerdes: Receta = {
  id: 'r-co7', nombre: 'Enchiladas verdes light',
  descripcion: 'Enchiladas de pechuga deshebrada bañadas en salsa verde con crema light.',
  tiempoPrep: 20, calorias: 455, proteinas: 26, carbohidratos: 50, grasas: 14,
  ingredientes: ['3 tortillas de maíz', '90 g pechuga deshebrada', '½ taza salsa verde', '2 cdas crema light', '20 g queso panela'],
  preparacion: ['Calienta tortillas y rellena con pechuga', 'Enrolla y coloca en refractario', 'Baña con salsa verde caliente', 'Agrega crema y queso, calienta 5 min'],
  equivalentesSMAE: '3 cereales sin grasa + 3 proteína AOA bajo + 1 grasa',
  tags: ['mexicana', 'clásica'],
};

// CENAS
const rSopaVerduras: Receta = {
  id: 'r-cn1', nombre: 'Sopa de verduras con tostadas',
  descripcion: 'Sopa de zanahoria, chayote y ejotes con tostadas horneadas.',
  tiempoPrep: 15, calorias: 280, proteinas: 10, carbohidratos: 38, grasas: 8,
  ingredientes: ['1 taza verduras mixtas (zanahoria, chayote, ejotes)', '1 taza caldo de pollo', '2 tostadas horneadas', 'Limón y sal'],
  preparacion: ['Hierve verduras en caldo 15 min', 'Sazona con sal y comino', 'Sirve con tostadas y limón'],
  equivalentesSMAE: '1 cereal sin grasa + 2 verduras',
  tags: ['ligera', 'mexicana', 'rápida'],
};
const rTacosEjotesHuevo: Receta = {
  id: 'r-cn2', nombre: 'Tacos de ejotes con huevo',
  descripcion: 'Ejotes salteados con huevo revuelto, servidos en tortillas de maíz.',
  tiempoPrep: 12, calorias: 295, proteinas: 18, carbohidratos: 30, grasas: 10,
  ingredientes: ['1 taza ejotes en trozos', '2 huevos enteros', '3 tortillas de maíz', '1 jitomate picado', 'Aceite spray'],
  preparacion: ['Saltea ejotes 5 min con aceite spray', 'Bate huevos y agrega a los ejotes', 'Mezcla hasta cuajar', 'Sirve en tortillas con jitomate'],
  equivalentesSMAE: '2 cereales sin grasa + 2 proteína AOA bajo + 1 verdura',
  tags: ['mexicana', 'vegetariana', 'rápida'],
};
const rQuesadillasRequeson: Receta = {
  id: 'r-cn3', nombre: 'Quesadillas de requesón',
  descripcion: 'Tortillas rellenas de requesón fresco con epazote y salsa verde.',
  tiempoPrep: 10, calorias: 315, proteinas: 16, carbohidratos: 34, grasas: 12,
  ingredientes: ['3 tortillas de maíz', '90 g requesón', 'Epazote picado al gusto', 'Salsa verde al gusto'],
  preparacion: ['Unta requesón sobre tortillas', 'Agrega epazote', 'Dobla y calienta en comal 2 min cada lado', 'Sirve con salsa verde'],
  equivalentesSMAE: '2 cereales sin grasa + 1½ proteína AOA bajo',
  tags: ['mexicana', 'vegetariana'],
};
const rEnsaladaNopalesAtun: Receta = {
  id: 'r-cn4', nombre: 'Ensalada de nopales con atún',
  descripcion: 'Nopales cocidos con atún al natural, jitomate, cebolla morada y limón.',
  tiempoPrep: 10, calorias: 265, proteinas: 22, carbohidratos: 18, grasas: 10,
  ingredientes: ['1 taza nopales cocidos en tiras', '90 g atún al natural', '1 jitomate en cubos', '½ cebolla morada', 'Cilantro', 'Limón + 1 cda aceite de oliva'],
  preparacion: ['Mezcla nopales con atún escurrido', 'Agrega jitomate y cebolla morada', 'Adereza con limón y aceite de oliva', 'Espolvorea cilantro fresco'],
  equivalentesSMAE: '3 proteína AOA bajo + 2 verduras + 1 grasa',
  tags: ['mexicana', 'alta proteína', 'sin gluten'],
};
const rCremaCalabaZa: Receta = {
  id: 'r-cn5', nombre: 'Crema de calabaza',
  descripcion: 'Crema suave de calabaza italiana con toque de nuez moscada y aceite de oliva.',
  tiempoPrep: 18, calorias: 245, proteinas: 8, carbohidratos: 32, grasas: 8,
  ingredientes: ['2 tazas calabaza italiana picada', '½ taza caldo de pollo', '¼ taza leche descremada', '1 cda aceite de oliva', 'Nuez moscada'],
  preparacion: ['Cuece calabaza en caldo 12 min', 'Licúa con leche hasta suavizar', 'Regresa al fuego y sazona', 'Sirve con hilo de aceite de oliva'],
  equivalentesSMAE: '2 verduras + 1 grasa + ½ leche descremada',
  tags: ['ligera', 'vegetariana'],
};
const rSopaLima: Receta = {
  id: 'r-cn6', nombre: 'Sopa de lima con tostadas',
  descripcion: 'Caldo yucateco de pollo con lima, chile, cebolla morada y tostadas horneadas.',
  tiempoPrep: 20, calorias: 310, proteinas: 24, carbohidratos: 28, grasas: 10,
  ingredientes: ['120 g pechuga deshebrada', '1 taza caldo de pollo', 'Jugo de 2 limas', '½ cebolla morada', 'Cilantro', '2 tostadas horneadas'],
  preparacion: ['Hierve caldo con pechuga 15 min', 'Deshebra el pollo y devuelve al caldo', 'Agrega jugo de lima y cebolla', 'Sirve con cilantro y tostadas'],
  equivalentesSMAE: '3 proteína AOA bajo + 1 cereal sin grasa + 1 grasa',
  tags: ['mexicana', 'alta proteína'],
};

export const BANCO_RECETAS: Receta[] = [
  rQuesadillasPavo, rHuevosRancheros, rAvenaFruta, rChilaquilesVerdes, rMolleteFrijol, rOmeletteNopales,
  rJicamaChile, rManzanaCacahuate, rYogurtGranola, rPepinHummus, rPlatanoAlmendras,
  rFideoPollo, rArrozCalabacita, rLentejasChorizoPavo, rTacosPickadillo, rCaldoTalpeno, rPozoleRojoFit, rEnchiladasVerdes,
  rSopaVerduras, rTacosEjotesHuevo, rQuesadillasRequeson, rEnsaladaNopalesAtun, rCremaCalabaZa, rSopaLima,
];

const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'] as const;

function buildDia(
  dia: DiaMenu['dia'],
  kcalTotal: number,
  desayunos: Receta[],
  colaciones: Receta[],
  comidas: Receta[],
  meriendas: Receta[],
  cenas: Receta[],
  kcals: [number,number,number,number,number]
): DiaMenu {
  return {
    dia, totalCalorias: kcalTotal,
    tiempos: [
      { nombre: 'Desayuno', emoji: '🌅', hora: '7:00 AM', calorias: kcals[0], recetas: desayunos },
      { nombre: 'Colación AM', emoji: '🍎', hora: '10:00 AM', calorias: kcals[1], recetas: colaciones },
      { nombre: 'Comida', emoji: '🍽️', hora: '2:00 PM', calorias: kcals[2], recetas: comidas },
      { nombre: 'Merienda', emoji: '🥤', hora: '5:00 PM', calorias: kcals[3], recetas: meriendas },
      { nombre: 'Cena', emoji: '🌙', hora: '8:00 PM', calorias: kcals[4], recetas: cenas },
    ],
  };
}

function buildSemanaA(): DiaMenu[] {
  const kcals: [number,number,number,number,number] = [300,120,500,120,360];
  const t = kcals.reduce((a,b)=>a+b,0);
  return [
    buildDia('Lunes',   t, [rAvenaFruta,rOmeletteNopales],   [rJicamaChile,rPepinHummus],      [rCaldoTalpeno,rFideoPollo],        [rYogurtGranola,rJicamaChile],    [rEnsaladaNopalesAtun,rSopaVerduras], kcals),
    buildDia('Martes',  t, [rHuevosRancheros,rMolleteFrijol], [rManzanaCacahuate,rPepinHummus],  [rLentejasChorizoPavo,rCaldoTalpeno],[rJicamaChile,rYogurtGranola],    [rTacosEjotesHuevo,rCremaCalabaZa],   kcals),
    buildDia('Miércoles',t,[rQuesadillasPavo,rAvenaFruta],    [rPepinHummus,rJicamaChile],       [rFideoPollo,rEnchiladasVerdes],     [rYogurtGranola,rManzanaCacahuate],[rQuesadillasRequeson,rSopaLima],     kcals),
    buildDia('Jueves',  t, [rOmeletteNopales,rChilaquilesVerdes],[rJicamaChile,rYogurtGranola],  [rTacosPickadillo,rPozoleRojoFit],   [rPepinHummus,rJicamaChile],      [rSopaVerduras,rEnsaladaNopalesAtun], kcals),
    buildDia('Viernes', t, [rAvenaFruta,rHuevosRancheros],    [rYogurtGranola,rPepinHummus],     [rArrozCalabacita,rCaldoTalpeno],    [rManzanaCacahuate,rJicamaChile], [rCremaCalabaZa,rTacosEjotesHuevo],   kcals),
    buildDia('Sábado',  t, [rChilaquilesVerdes,rMolleteFrijol],[rPlatanoAlmendras,rJicamaChile], [rPozoleRojoFit,rLentejasChorizoPavo],[rYogurtGranola,rPepinHummus],   [rSopaLima,rQuesadillasRequeson],     kcals),
    buildDia('Domingo', t, [rQuesadillasPavo,rOmeletteNopales],[rManzanaCacahuate,rYogurtGranola],[rEnchiladasVerdes,rArrozCalabacita],[rJicamaChile,rPlatanoAlmendras],[rEnsaladaNopalesAtun,rCremaCalabaZa],kcals),
  ];
}

function buildSemanaB(): DiaMenu[] {
  const kcals: [number,number,number,number,number] = [380,150,560,150,360];
  const t = kcals.reduce((a,b)=>a+b,0);
  return [
    buildDia('Lunes',   t, [rChilaquilesVerdes,rQuesadillasPavo], [rManzanaCacahuate,rPlatanoAlmendras],[rArrozCalabacita,rCaldoTalpeno],    [rYogurtGranola,rManzanaCacahuate],[rSopaLima,rEnsaladaNopalesAtun],    kcals),
    buildDia('Martes',  t, [rHuevosRancheros,rOmeletteNopales],   [rPlatanoAlmendras,rYogurtGranola],  [rPozoleRojoFit,rFideoPollo],         [rManzanaCacahuate,rPepinHummus],  [rQuesadillasRequeson,rTacosEjotesHuevo],kcals),
    buildDia('Miércoles',t,[rAvenaFruta,rChilaquilesVerdes],       [rYogurtGranola,rPlatanoAlmendras],  [rEnchiladasVerdes,rLentejasChorizoPavo],[rPepinHummus,rJicamaChile],     [rCremaCalabaZa,rSopaVerduras],      kcals),
    buildDia('Jueves',  t, [rQuesadillasPavo,rMolleteFrijol],      [rManzanaCacahuate,rYogurtGranola], [rTacosPickadillo,rArrozCalabacita],   [rPlatanoAlmendras,rManzanaCacahuate],[rSopaLima,rEnsaladaNopalesAtun],  kcals),
    buildDia('Viernes', t, [rOmeletteNopales,rAvenaFruta],         [rPlatanoAlmendras,rPepinHummus],   [rCaldoTalpeno,rPozoleRojoFit],        [rYogurtGranola,rManzanaCacahuate],[rTacosEjotesHuevo,rQuesadillasRequeson],kcals),
    buildDia('Sábado',  t, [rChilaquilesVerdes,rHuevosRancheros],  [rYogurtGranola,rPlatanoAlmendras], [rFideoPollo,rEnchiladasVerdes],        [rManzanaCacahuate,rPlatanoAlmendras],[rSopaVerduras,rSopaLima],        kcals),
    buildDia('Domingo', t, [rQuesadillasPavo,rAvenaFruta],         [rPlatanoAlmendras,rManzanaCacahuate],[rArrozCalabacita,rTacosPickadillo], [rPepinHummus,rYogurtGranola],    [rEnsaladaNopalesAtun,rCremaCalabaZa],kcals),
  ];
}

function buildSemanaC(): DiaMenu[] {
  const kcals: [number,number,number,number,number] = [420,180,600,180,420];
  const t = kcals.reduce((a,b)=>a+b,0);
  return [
    buildDia('Lunes',   t, [rChilaquilesVerdes,rMolleteFrijol],   [rPlatanoAlmendras,rManzanaCacahuate],[rArrozCalabacita,rEnchiladasVerdes],[rYogurtGranola,rPlatanoAlmendras],[rSopaLima,rEnsaladaNopalesAtun],    kcals),
    buildDia('Martes',  t, [rQuesadillasPavo,rOmeletteNopales],   [rManzanaCacahuate,rYogurtGranola],  [rPozoleRojoFit,rLentejasChorizoPavo],[rPlatanoAlmendras,rManzanaCacahuate],[rQuesadillasRequeson,rSopaVerduras],kcals),
    buildDia('Miércoles',t,[rAvenaFruta,rHuevosRancheros],         [rYogurtGranola,rPlatanoAlmendras],  [rTacosPickadillo,rCaldoTalpeno],     [rManzanaCacahuate,rPepinHummus],  [rCremaCalabaZa,rTacosEjotesHuevo],  kcals),
    buildDia('Jueves',  t, [rChilaquilesVerdes,rQuesadillasPavo],  [rPlatanoAlmendras,rManzanaCacahuate],[rFideoPollo,rArrozCalabacita],      [rYogurtGranola,rPlatanoAlmendras],[rSopaLima,rEnsaladaNopalesAtun],    kcals),
    buildDia('Viernes', t, [rMolleteFrijol,rOmeletteNopales],      [rManzanaCacahuate,rYogurtGranola], [rEnchiladasVerdes,rPozoleRojoFit],   [rPlatanoAlmendras,rPepinHummus],  [rSopaVerduras,rQuesadillasRequeson],kcals),
    buildDia('Sábado',  t, [rAvenaFruta,rChilaquilesVerdes],       [rYogurtGranola,rPlatanoAlmendras], [rLentejasChorizoPavo,rTacosPickadillo],[rManzanaCacahuate,rPlatanoAlmendras],[rCremaCalabaZa,rSopaLima],       kcals),
    buildDia('Domingo', t, [rQuesadillasPavo,rHuevosRancheros],    [rPlatanoAlmendras,rManzanaCacahuate],[rArrozCalabacita,rCaldoTalpeno],   [rPepinHummus,rYogurtGranola],    [rEnsaladaNopalesAtun,rTacosEjotesHuevo],kcals),
  ];
}

export const PLANES_DIETA: Record<
  PlanDietaId,
  Omit<DietaActual, 'id' | 'pacienteId' | 'fechaAsignacion'>
> = {
  'plan-a': {
    nombre: 'Plan hipocalórico moderado',
    semana: buildSemanaA(),
    calorias: 1400,
    proteinas: 95,
    carbohidratos: 140,
    grasas: 45,
    restricciones: ['Control de porciones', 'Sin frituras'],
    alimentos_permitidos: ALIMENTOS_PERMITIDOS_A,
    alimentos_prohibidos: ALIMENTOS_PROHIBIDOS_A,
  },
  'plan-b': {
    nombre: 'Plan proteico (ganancia muscular)',
    semana: buildSemanaB(),
    calorias: 1600,
    proteinas: 140,
    carbohidratos: 160,
    grasas: 55,
    restricciones: ['Alto en proteína', 'Ajustar a días de entreno'],
    alimentos_permitidos: ALIMENTOS_PERMITIDOS_B,
    alimentos_prohibidos: ALIMENTOS_PROHIBIDOS_B,
  },
  'plan-c': {
    nombre: 'Plan de mantenimiento equilibrado',
    semana: buildSemanaC(),
    calorias: 1800,
    proteinas: 120,
    carbohidratos: 190,
    grasas: 60,
    restricciones: ['Equilibrio macronutrientes'],
    alimentos_permitidos: ALIMENTOS_PERMITIDOS_C,
    alimentos_prohibidos: ALIMENTOS_PROHIBIDOS_C,
  },
};

/** Asignación plan → paciente (20 filas) */
export const PACIENTE_PLAN: Record<string, PlanDietaId> = {
  p01: 'plan-a',
  p02: 'plan-b',
  p03: 'plan-a',
  p04: 'plan-c',
  p05: 'plan-a',
  p06: 'plan-b',
  p07: 'plan-c',
  p08: 'plan-a',
  p09: 'plan-b',
  p10: 'plan-c',
  p11: 'plan-a',
  p12: 'plan-b',
  p13: 'plan-c',
  p14: 'plan-a',
  p15: 'plan-b',
  p16: 'plan-c',
  p17: 'plan-a',
  p18: 'plan-b',
  p19: 'plan-c',
  p20: 'plan-a',
};

export const MOCK_PACIENTES: Paciente[] = [
  {
    id: 'p01',
    nombre: 'María González',
    telefono: '+52 55 1001 0001',
    email: 'maria.gonzalez@email.com',
    fechaNacimiento: '1990-04-12',
    edad: 35,
    sexo: 'F',
    objetivo: 'Bajar peso',
    fechaInicio: '2026-01-15',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Quiero verme bien en mi boda en diciembre',
    diasSinRegistro: 2,
    nivel: 'En progreso',
    pesoMetaKg: 65,
  },
  {
    id: 'p02',
    nombre: 'Roberto Martínez',
    telefono: '+52 55 1002 0002',
    email: 'roberto.m@email.com',
    fechaNacimiento: '1988-07-22',
    edad: 37,
    sexo: 'M',
    objetivo: 'Ganar músculo',
    fechaInicio: '2026-01-08',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Subir mis lípidos sanos y rendir en el gym',
    diasSinRegistro: 5,
    nivel: 'Avanzado',
    pesoMetaKg: 82,
  },
  {
    id: 'p03',
    nombre: 'Ana López',
    telefono: '+52 55 1003 0003',
    email: 'ana.lopez@email.com',
    fechaNacimiento: '1992-11-03',
    edad: 33,
    sexo: 'F',
    objetivo: 'Bajar peso',
    fechaInicio: '2026-01-20',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Llegar a mi peso ideal antes del verano',
    diasSinRegistro: 1,
    nivel: 'Avanzado',
    pesoMetaKg: 58,
  },
  {
    id: 'p04',
    nombre: 'Carlos Ruiz',
    telefono: '+52 55 1004 0004',
    email: 'carlos.ruiz@email.com',
    fechaNacimiento: '1985-02-18',
    edad: 41,
    sexo: 'M',
    objetivo: 'Mantenimiento',
    fechaInicio: '2026-02-01',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Mantener lo logrado tras bajar 8kg',
    diasSinRegistro: 3,
    nivel: 'En progreso',
    pesoMetaKg: 78,
  },
  {
    id: 'p05',
    nombre: 'Laura Fernández',
    telefono: '+52 55 1005 0005',
    email: 'laura.f@email.com',
    fechaNacimiento: '1995-09-30',
    edad: 30,
    sexo: 'F',
    objetivo: 'Bajar peso',
    fechaInicio: '2026-02-10',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Mejorar energía y sueño',
    diasSinRegistro: 0,
    nivel: 'En progreso',
    pesoMetaKg: 62,
  },
  {
    id: 'p06',
    nombre: 'Diego Herrera',
    telefono: '+52 55 1006 0006',
    email: 'diego.h@email.com',
    fechaNacimiento: '1991-05-14',
    edad: 34,
    sexo: 'M',
    objetivo: 'Ganar músculo',
    fechaInicio: '2026-01-25',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Competencia de fuerza en abril',
    diasSinRegistro: 4,
    nivel: 'En progreso',
    pesoMetaKg: 85,
  },
  {
    id: 'p07',
    nombre: 'Patricia Soto',
    telefono: '+52 55 1007 0007',
    email: 'patricia.soto@email.com',
    fechaNacimiento: '1987-12-01',
    edad: 38,
    sexo: 'F',
    objetivo: 'Salud general',
    fechaInicio: '2026-02-15',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Cuidar glucosa familiar',
    diasSinRegistro: 2,
    nivel: 'En progreso',
    pesoMetaKg: 68,
  },
  {
    id: 'p08',
    nombre: 'Fernando Castro',
    telefono: '+52 55 1008 0008',
    email: 'fernando.c@email.com',
    fechaNacimiento: '1983-03-25',
    edad: 42,
    sexo: 'M',
    objetivo: 'Bajar peso',
    fechaInicio: '2026-01-05',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Bajar grasa visceral por salud cardiovascular',
    diasSinRegistro: 6,
    nivel: 'Avanzado',
    pesoMetaKg: 80,
  },
  {
    id: 'p09',
    nombre: 'Sofía Ramírez',
    telefono: '+52 55 1009 0009',
    email: 'sofia.r@email.com',
    fechaNacimiento: '1994-08-08',
    edad: 31,
    sexo: 'F',
    objetivo: 'Ganar músculo',
    fechaInicio: '2026-02-20',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Tonificar brazos y espalda',
    diasSinRegistro: 1,
    nivel: 'Inicio',
    pesoMetaKg: 60,
  },
  {
    id: 'p10',
    nombre: 'Javier Núñez',
    telefono: '+52 55 1010 0010',
    email: 'javier.n@email.com',
    fechaNacimiento: '1989-01-17',
    edad: 37,
    sexo: 'M',
    objetivo: 'Mantenimiento',
    fechaInicio: '2026-02-28',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'No recuperar el peso perdido',
    diasSinRegistro: 2,
    nivel: 'Inicio',
    pesoMetaKg: 76,
  },
  {
    id: 'p11',
    nombre: 'Valeria Cruz',
    telefono: '+52 55 1011 0011',
    email: 'valeria.c@email.com',
    fechaNacimiento: '1996-06-21',
    edad: 29,
    sexo: 'F',
    objetivo: 'Bajar peso',
    fechaInicio: '2026-03-01',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Sentirme ligera para correr 5k',
    diasSinRegistro: 8,
    nivel: 'Inicio',
    pesoMetaKg: 59,
  },
  {
    id: 'p12',
    nombre: 'Miguel Ángel Torres',
    telefono: '+52 55 1012 0012',
    email: 'miguel.t@email.com',
    fechaNacimiento: '1986-10-10',
    edad: 39,
    sexo: 'M',
    objetivo: 'Ganar músculo',
    fechaInicio: '2026-03-05',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Primera vez con nutrióloga, quiero estructura',
    diasSinRegistro: 9,
    nivel: 'Inicio',
    pesoMetaKg: 88,
  },
  {
    id: 'p13',
    nombre: 'Gabriela Mora',
    telefono: '+52 55 1013 0013',
    email: 'gabriela.m@email.com',
    fechaNacimiento: '1993-02-28',
    edad: 33,
    sexo: 'F',
    objetivo: 'Salud general',
    fechaInicio: '2026-03-08',
    status: 'activo',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Mejorar hábitos post-embarazo',
    diasSinRegistro: 10,
    nivel: 'Inicio',
    pesoMetaKg: 64,
  },
  {
    id: 'p14',
    nombre: 'Ricardo Vega',
    telefono: '+52 55 1014 0014',
    email: 'ricardo.v@email.com',
    fechaNacimiento: '1984-04-05',
    edad: 41,
    sexo: 'M',
    objetivo: 'Bajar peso',
    fechaInicio: '2026-02-28',
    status: 'pausado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Empezó fuerte; pausa laboral temporal',
    diasSinRegistro: 11,
    nivel: 'Inicio',
    pesoMetaKg: 92,
  },
  {
    id: 'p15',
    nombre: 'Lucía Mendoza',
    telefono: '+52 55 1015 0015',
    email: 'lucia.m@email.com',
    fechaNacimiento: '1990-12-12',
    edad: 35,
    sexo: 'F',
    objetivo: 'Ganar músculo',
    fechaInicio: '2026-01-12',
    status: 'pausado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Viaje de trabajo pausó rutina',
    diasSinRegistro: 12,
    nivel: 'En progreso',
    pesoMetaKg: 57,
  },
  {
    id: 'p16',
    nombre: 'Héctor Delgado',
    telefono: '+52 55 1016 0016',
    email: 'hector.d@email.com',
    fechaNacimiento: '1982-08-19',
    edad: 43,
    sexo: 'M',
    objetivo: 'Bajar peso',
    fechaInicio: '2025-11-20',
    status: 'pausado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Bajar presión con peso',
    diasSinRegistro: 18,
    nivel: 'Avanzado',
    pesoMetaKg: 84,
  },
  {
    id: 'p17',
    nombre: 'Natalia Ortega',
    telefono: '+52 55 1017 0017',
    email: 'natalia.o@email.com',
    fechaNacimiento: '1997-01-09',
    edad: 29,
    sexo: 'F',
    objetivo: 'Salud general',
    fechaInicio: '2026-02-18',
    status: 'pausado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Estrés laboral — retomar en abril',
    diasSinRegistro: 9,
    nivel: 'Inicio',
    pesoMetaKg: 63,
  },
  {
    id: 'p18',
    nombre: 'Oscar Pineda',
    telefono: '+52 55 1018 0018',
    email: 'oscar.p@email.com',
    fechaNacimiento: '1980-05-27',
    edad: 45,
    sexo: 'M',
    objetivo: 'Mantenimiento',
    fechaInicio: '2025-09-10',
    status: 'objetivo_logrado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Mantengo peso tras recuperarme de la rodilla',
    diasSinRegistro: 14,
    nivel: 'Objetivo logrado',
    pesoMetaKg: 79,
  },
  {
    id: 'p19',
    nombre: 'Claudia Reyes',
    telefono: '+52 55 1019 0019',
    email: 'claudia.r@email.com',
    fechaNacimiento: '1988-03-03',
    edad: 38,
    sexo: 'F',
    objetivo: 'Bajar peso',
    fechaInicio: '2025-09-01',
    status: 'objetivo_logrado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Llegué a mi meta de 58kg',
    diasSinRegistro: 4,
    nivel: 'Objetivo logrado',
    pesoMetaKg: 58,
  },
  {
    id: 'p20',
    nombre: 'Andrés Ibarra',
    telefono: '+52 55 1020 0020',
    email: 'andres.i@email.com',
    fechaNacimiento: '1991-11-15',
    edad: 34,
    sexo: 'M',
    objetivo: 'Ganar músculo',
    fechaInicio: '2025-10-10',
    status: 'objetivo_logrado',
    nutriologa: BRAND_NUTRICION.nutriologaNombre,
    motivacion: 'Objetivo de composición corporal cumplido',
    diasSinRegistro: 6,
    nivel: 'Objetivo logrado',
    pesoMetaKg: 78,
  },
];

function imc(peso: number, alturaM = 1.64): number {
  return Math.round((peso / (alturaM * alturaM)) * 10) / 10;
}

/** Genera mediciones deterministas por paciente (4–8 puntos) */
function buildMedicionesFor(p: Paciente): MedicionInBody[] {
  const pid = p.id;
  const nMed = 4 + (pid.charCodeAt(2) % 5);
  const peso0 =
    p.objetivo === 'Ganar músculo'
      ? p.pesoMetaKg - 4 - (pid.charCodeAt(1) % 3)
      : p.pesoMetaKg + 8 + (pid.charCodeAt(1) % 7);
  const grasa0 = 22 + (pid.charCodeAt(0) % 18);
  const musc0 = Math.round((peso0 * 0.42 + (pid.charCodeAt(2) % 5)) * 10) / 10;
  const gv0 = 8 + (pid.charCodeAt(1) % 8);
  const start = new Date(p.fechaInicio + 'T12:00:00');
  const out: MedicionInBody[] = [];
  const pesoEnd =
    p.status === 'objetivo_logrado'
      ? p.pesoMetaKg
      : p.objetivo === 'Ganar músculo'
        ? Math.min(peso0 + 3, p.pesoMetaKg + 2)
        : Math.max(p.pesoMetaKg + (pid.charCodeAt(3) % 4), peso0 - (pid.charCodeAt(2) % 9) - 2);
  for (let i = 0; i < nMed; i++) {
    const t = nMed <= 1 ? 1 : i / (nMed - 1);
    const d = new Date(start);
    d.setDate(d.getDate() + i * 10);
    const peso = Math.round((peso0 + (pesoEnd - peso0) * t) * 10) / 10;
    const grasa = Math.round((grasa0 + (18 + (pid.charCodeAt(2) % 12) - grasa0) * t) * 10) / 10;
    const masa = Math.round((musc0 + (p.objetivo === 'Ganar músculo' ? 2.2 : 0.5) * t) * 10) / 10;
    const gv = Math.max(4, Math.round(gv0 - t * (gv0 - (4 + (pid.charCodeAt(3) % 4)))));
    const agua = Math.round((52 + (pid.charCodeAt(1) % 6) + t * 3) * 10) / 10;
    const edadM = Math.max(25, Math.round(42 - t * 5));
    const ideal = Math.round((p.pesoMetaKg + 1) * 10) / 10;
    out.push({
      id: `m-${pid}-${i}`,
      pacienteId: pid,
      fecha: d.toISOString().slice(0, 10),
      peso,
      grasaCorporal: Math.min(45, Math.max(12, grasa)),
      masaMuscular: masa,
      grasaVisceral: gv,
      aguaCorporal: Math.min(65, agua),
      edadMetabolica: edadM,
      IMC: imc(peso),
      pesoIdeal: ideal,
    });
  }
  return out;
}

export const MOCK_MEDICIONES: MedicionInBody[] = MOCK_PACIENTES.flatMap((p) => buildMedicionesFor(p));

export function medicionesDePaciente(
  pacienteId: string,
  pool: MedicionInBody[] = MOCK_MEDICIONES
): MedicionInBody[] {
  return pool.filter((m) => m.pacienteId === pacienteId).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function ultimaMedicion(pacienteId: string, pool?: MedicionInBody[]): MedicionInBody | undefined {
  const m = medicionesDePaciente(pacienteId, pool);
  return m[m.length - 1];
}

export function primeraMedicion(pacienteId: string, pool?: MedicionInBody[]): MedicionInBody | undefined {
  const m = medicionesDePaciente(pacienteId, pool);
  return m[0];
}

export function pesoInicialKg(pacienteId: string, pool?: MedicionInBody[]): number {
  const f = primeraMedicion(pacienteId, pool);
  return f?.peso ?? 0;
}

export function semanasTratamiento(p: Paciente, hoyIso = '2026-03-22'): number {
  const a = new Date(p.fechaInicio + 'T12:00:00').getTime();
  const b = new Date(hoyIso + 'T12:00:00').getTime();
  return Math.max(1, Math.round((b - a) / (7 * 24 * 3600 * 1000)));
}

export function progresoMetaPct(p: Paciente, pool?: MedicionInBody[]): number {
  const ini = pesoInicialKg(p.id, pool);
  const ult = ultimaMedicion(p.id, pool)?.peso ?? ini;
  const meta = p.pesoMetaKg;
  if (ini === meta) return 100;
  if (p.objetivo === 'Ganar músculo') {
    const gain = ult - ini;
    const target = meta - ini;
    if (target <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((gain / target) * 100)));
  }
  const drop = ini - ult;
  const total = ini - meta;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((drop / total) * 100)));
}

export function MOCK_DIETAS_INICIALES(): DietaActual[] {
  return MOCK_PACIENTES.map((p) => {
    const plan = PLANES_DIETA[PACIENTE_PLAN[p.id] ?? 'plan-a'];
    return {
      id: `d-${p.id}`,
      pacienteId: p.id,
      fechaAsignacion: p.fechaInicio,
      nombre: `${plan.nombre} (${p.nombre.split(' ')[0]})`,
      semana: plan.semana ? [...plan.semana] : undefined,
      calorias: plan.calorias,
      proteinas: plan.proteinas,
      carbohidratos: plan.carbohidratos,
      grasas: plan.grasas,
      restricciones: [...plan.restricciones],
      alimentos_permitidos: [...plan.alimentos_permitidos],
      alimentos_prohibidos: [...plan.alimentos_prohibidos],
    };
  });
}

export const MOCK_LOGROS: Logro[] = [
  {
    id: 'l1',
    pacienteId: 'p01',
    fecha: '2026-03-20',
    tipo: 'peso',
    descripcion: 'María G. perdió 5kg desde su inicio — ¡Meta del mes alcanzada!',
    emoji: '🎉',
  },
  {
    id: 'l2',
    pacienteId: 'p02',
    fecha: '2026-03-19',
    tipo: 'medida',
    descripcion: 'Roberto M. redujo su grasa visceral de nivel 12 a nivel 9',
    emoji: '💪',
  },
  {
    id: 'l3',
    pacienteId: 'p03',
    fecha: '2026-03-18',
    tipo: 'semanas',
    descripcion: 'Ana L. completó 8 semanas consecutivas sin fallar',
    emoji: '⭐',
  },
  {
    id: 'l4',
    pacienteId: 'p08',
    fecha: '2026-03-17',
    tipo: 'habito',
    descripcion: 'Fernando C. cumplió hidratación 14 días seguidos',
    emoji: '💧',
  },
  {
    id: 'l5',
    pacienteId: 'p05',
    fecha: '2026-03-16',
    tipo: 'peso',
    descripcion: 'Laura F. bajó 2.1kg en marzo',
    emoji: '🏆',
  },
  {
    id: 'l6',
    pacienteId: 'p19',
    fecha: '2026-03-15',
    tipo: 'especial',
    descripcion: 'Claudia R. celebró objetivo con foto de progreso',
    emoji: '🌟',
  },
];

export const MOCK_RECORDATORIOS: RecordatorioConfig[] = MOCK_PACIENTES.map((p) => ({
  pacienteId: p.id,
  activo: p.status === 'activo',
  diasSemana: [6],
  hora: '11:00',
  mensajePersonalizado:
    p.status === 'activo'
      ? `¡Hola ${p.nombre.split(' ')[0]}! Recuerda que tu constancia te acerca a tu meta.`
      : '',
}));

/** Citas lunes–viernes semana del 17–21 mar 2026 */
export const MOCK_CITAS_SEMANA: CitaNutricion[] = [
  { id: 'c1', pacienteId: 'p01', fecha: '2026-03-17', hora: '09:00', motivo: 'Seguimiento InBody' },
  { id: 'c2', pacienteId: 'p02', fecha: '2026-03-17', hora: '10:30', motivo: 'Ajuste de macros' },
  { id: 'c3', pacienteId: 'p03', fecha: '2026-03-17', hora: '12:00', motivo: 'Consulta general' },
  { id: 'c4', pacienteId: 'p04', fecha: '2026-03-17', hora: '16:00', motivo: 'Mantenimiento' },
  { id: 'c5', pacienteId: 'p05', fecha: '2026-03-18', hora: '09:30', motivo: 'Primera revisión mensual' },
  { id: 'c6', pacienteId: 'p06', fecha: '2026-03-18', hora: '11:00', motivo: 'Plan deportivo' },
  { id: 'c7', pacienteId: 'p07', fecha: '2026-03-18', hora: '13:30', motivo: 'Educación nutricional' },
  { id: 'c8', pacienteId: 'p08', fecha: '2026-03-18', hora: '17:00', motivo: 'Seguimiento' },
  { id: 'c9', pacienteId: 'p01', fecha: '2026-03-19', hora: '10:00', motivo: 'Control' },
  { id: 'c10', pacienteId: 'p09', fecha: '2026-03-19', hora: '11:30', motivo: 'InBody' },
  { id: 'c11', pacienteId: 'p10', fecha: '2026-03-19', hora: '15:00', motivo: 'Consulta' },
  { id: 'c12', pacienteId: 'p02', fecha: '2026-03-20', hora: '09:00', motivo: 'Revisión semanal' },
  { id: 'c13', pacienteId: 'p11', fecha: '2026-03-20', hora: '10:30', motivo: 'Plan alimentario' },
  { id: 'c14', pacienteId: 'p12', fecha: '2026-03-20', hora: '12:30', motivo: 'Seguimiento' },
  { id: 'c15', pacienteId: 'p13', fecha: '2026-03-20', hora: '16:30', motivo: 'Control' },
  { id: 'c16', pacienteId: 'p03', fecha: '2026-03-21', hora: '09:30', motivo: 'Cierre de mes' },
  { id: 'c17', pacienteId: 'p14', fecha: '2026-03-21', hora: '11:00', motivo: 'Primera consulta extendida' },
  { id: 'c18', pacienteId: 'p04', fecha: '2026-03-21', hora: '13:00', motivo: 'Chequeo' },
];

const HOY_REF = '2026-03-22';

export function pacientesActivos(): Paciente[] {
  return MOCK_PACIENTES.filter((p) => p.status === 'activo');
}

export function pacientesRiesgoAbandono(minDias = 7): Paciente[] {
  return MOCK_PACIENTES.filter((p) => p.diasSinRegistro > minDias).sort(
    (a, b) => b.diasSinRegistro - a.diasSinRegistro
  );
}

/** Solo activos con más de N días sin registro (KPI abandono) */
export function pacientesActivosEnRiesgo(minDias = 7): Paciente[] {
  return MOCK_PACIENTES.filter((p) => p.status === 'activo' && p.diasSinRegistro > minDias).sort(
    (a, b) => b.diasSinRegistro - a.diasSinRegistro
  );
}

export function promedioPerdidaPesoMesKg(pool: MedicionInBody[] = MOCK_MEDICIONES): number {
  const activos = pacientesActivos().filter((p) => p.objetivo === 'Bajar peso' || p.objetivo === 'Salud general');
  let sum = 0;
  let n = 0;
  for (const p of activos) {
    const ms = medicionesDePaciente(p.id, pool);
    if (ms.length < 2) continue;
    const ult = ms[ms.length - 1];
    const prev = ms.filter((x) => x.fecha < '2026-03-01').pop() ?? ms[0];
    if (ult && prev && prev.fecha !== ult.fecha) {
      sum += Math.max(0, prev.peso - ult.peso);
      n++;
    }
  }
  return n ? Math.round((sum / n) * 10) / 10 : 2.1;
}

export function logrosUltimosDias(dias = 7): Logro[] {
  const lim = new Date(HOY_REF);
  lim.setDate(lim.getDate() - dias);
  const iso = lim.toISOString().slice(0, 10);
  return [...MOCK_LOGROS].filter((l) => l.fecha >= iso).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function logrosDePaciente(pacienteId: string, pool?: MedicionInBody[]): Logro[] {
  const base = MOCK_LOGROS.filter((l) => l.pacienteId === pacienteId);
  const ms = medicionesDePaciente(pacienteId, pool);
  if (ms.length < 2) return base;
  const ini = ms[0]!;
  const ult = ms[ms.length - 1]!;
  const extra: Logro[] = [
    {
      id: `lx-${pacienteId}-1`,
      pacienteId,
      fecha: ms[1]?.fecha ?? ini.fecha,
      tipo: 'semanas',
      descripcion: '¡Primera semana completada!',
      emoji: '🎉',
    },
  ];
  if (ini.peso - ult.peso >= 2) {
    extra.push({
      id: `lx-${pacienteId}-2`,
      pacienteId,
      fecha: ms[Math.min(3, ms.length - 1)]!.fecha,
      tipo: 'peso',
      descripcion: `¡Perdiste tus primeros ${(ini.peso - ult.peso).toFixed(1)}kg!`,
      emoji: '💪',
    });
  }
  if (ini.grasaVisceral - ult.grasaVisceral >= 2) {
    extra.push({
      id: `lx-${pacienteId}-3`,
      pacienteId,
      fecha: ult.fecha,
      tipo: 'medida',
      descripcion: `¡Grasa visceral bajó a nivel ${ult.grasaVisceral}!`,
      emoji: '⭐',
    });
  }
  const pac = MOCK_PACIENTES.find((x) => x.id === pacienteId);
  if (pac && semanasTratamiento(pac) >= 8) {
    extra.push({
      id: `lx-${pacienteId}-4`,
      pacienteId,
      fecha: ult.fecha,
      tipo: 'semanas',
      descripcion: '¡Llevas 2 meses de constancia!',
      emoji: '🏆',
    });
  }
  return [...base, ...extra].sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Serie promedio de pérdida acumulada simulada (kg) por semana — consultorio */
export const SERIE_PROGRESO_GRUPO: { semana: string; kgPerdidaPromedio: number }[] = [
  { semana: 'S1', kgPerdidaPromedio: 0.4 },
  { semana: 'S2', kgPerdidaPromedio: 0.9 },
  { semana: 'S3', kgPerdidaPromedio: 1.3 },
  { semana: 'S4', kgPerdidaPromedio: 1.8 },
  { semana: 'S5', kgPerdidaPromedio: 2.2 },
  { semana: 'S6', kgPerdidaPromedio: 2.7 },
  { semana: 'S7', kgPerdidaPromedio: 3.1 },
  { semana: 'S8', kgPerdidaPromedio: 3.6 },
];

export function statsConsultorioTexto(): string {
  const riesgo = pacientesActivosEnRiesgo(7).length;
  const activos = pacientesActivos();
  const cercaMeta = activos.filter((p) => {
    const u = ultimaMedicion(p.id, MOCK_MEDICIONES)?.peso ?? p.pesoMetaKg;
    return Math.abs(u - p.pesoMetaKg) < 2;
  }).length;
  return `- ${MOCK_PACIENTES.length} pacientes en seguimiento
- Promedio de pérdida reciente (demo): ${promedioPerdidaPesoMesKg()} kg (pacientes en déficit)
- ${riesgo} pacientes en riesgo de abandono (>7 días sin registro)
- ${cercaMeta} pacientes cerca de su meta (<2kg)
- Mejor resultado del mes (demo): -8kg en 10 semanas`;
}

export function sparklinePeso4Semanas(
  pacienteId: string,
  pool?: MedicionInBody[]
): { semana: string; peso: number }[] {
  const ms = medicionesDePaciente(pacienteId, pool);
  if (!ms.length) return [];
  const last4 = ms.slice(-4);
  return last4.map((m, i) => ({ semana: `S${i + 1}`, peso: m.peso }));
}

export function variacionPesoUltimaSemana(pacienteId: string, pool?: MedicionInBody[]): number {
  const ms = medicionesDePaciente(pacienteId, pool);
  if (ms.length < 2) return 0;
  const a = ms[ms.length - 2]!;
  const b = ms[ms.length - 1]!;
  return Math.round((b.peso - a.peso) * 10) / 10;
}

export function pacientesMasActivosParaDashboard(limit = 5, pool?: MedicionInBody[]): Paciente[] {
  return [...pacientesActivos()]
    .filter((p) => p.diasSinRegistro <= 7)
    .sort(
      (a, b) =>
        a.diasSinRegistro - b.diasSinRegistro ||
        variacionPesoUltimaSemana(b.id, pool) - variacionPesoUltimaSemana(a.id, pool)
    )
    .slice(0, limit);
}

export function logrosEsteMesCount(): number {
  return MOCK_LOGROS.filter((l) => l.fecha.startsWith('2026-03')).length;
}

// ── Panel de Actividad — últimos 14 días ─────────────────────────────────────

export type RegistroActividad = {
  pacienteId: string;
  fecha: string; // 'YYYY-MM-DD'
  registroComida: boolean;
  registroAgua: boolean;
  mensajeEnviado: boolean;
  pesoRegistrado: boolean;
};

const ACCIONES_POSITIVAS = [
  'Envió foto de desayuno',
  'Registró comida y colación',
  'Preguntó al chatbot sobre sustitución',
  'Envió foto de cena',
  'Reportó hidratación completa',
  'Consultó su progreso al bot',
  'Registró peso matutino',
  'Envió foto de comida y cena',
  'Preguntó sobre su plan al bot',
  'Reportó actividad física',
];

/** Genera actividad determinista coherente con diasSinRegistro del paciente */
function buildActividad14Dias(p: Paciente): RegistroActividad[] {
  const HOY = new Date('2026-04-11T12:00:00');
  const seed = p.id.charCodeAt(1) * 7 + p.id.charCodeAt(2) * 3;
  const result: RegistroActividad[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(HOY);
    d.setDate(d.getDate() - i);
    const fecha = d.toISOString().slice(0, 10);

    // Los últimos `diasSinRegistro` días no tienen actividad
    const diasAtras = i;
    const activo = diasAtras >= p.diasSinRegistro
      ? false
      : ((seed + i * 13) % 10) < (p.status === 'activo' ? 8 : 3);

    result.push({
      pacienteId: p.id,
      fecha,
      registroComida: activo && ((seed + i) % 3) !== 0,
      registroAgua: activo && ((seed + i * 2) % 4) !== 0,
      mensajeEnviado: activo && ((seed + i * 5) % 5) !== 0,
      pesoRegistrado: activo && ((seed + i * 7) % 7) === 0,
    });
  }
  return result;
}

export const MOCK_ACTIVIDAD_14DIAS: RegistroActividad[] =
  MOCK_PACIENTES.flatMap((p) => buildActividad14Dias(p));

export function actividadDePaciente(pacienteId: string): RegistroActividad[] {
  return MOCK_ACTIVIDAD_14DIAS.filter((r) => r.pacienteId === pacienteId);
}

export function heatmapActividad(pacienteId: string): {
  fecha: string;
  activo: boolean;
  descripcion: string;
  diaSemana: string;
}[] {
  const registros = actividadDePaciente(pacienteId);
  return registros.map((r) => {
    const acciones: string[] = [];
    if (r.registroComida) acciones.push('registró comidas');
    if (r.registroAgua) acciones.push('reportó hidratación');
    if (r.mensajeEnviado) acciones.push('preguntó al chatbot');
    if (r.pesoRegistrado) acciones.push('registró peso');

    const activo = r.registroComida || r.registroAgua || r.mensajeEnviado || r.pesoRegistrado;
    const fecha = new Date(r.fecha + 'T12:00:00');
    const diaSemana = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' });

    return {
      fecha: r.fecha,
      activo,
      descripcion: activo ? acciones.join(' + ') : 'Sin actividad',
      diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
    };
  });
}

export function ultimaAccionTexto(p: Paciente): string {
  const d = p.diasSinRegistro;
  const seed = p.id.charCodeAt(1) + p.id.charCodeAt(2);
  const accion = ACCIONES_POSITIVAS[seed % ACCIONES_POSITIVAS.length]!;
  if (d === 0) return `🟢 Hoy — ${accion}`;
  if (d === 1) return `🟡 Ayer — ${accion}`;
  if (d <= 6) return `🟠 Hace ${d} días — Última consulta al bot`;
  return `🔴 ${d} días sin actividad ⚠️`;
}
