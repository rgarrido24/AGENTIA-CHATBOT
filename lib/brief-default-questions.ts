/**
 * Preguntas por defecto del Brief Digital (reseller puede editarlas en el panel).
 * Misma fuente para UI admin y POST /api/portal/[resellerId]/briefs.
 */
export type BriefQuestion = {
  id: string;
  step: 1 | 2 | 3 | 4;
  label: string;
  type: 'text' | 'textarea' | 'yesno' | 'number' | 'url';
  placeholder?: string;
};

export const DEFAULT_BRIEF_QUESTIONS: BriefQuestion[] = [
  // Paso 1
  { id: 'contacto_nombre', step: 1, label: 'Nombre completo', type: 'text', placeholder: 'Nombre y apellido' },
  { id: 'contacto_email', step: 1, label: 'Email', type: 'text', placeholder: 'email@empresa.com' },
  {
    id: 'cuit_facturacion',
    step: 1,
    label: 'CUIT (para facturación)',
    type: 'text',
    placeholder: 'XX-XXXXXXXX-X',
  },
  {
    id: 'negocio_historia',
    step: 1,
    label: '¿De qué se trata tu negocio? Historia, años, cómo comercializan',
    type: 'textarea',
    placeholder: 'Contanos tu historia y cómo vendés hoy…',
  },
  {
    id: 'negocio_productos_promo',
    step: 1,
    label: 'Productos o servicios principales que querés promocionar',
    type: 'textarea',
    placeholder: 'Qué ofrecés y qué te interesa potenciar con pauta',
  },
  {
    id: 'redes_y_web',
    step: 1,
    label: 'Redes sociales y sitio web (links)',
    type: 'url',
    placeholder: 'https://tu-sitio.com o link principal / Linktree',
  },

  // Paso 2
  { id: 'competidores', step: 2, label: '¿Quiénes son tus competidores?', type: 'textarea', placeholder: 'Marcas o negocios similares' },
  {
    id: 'publico_objetivo',
    step: 2,
    label: '¿Quién es tu cliente ideal? Edad, género, ubicación, intereses',
    type: 'textarea',
    placeholder: 'Perfil del cliente que más te conviene',
  },
  {
    id: 'orientacion_geo_anuncios',
    step: 2,
    label: '¿A qué lugares querés llegar con tus anuncios?',
    type: 'textarea',
    placeholder: 'Ciudades, provincias, países o zonas',
  },
  {
    id: 'diferenciador',
    step: 2,
    label: '¿Qué hace diferente a tu negocio?',
    type: 'textarea',
    placeholder: 'Tu propuesta de valor frente a la competencia',
  },

  // Paso 3
  { id: 'tiene_pixel', step: 3, label: '¿Tenés Pixel de Facebook instalado?', type: 'yesno' },
  { id: 'meta_ads_activa', step: 3, label: '¿Tenés cuenta de Meta Ads activa?', type: 'yesno' },
  { id: 'tiene_gtm', step: 3, label: '¿Tenés Google Tag Manager?', type: 'yesno' },
  { id: 'tiene_catalogo', step: 3, label: '¿Tenés catálogo de productos?', type: 'yesno' },

  // Paso 4
  {
    id: 'presupuesto_mensual',
    step: 4,
    label: 'Presupuesto mensual en publicidad (ARS)',
    type: 'number',
    placeholder: 'Ej: 500000',
  },
  { id: 'fecha_inicio', step: 4, label: 'Fecha de inicio deseada', type: 'text', placeholder: 'Ej: 01/06/2026' },
  { id: 'invirtio_antes', step: 4, label: '¿Ya invertiste en publicidad antes?', type: 'yesno' },
  {
    id: 'resultados_previos',
    step: 4,
    label: 'Resultados anteriores si los tenés',
    type: 'textarea',
    placeholder: 'ROAS, CPL, volumen de leads, o “es la primera vez”',
  },
];
