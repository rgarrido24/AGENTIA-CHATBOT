/**
 * Marca Blanca - Multi-tenant
 *
 * Para cambiar el color principal del dashboard en un solo paso, edita
 * la clase en app/layout.tsx:
 *
 *   html className="dark brand-emerald"   → Verde esmeralda (Agentia)
 *   html className="dark brand-blue"      → Azul
 *   html className="dark brand-purple"    → Morado
 *
 * O define colores custom en app/globals.css:
 *
 *   :root {
 *     --brand-primary: #10b981;
 *     --brand-accent: #3b82f6;
 *   }
 */

export const BRAND_PRESETS = {
  emerald: 'brand-emerald', // Verde + azul Agentia
  blue: 'brand-blue',
  purple: 'brand-purple',
} as const;
