export type FbConnectErrorCode =
  | 'cancelled'
  | 'no_pages'
  | 'no_forms'
  | 'forms_unusable'
  | 'subscribe'
  | 'oauth'
  | 'expired'
  | 'config'
  | 'denied'
  | 'generic';

export type FbConnectReveal = {
  clientSlug: string;
  nombre: string;
  password: string;
  portalUrl: string;
  pageName: string;
  formsCount: number;
};

export function facebookUiState(nativeConnected: boolean, activeFormCount: number): {
  fbStatus: 'pending' | 'connected';
  fbNative: boolean;
} {
  const native = !!nativeConnected;
  const hasForms = activeFormCount > 0;
  return {
    fbStatus: native || hasForms ? 'connected' : 'pending',
    fbNative: native,
  };
}

export function fbConnectUserMessage(code: FbConnectErrorCode | string): string {
  switch (code) {
    case 'cancelled':
    case 'denied':
      return 'Cancelaste la conexión con Facebook. Podés intentarlo de nuevo cuando quieras.';
    case 'no_pages':
      return 'No encontramos páginas de Facebook en esa cuenta. Entrá con el perfil que administra la página del cliente y volvé a conectar.';
    case 'no_forms':
      return 'La página elegida no tiene formularios de leads. Creá un formulario de captación en Meta Ads y reintentá.';
    case 'forms_unusable':
      return 'Encontramos formularios en esa página, pero están archivados o eliminados. Reactivalos en Meta Ads y volvé a conectar.';
    case 'subscribe':
      return 'No pudimos activar la recepción de leads en esa página. Revisá que el perfil tenga permiso de administrador y volvé a intentar.';
    case 'expired':
      return 'La sesión de Facebook venció. Tocá de nuevo Conectar Facebook para empezar otra vez.';
    case 'config':
      return 'Falta configurar la app de Facebook en el servidor. Pedile a soporte que cargue FB_APP_ID y FB_APP_SECRET.';
    case 'oauth':
      return 'Facebook no autorizó la conexión. Probá de nuevo y aceptá todos los permisos que pide la pantalla.';
    default:
      return 'No se pudo completar la conexión con Facebook. Intentá de nuevo.';
  }
}
