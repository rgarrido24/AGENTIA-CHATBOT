import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { CwfCotizacion } from '@/lib/cwf-cotizaciones';

const GREEN = '#1A2E1A';
const COPPER = '#C47D2E';
const LIGHT_BG = '#F5F5F0';
const ROW_ALT = '#EFEFEA';

const EMISOR = {
  razonSocial: 'Garrido Holdings S.A.S. de C.V.',
  rfc: 'GHO2606309U4',
  regimen: 'Persona Moral',
  domicilio: 'Mérida, Yucatán',
} as const;

const FORMA_PAGO =
  'Transferencia SPEI o tarjeta de crédito/débito. Datos bancarios se comparten al confirmar el pedido.';

const INCLUYE_ITEMS = [
  'Tinte protector Flood CWF-UV de alta duración',
  'Resistencia a rayos UV, humedad y hongos',
  'Asesoría técnica de aplicación',
  'Garantía de calidad CWF México',
  'Entrega coordinada según disponibilidad',
];

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: GREEN,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  brandSub: {
    fontSize: 9,
    color: COPPER,
    marginTop: 2,
  },
  contactBlock: {
    textAlign: 'right',
    fontSize: 8,
    lineHeight: 1.45,
  },
  emisorName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: GREEN,
    marginBottom: 2,
  },
  copperLine: {
    height: 3,
    backgroundColor: COPPER,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 6,
    color: GREEN,
    textTransform: 'uppercase',
  },
  clientBox: {
    backgroundColor: LIGHT_BG,
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  clientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clientField: {
    width: '50%',
    marginBottom: 6,
    paddingRight: 8,
  },
  clientLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    marginBottom: 12,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    color: '#fff',
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  colProducto: { width: '18%' },
  colPresentacion: { width: '16%' },
  colColor: { width: '16%' },
  colCant: { width: '10%', textAlign: 'center' },
  colPU: { width: '18%', textAlign: 'right' },
  colSub: { width: '22%', textAlign: 'right' },
  totalsBox: {
    marginLeft: 'auto',
    width: '48%',
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 10,
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: COPPER,
    color: '#fff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 4,
  },
  incluyeBox: {
    backgroundColor: LIGHT_BG,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: COPPER,
  },
  incluyeItem: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 9,
  },
  check: {
    color: COPPER,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
    width: 12,
  },
  notas: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fff8f0',
    borderWidth: 1,
    borderColor: '#e8d5c0',
  },
  condicionesBox: {
    backgroundColor: LIGHT_BG,
    padding: 12,
    marginBottom: 14,
    borderRadius: 4,
    fontSize: 9,
    lineHeight: 1.45,
  },
  condicionesLabel: {
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  badge: {
    fontSize: 8,
    color: COPPER,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COPPER,
    paddingTop: 8,
    fontSize: 8,
    lineHeight: 1.4,
    color: '#666',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
});

