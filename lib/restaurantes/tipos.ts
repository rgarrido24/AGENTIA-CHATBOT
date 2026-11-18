/** Tipos compartidos entre servidor y cliente (solo tipos y constantes, sin secretos). */
export type Rol = 'dueno' | 'caja' | 'mesero' | 'cocina';
export const ROLES_PIN: Rol[] = ['dueno', 'caja', 'mesero', 'cocina'];

export type Variante = { l: string; p: number; f: number; s: number };
export type ModOpcion = { l: string; p: number[]; picor?: number };
export type ModGrupo = {
  g: string;
  req: boolean;
  /** Solo se muestra si el grupo [0] tiene elegida la opción [1]. */
  showIf?: [string, string];
  /** El texto de la línea lleva el nombre del grupo delante ("Vaso Escarchado"). */
  prefix?: boolean;
  opts: ModOpcion[];
};
export type Producto = {
  id: string;
  cat: string;
  name: string;
  desc?: string;
  emoji?: string;
  station: 'cocina' | 'barra';
  v: Variante[];
  /** Receta: insumo -> cantidad por unidad de la variante (se multiplica por `f`). */
  use: Record<string, number>;
  mods?: ModGrupo[];
  avail?: boolean;
  /** Etiqueta comercial: Nuevo, Recomendado, Favorito, Más vendido. */
  tag?: string;
  /** El producto se arma con el constructor de salsas (alitas / boneless). */
  salsas?: boolean;
  /** Ingredientes del platillo: de aquí salen los botones "Sin …". */
  ing?: string[];
};
/** [id, nombre, unidad, stock, mínimo, costo] */
export type Insumo = [string, string, string, number, number, number];
export type Mesa = { k: string; label: string; tipo: string };

export type Salsa = {
  id: string;
  nombre: string;
  /** 1 a 5 flamas. */
  picor: number;
  desc?: string;
  /** Precio adicional (0 si no aplica). */
  extra?: number;
  foto?: string;
  avail?: boolean;
};
