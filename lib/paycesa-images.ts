/**
 * Imágenes de la propuesta La Rueda Veladoras → /paycesa
 *
 * Para usar fotos reales de la tienda (Tiendanube, etc.):
 * 1. Abre la tienda del cliente, clic derecho en la imagen → "Copiar dirección de imagen".
 * 2. Define en .env.local (o en el panel de hosting):
 *    NEXT_PUBLIC_PAYCESA_IMG_HERO=
 *    NEXT_PUBLIC_PAYCESA_IMG_ARTISAN=
 *    NEXT_PUBLIC_PAYCESA_IMG_LOGISTICS=
 *
 * Valores por defecto: fotografías reales (Unsplash) temáticas velas / taller / envíos
 * hasta que pegues las URLs del catálogo del cliente.
 */
export function getPaycesaImages() {
  return {
    hero:
      process.env.NEXT_PUBLIC_PAYCESA_IMG_HERO ||
      'https://images.unsplash.com/photo-1602143408661-0117ead60bf9?auto=format&fit=crop&w=1600&q=85',
    artisan:
      process.env.NEXT_PUBLIC_PAYCESA_IMG_ARTISAN ||
      'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=900&q=85',
    logistics:
      process.env.NEXT_PUBLIC_PAYCESA_IMG_LOGISTICS ||
      'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=900&q=85',
  } as const;
}
