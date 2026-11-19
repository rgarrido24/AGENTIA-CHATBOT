// Configuración de marcas para Garrido Holdings S.A.S.
// RFC único: GHO2606309U4

import { Marca, MarcaConfig } from './types';

export const MARCAS_CONFIG: Record<Marca, MarcaConfig> = {
  agentia: {
    nombre: 'GARRIDO HOLDINGS S.A.S.', // Nombre exacto en SAT — ajustar si difiere
    rfc: 'GHO2606309U4',
    regimenFiscal: '601',              // General de Ley Personas Morales
    codigoPostal: process.env.CSPLUG_CP_AGENTIA || '97000',
    serie: process.env.CSPLUG_SERIE_AGENTIA || 'AG',
  },
  cwf: {
    nombre: 'GARRIDO HOLDINGS S.A.S.',
    rfc: 'GHO2606309U4',
    regimenFiscal: '601',
    codigoPostal: process.env.CSPLUG_CP_CWF || '97000',
    serie: process.env.CSPLUG_SERIE_CWF || 'CW',
  },
};

export function getMarcaConfig(marca: Marca): MarcaConfig {
  const config = MARCAS_CONFIG[marca];
  if (!config) throw new Error(`Marca desconocida: ${marca}`);
  return config;
}