function money(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtFecha(d: Date) {
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function CotizacionPdfDocument({ data }: { data: CwfCotizacion }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandTitle}>CWF México</Text>
            <Text style={styles.brandSub}>Flood CWF-UV · Protección para madera</Text>
          </View>
          <View style={styles.contactBlock}>
            <Text style={styles.emisorName}>{EMISOR.razonSocial}</Text>
            <Text>RFC: {EMISOR.rfc}</Text>
            <Text>Régimen: {EMISOR.regimen}</Text>
            <Text>Domicilio fiscal: {EMISOR.domicilio}</Text>
            <Text style={{ marginTop: 6 }}>cwf.com.mx</Text>
            <Text>999 130 6399</Text>
            <Text>cotizaciones@cwf.com.mx</Text>
          </View>
        </View>
        <View style={styles.copperLine} />

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>COTIZACIÓN</Text>
          <View>
            <Text style={{ fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>Folio: {data.folio}</Text>
            <Text style={{ textAlign: 'right', fontSize: 9 }}>Fecha: {fmtFecha(data.fecha)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Datos del cliente</Text>
        <View style={styles.clientBox}>
          <View style={styles.clientGrid}>
            <View style={styles.clientField}>
              <Text style={styles.clientLabel}>Nombre</Text>
              <Text style={styles.clientValue}>{data.cliente.nombre || '—'}</Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientLabel}>Negocio / Empresa</Text>
              <Text style={styles.clientValue}>{data.cliente.negocio || '—'}</Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientLabel}>Dirección de entrega</Text>
              <Text style={styles.clientValue}>{data.cliente.direccion || '—'}</Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientLabel}>Ciudad y C.P.</Text>
              <Text style={styles.clientValue}>
                {[data.cliente.ciudad, data.cliente.cp].filter(Boolean).join(', ') || '—'}
              </Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientLabel}>WhatsApp</Text>
              <Text style={styles.clientValue}>{data.cliente.whatsapp || '—'}</Text>
            </View>
            <View style={styles.clientField}>
              <Text style={styles.clientLabel}>RFC</Text>
              <Text style={styles.clientValue}>{data.cliente.rfc || '—'}</Text>
            </View>
          </View>
        </View>

        {data.precioEspecialDistribuidor ? (
          <Text style={styles.badge}>★ PRECIO ESPECIAL DISTRIBUIDOR</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Productos</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.colProducto}>Producto</Text>
            <Text style={styles.colPresentacion}>Presentación</Text>
            <Text style={styles.colColor}>Color</Text>
            <Text style={styles.colCant}>Cant.</Text>
            <Text style={styles.colPU}>P. unit. (c/IVA)</Text>
            <Text style={styles.colSub}>Subtotal</Text>
          </View>
          {data.productos.map((p, i) => (
            <View
              key={`${p.presentacion}-${i}`}
              style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : ROW_ALT }]}
            >
              <Text style={styles.colProducto}>{p.producto}</Text>
              <Text style={styles.colPresentacion}>{p.presentacion}</Text>
              <Text style={styles.colColor}>{p.color}</Text>
              <Text style={styles.colCant}>{p.cantidad}</Text>
              <Text style={styles.colPU}>{money(p.precioUnitario)}</Text>
              <Text style={styles.colSub}>{money(p.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotal (sin IVA)</Text>
            <Text>{money(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IVA 16%</Text>
            <Text>{money(data.iva)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Envío</Text>
            <Text>{money(data.envio)}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text>TOTAL</Text>
            <Text>{money(data.total)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Incluye</Text>
        <View style={styles.incluyeBox}>
          {INCLUYE_ITEMS.map((item) => (
            <View key={item} style={styles.incluyeItem}>
              <Text style={styles.check}>✓</Text>
              <Text>{item}</Text>
            </View>
          ))}
        </View>

        {data.notas?.trim() ? (
          <View>
            <Text style={styles.sectionTitle}>Notas adicionales</Text>
            <Text style={styles.notas}>{data.notas.trim()}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Condiciones de pago</Text>
        <View style={styles.condicionesBox}>
          <Text>
            <Text style={styles.condicionesLabel}>Forma de pago: </Text>
            {FORMA_PAGO}
          </Text>
          <Text style={{ marginTop: 6 }}>
            <Text style={styles.condicionesLabel}>Vigencia: </Text>
            15 días naturales a partir de la fecha de emisión.
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text>{EMISOR.razonSocial}</Text>
            <Text>RFC: {EMISOR.rfc}</Text>
          </View>
          <View style={styles.footerRow}>
            <Text>
              {EMISOR.regimen} · Domicilio fiscal: {EMISOR.domicilio}
            </Text>
            <Text>cwf.com.mx · 999 130 6399</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCotizacionPdf(data: CwfCotizacion): Promise<Buffer> {
  const buf = await renderToBuffer(<CotizacionPdfDocument data={data} />);
  return Buffer.from(buf);
}
