import type { Ingrediente } from '@/lib/mock-data-restaurante';
import type { MovimientoCaja } from '@/lib/mock-data-restaurante';

function mx(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export async function generarCorteCajaPdf(params: {
  movimientos: MovimientoCaja[];
  totalIngresos: number;
  totalEgresos: number;
  fondo: number;
  porMetodo: { efectivo: number; tarjeta: number; transferencia: number };
}) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('La Séptima Bar & Kitchen', pageW / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Reporte de corte de caja', pageW / 2, 17, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 32);

  const body = params.movimientos.map((m) => [
    m.hora,
    m.concepto,
    m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
    m.metodoPago ?? '—',
    mx(m.monto),
  ]);

  autoTable(doc, {
    startY: 38,
    head: [['Hora', 'Concepto', 'Tipo', 'Método', 'Monto']],
    body,
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    styles: { fontSize: 8, textColor: [0, 0, 0] },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total ingresos: ${mx(params.totalIngresos)}`, 14, y);
  doc.text(`Total egresos: ${mx(params.totalEgresos)}`, 14, y + 6);
  doc.text(`Fondo de caja: ${mx(params.fondo)}`, 14, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Total a retirar: ${mx(params.totalIngresos - params.totalEgresos - params.fondo)}`,
    14,
    y + 22
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Efectivo: ${mx(params.porMetodo.efectivo)} | Tarjeta: ${mx(params.porMetodo.tarjeta)} | Transferencia: ${mx(params.porMetodo.transferencia)}`,
    14,
    y + 32,
    { maxWidth: pageW - 28 }
  );
  doc.text('Firma del responsable: ___________________________', 14, y + 48);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento generado en demo Agentia Restaurante', 14, y + 58);

  doc.save(`corte-caja-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generarOrdenCompraPdf(items: Ingrediente[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.text('ORDEN DE COMPRA SUGERIDA — La Séptima', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 28);

  const body = items.map((i) => [
    i.nombre,
    i.unidad,
    String(Math.max(0, i.stockMinimo * 2 - i.stockActual)),
    mx(i.costoUnitario),
    i.proveedor,
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Ingrediente', 'Unidad', 'Cant. sugerida', 'Costo u.', 'Proveedor']],
    body,
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    styles: { fontSize: 9, textColor: [0, 0, 0] },
  });

  doc.setFontSize(8);
  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.text('Generado en demo Agentia Restaurante', 14, y);

  doc.save(`orden-compra-${new Date().toISOString().slice(0, 10)}.pdf`);
}
