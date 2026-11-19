// CFDI 4.0 JSON builder para CSPlug
// Arma el payload completo a partir del request simplificado

import { EmitirCFDIRequest, ConceptoCFDI } from './types';
import { getMarcaConfig } from './marcas';

const IVA_TASA = 0.16;

// ─── Calcular impuestos de un concepto ───────────────────────────────────────

function calcularImpuestos(concepto: ConceptoCFDI) {
  const base = concepto.valorUnitario * concepto.cantidad - (concepto.descuento || 0);
  const importe = parseFloat((base * IVA_TASA).toFixed(2));

  return {
    traslados: [
      {
        base: parseFloat(base.toFixed(2)),
        impuesto: '002',
        tipoFactor: 'Tasa',
        tasaOCuota: '0.160000',
        importe,
      },
    ],
  };
}

// ─── Calcular totales del comprobante ────────────────────────────────────────

function calcularTotales(conceptos: ConceptoCFDI[]) {
  let subtotal = 0;
  let totalIVA = 0;

  for (const c of conceptos) {
    const importe = c.valorUnitario * c.cantidad - (c.descuento || 0);
    subtotal += importe;
    totalIVA += importe * IVA_TASA;
  }

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    iva: parseFloat(totalIVA.toFixed(2)),
    total: parseFloat((subtotal + totalIVA).toFixed(2)),
  };
}

// ─── Builder principal ───────────────────────────────────────────────────────

export function buildCFDIPayload(req: EmitirCFDIRequest) {
  const marca = getMarcaConfig(req.marca);
  const { subtotal, iva, total } = calcularTotales(req.conceptos);

  const conceptosConImpuestos = req.conceptos.map((c) => ({
    claveProdServ: c.claveProdServ,
    claveUnidad: c.claveUnidad,
    unidad: c.unidad || 'Servicio',
    cantidad: c.cantidad,
    descripcion: c.descripcion,
    valorUnitario: parseFloat(c.valorUnitario.toFixed(2)),
    importe: parseFloat((c.valorUnitario * c.cantidad).toFixed(2)),
    descuento: c.descuento ? parseFloat(c.descuento.toFixed(2)) : undefined,
    impuestos: c.impuestos || calcularImpuestos(c),
  }));

  return {
    // Emisor (mismo RFC, distintas series por marca)
    emisor: {
      rfc: marca.rfc,
      nombre: marca.nombre,
      regimenFiscal: marca.regimenFiscal,
    },

    // Receptor
    receptor: {
      rfc: req.receptor.rfc,
      nombre: req.receptor.nombre,
      domicilioFiscalReceptor: req.receptor.codigoPostal,
      regimenFiscalReceptor: req.receptor.regimenFiscal,
      usoCFDI: req.receptor.usoCFDI,
    },

    // Cabecera del comprobante
    tipoDeComprobante: req.tipoDeComprobante || 'I',
    metodoPago: req.metodoPago || 'PUE',
    formaPago: req.formaPago || '03',
    moneda: req.moneda || 'MXN',
    serie: marca.serie,
    lugarExpedicion: marca.codigoPostal,
    ...(req.condicionesDePago ? { condicionesDePago: req.condicionesDePago } : {}),

    // Importes
    subtotal,
    total,

    // Conceptos
    conceptos: conceptosConImpuestos,

    // Impuestos globales
    impuestos: {
      totalImpuestosTrasladados: iva,
      traslados: [
        {
          base: parseFloat(subtotal.toFixed(2)),
          impuesto: '002',
          tipoFactor: 'Tasa',
          tasaOCuota: '0.160000',
          importe: iva,
        },
      ],
    },
  };
}

// ─── Helpers de claves SAT frecuentes ────────────────────────────────────────

export const CLAVES_SAT = {
  // Productos/servicios
  softwareSubscripcion: '81112105',  // Servicios de software de aplicación
  consultoriaIT: '81111500',          // Consultoría en TI
  desarrolloSoftware: '81112101',     // Desarrollo de software
  publicidad: '73111600',             // Servicios de publicidad
  serviciosGenerales: '84111500',     // Servicios empresariales generales

  // Unidades
  servicio: 'E48',   // Unidad de servicio
  actividad: 'ACT',  // Actividad
  mes: 'MO',         // Mes

  // Uso CFDI receptor
  gastoGeneral: 'G03',
  porDefinir: 'S01',  // Sin efectos fiscales (CFDI global o no deducible)
} as const;
