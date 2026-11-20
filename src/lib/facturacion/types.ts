// CSPlug / CSFacturación — CFDI 4.0 Types
// RFC único: GHO2606309U4 (Garrido Holdings)
// Marcas: agentia | cwf

export type Marca = 'agentia' | 'cwf';

// ─── Configuración por marca ──────────────────────────────────────────────────

export interface MarcaConfig {
  nombre: string;        // Nombre fiscal exacto en SAT
  rfc: string;           // Siempre GHO2606309U4
  regimenFiscal: string; // 601 = General de Ley PM, 612 = Personas Físicas, etc.
  codigoPostal: string;  // CP del domicilio fiscal
  serie: string;         // Serie de folios (ej. "A" o "AG")
  logoUrl?: string;      // Para futura plantilla PDF
}

// ─── Request para emitir CFDI ─────────────────────────────────────────────────

export interface ReceptorCFDI {
  rfc: string;
  nombre: string;        // Debe coincidir con constancia SAT
  regimenFiscal: string; // Régimen fiscal del receptor
  codigoPostal: string;  // CP del domicilio fiscal del receptor
  usoCFDI: string;       // Clave SAT: G03, D01, S01, etc.
}

export interface ConceptoCFDI {
  claveProdServ: string;   // Clave SAT (ej. 81112105 = desarrollo software)
  claveUnidad: string;     // Clave SAT unidad (ej. E48 = servicio, ACT = actividad)
  unidad?: string;         // Descripción unidad (ej. "Servicio")
  cantidad: number;
  descripcion: string;
  valorUnitario: number;   // Sin IVA
  descuento?: number;
  // Impuestos calculados automáticamente en cfdi-builder si omitidos
  impuestos?: {
    traslados?: Array<{
      base: number;
      impuesto: string;    // "002" = IVA
      tipoFactor: string;  // "Tasa"
      tasaOCuota: number;  // 0.160000
      importe: number;
    }>;
  };
}

export interface EmitirCFDIRequest {
  marca: Marca;
  receptor: ReceptorCFDI;
  conceptos: ConceptoCFDI[];
  tipoDeComprobante?: string; // I=ingreso, E=egreso, T=traslado (default: I)
  metodoPago?: string;        // PUE, PPD (default: PUE)
  formaPago?: string;         // 03=transferencia, 04=tarjeta, 99=por definir
  moneda?: string;            // MXN (default)
  condicionesDePago?: string;
  observaciones?: string;
  clientId?: string;
}

// ─── Response de CSPlug ───────────────────────────────────────────────────────

export interface CSPlugEmitirResponse {
  status: 'success' | 'error';
  uuid?: string;
  folio?: string;
  serie?: string;
  fechaTimbrado?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  cfdiSellado?: string;    // XML completo
  error?: string;
  detalleError?: string;
}

export interface CSPlugConsultarResponse {
  status: 'success' | 'error';
  uuid: string;
  estado: string;          // vigente | cancelado
  xmlUrl?: string;
  pdfUrl?: string;
  error?: string;
}

// ─── Registro en MongoDB ──────────────────────────────────────────────────────

export interface FacturaRecord {
  _id?: string;
  marca: Marca;
  uuid: string;
  folio: string;
  serie: string;
  fechaEmision: Date;
  fechaTimbrado: string;
  receptorRFC: string;
  receptorNombre: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'vigente' | 'cancelado';
  xmlUrl?: string;
  pdfUrl?: string;
  clientId?: string;       // Para fase 2: qué cliente POS generó la factura
  createdBy?: string;      // userId o 'api'
  createdAt: Date;
  updatedAt: Date;
}
