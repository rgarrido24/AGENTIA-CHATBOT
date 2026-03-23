import type { ItemInventario } from '@/lib/mock-data-taller';
import type { MovimientoCaja } from '@/lib/mock-data-taller';
import { BRAND_TALLER } from '@/lib/mock-data-taller';

function mx(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const ACCENT_RGB: [number, number, number] = [71, 85, 105];

export type PresupuestoPdfInput = {
  folio: string;
  fecha: string;
  validoHasta: string;
  cliente: { nombre: string; telefono: string };
  vehiculo: {
    marca: string;
    modelo: string;
    año: number;
    placa: string;
    color: string;
    km: number;
  };
  problema: string;
  trabajos: Array<{ descripcion: string; horas: number; costo: number }>;
  refacciones: Array<{ nombre: string; cantidad: number; pu: number; total: number }>;
  notas: string;
  tiempoEstimadoTotal: string;
  manoObra: number;
  subtotalRefacciones: number;
  ivaPct: number;
  incluirIva: boolean;
};

export async function generarPresupuestoPdf(p: PresupuestoPdfInput) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT_RGB);
  doc.rect(0, 0, pageW, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('AUTOPRO — SERVICIO CONFIABLE', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`RFC: ${BRAND_TALLER.rfc}  Tel: ${BRAND_TALLER.tel}`, pageW / 2, 17, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let y = 32;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESUPUESTO DE SERVICIO', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Folio: ${p.folio}`, pageW - 14, y, { align: 'right' });
  y += 6;
  doc.setFontSize(9);
  doc.text(`Fecha: ${p.fecha}`, 14, y);
  doc.text(`Válido hasta: ${p.validoHasta}`, pageW - 14, y, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('VEHÍCULO', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.setFontSize(8);
  doc.text(
    `${p.vehiculo.marca} ${p.vehiculo.modelo} ${p.vehiculo.año}  Placa: ${p.vehiculo.placa}`,
    14,
    y
  );
  y += 4;
  doc.text(`Color: ${p.vehiculo.color}  Km entrada: ${p.vehiculo.km.toLocaleString('es-MX')}`, 14, y);
  y += 4;
  doc.text(`Cliente: ${p.cliente.nombre}  Tel: ${p.cliente.telefono}`, 14, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Problema reportado', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 4;
  doc.text(p.problema, 14, y, { maxWidth: pageW - 28 });
  y += 12;

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Hrs', 'Costo']],
    body: p.trabajos.map((t) => [t.descripcion, String(t.horas), mx(t.costo)]),
    headStyles: { fillColor: ACCENT_RGB, textColor: 255 },
    styles: { fontSize: 8 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.text('REFACCIONES', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Refacción', 'Cant', 'P.U.', 'Total']],
    body: p.refacciones.map((r) => [
      r.nombre,
      String(r.cantidad),
      mx(r.pu),
      mx(r.total),
    ]),
    headStyles: { fillColor: ACCENT_RGB, textColor: 255 },
    styles: { fontSize: 8 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  const sub = p.manoObra + p.subtotalRefacciones;
  const iva = p.incluirIva ? sub * (p.ivaPct / 100) : 0;
  const total = sub + iva;

  doc.setFontSize(9);
  doc.text(`Mano de obra:  ${mx(p.manoObra)}`, 14, y);
  y += 5;
  doc.text(`Refacciones:   ${mx(p.subtotalRefacciones)}`, 14, y);
  y += 5;
  doc.text(`Subtotal:      ${mx(sub)}`, 14, y);
  y += 5;
  if (p.incluirIva) {
    doc.text(`IVA ${p.ivaPct}%:       ${mx(iva)}`, 14, y);
    y += 5;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:         ${mx(total)}`, 14, y);
  doc.setFont('helvetica', 'normal');
  y += 10;

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text(`Tiempo estimado total: ${p.tiempoEstimadoTotal}`, 14, y);
  y += 4;
  doc.text(
    'GARANTÍA: 30 días o 3,000 km en mano de obra',
    14,
    y
  );
  y += 4;
  doc.text(
    'Nota: Precios sujetos a cambio si se detectan fallas adicionales durante el servicio.',
    14,
    y,
    { maxWidth: pageW - 28 }
  );
  y += 8;
  if (p.notas.trim()) {
    doc.setFontSize(7);
    doc.text(`Notas: ${p.notas}`, 14, y, { maxWidth: pageW - 28 });
    y += 10;
  }
  doc.setFontSize(7);
  doc.text('Acepto el presupuesto: ___________________________', 14, y);
  y += 5;
  doc.text('Firma del cliente', 14, y);

  doc.save(`presupuesto-${p.folio}.pdf`);
}

export async function generarOrdenCompraRefaccionesPdf(items: ItemInventario[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT_RGB);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('AutoPro — Orden de compra a proveedor', pageW / 2, 12, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 28);

  const crit = items.filter((i) => i.stock <= i.minimo);
  const body = crit.map((i) => [
    i.nombre,
    i.categoria,
    String(Math.max(0, i.minimo * 2 - i.stock)),
    mx(i.precioCompra),
    i.proveedor,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Refacción', 'Categoría', 'Cant. sugerida', 'P. compra u.', 'Proveedor']],
    body,
    headStyles: { fillColor: ACCENT_RGB, textColor: 255 },
    styles: { fontSize: 8 },
  });

  doc.save(`orden-compra-refacciones-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generarCorteCajaTallerPdf(params: {
  movimientos: MovimientoCaja[];
  totalIngresos: number;
  totalEgresos: number;
  fondo: number;
  porMetodo: { efectivo: number; tarjeta: number; transferencia: number };
  porRubro: { mano_obra: number; refacciones: number; otro: number };
}) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT_RGB);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('AutoPro Taller', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Corte de caja — desglose MO vs refacciones', pageW / 2, 17, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 32);

  const body = params.movimientos.map((m) => [
    m.hora,
    m.concepto,
    m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
    m.metodoPago ?? '—',
    m.rubro ?? '—',
    mx(m.monto),
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Hora', 'Concepto', 'Tipo', 'Método', 'Rubro', 'Monto']],
    body,
    headStyles: { fillColor: ACCENT_RGB, textColor: 255 },
    styles: { fontSize: 7 },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(`Ingresos mano de obra: ${mx(params.porRubro.mano_obra)}`, 14, y);
  doc.text(`Ingresos refacciones: ${mx(params.porRubro.refacciones)}`, 14, y + 5);
  doc.text(`Otros ingresos: ${mx(params.porRubro.otro)}`, 14, y + 10);
  doc.text(`Total ingresos: ${mx(params.totalIngresos)}`, 14, y + 18);
  doc.text(`Total egresos: ${mx(params.totalEgresos)}`, 14, y + 24);
  doc.text(`Fondo: ${mx(params.fondo)}`, 14, y + 30);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Efectivo ${mx(params.porMetodo.efectivo)} | Tarjeta ${mx(params.porMetodo.tarjeta)} | Transferencia ${mx(params.porMetodo.transferencia)}`,
    14,
    y + 38,
    { maxWidth: pageW - 28 }
  );
  doc.setFont('helvetica', 'normal');
  doc.save(`corte-caja-taller-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generarOrdenSalidaPdf(p: {
  folio: string;
  cliente: string;
  vehiculo: string;
  placa: string;
  total: number;
  trabajos: string[];
  garantia: string;
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...ACCENT_RGB);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('ORDEN DE SALIDA — AutoPro', pageW / 2, 12, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let y = 30;
  doc.setFontSize(10);
  doc.text(`Folio: ${p.folio}`, 14, y);
  y += 8;
  doc.text(`Cliente: ${p.cliente}`, 14, y);
  y += 6;
  doc.text(`Vehículo: ${p.vehiculo}  Placa: ${p.placa}`, 14, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Trabajos realizados', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  for (const t of p.trabajos) {
    doc.text(`• ${t}`, 14, y);
    y += 5;
  }
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total pagado: ${mx(p.total)}`, 14, y);
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.setFontSize(8);
  doc.text(`Garantía: ${p.garantia}`, 14, y);
  doc.save(`orden-salida-${p.folio}.pdf`);
}
