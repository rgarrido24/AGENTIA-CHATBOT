import type { Alumno } from '@/lib/mock-data-cobranza';

export type CfdiPdfPayload = {
  folio: string;
  uuid: string;
  fecha: string;
  rfcReceptor: string;
  razonSocial: string;
  concepto: string;
  subtotal: number;
  iva: number;
  total: number;
  aplicaIva: boolean;
  alumno?: Alumno | null;
};

const EMISOR_RFC = 'IEM240101AB3';
const EMISOR_NOMBRE = 'INSTITUTO MERIDIAN';

function mx(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function selloMock(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 20; i++) s += chars[(i * 7 + 13) % chars.length];
  return s;
}

export async function generarCfdiDemoPdf(payload: CfdiPdfPayload): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(EMISOR_NOMBRE, margin, 12);
  doc.setFontSize(9);
  doc.text(`RFC Emisor: ${EMISOR_RFC}`, margin, 20);
  doc.text('Régimen fiscal: 601 — General de Ley Personas Morales', margin, 26);

  doc.setTextColor(0, 0, 0);
  let y = 36;
  doc.setFontSize(11);
  doc.text('Comprobante Fiscal Digital por Internet (CFDI 4.0)', margin, y);
  y += 7;
  doc.setFontSize(9);
  doc.text(`Folio: ${payload.folio}`, margin, y);
  doc.text(`Fecha y hora de emisión: ${payload.fecha}`, pageW - margin, y, { align: 'right' });
  y += 6;
  doc.text(`UUID (Folio fiscal): ${payload.uuid}`, margin, y);
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFontSize(10);
  doc.text('Receptor', margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.text(`RFC: ${payload.rfcReceptor}`, margin, y);
  y += 5;
  doc.text(`Nombre / Razón social: ${payload.razonSocial}`, margin, y, { maxWidth: pageW - 2 * margin });
  y += 12;

  autoTable(doc, {
    startY: y,
    head: [['Clave SAT', 'Descripción', 'Cantidad', 'Valor unitario', 'Importe']],
    body: [
      [
        '86101500',
        'Servicios de educación — ' + payload.concepto.replace(/^Servicios educativos\s*-?\s*/i, ''),
        '1',
        mx(payload.subtotal),
        mx(payload.subtotal),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, textColor: [0, 0, 0] },
  });

  const yAfter = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  let yy = yAfter;

  doc.setFontSize(9);
  doc.text(`Subtotal: ${mx(payload.subtotal)}`, pageW - margin, yy, { align: 'right' });
  yy += 5;
  if (payload.aplicaIva) {
    doc.text(`IVA 16%: ${mx(payload.iva)}`, pageW - margin, yy, { align: 'right' });
    yy += 5;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${mx(payload.total)}`, pageW - margin, yy, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  yy += 10;

  doc.setDrawColor(180, 180, 180);
  doc.rect(margin, yy, 40, 40);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Código QR de', margin + 20, yy + 16, { align: 'center' });
  doc.text('verificación SAT', margin + 20, yy + 22, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  yy += 48;
  doc.setFontSize(8);
  doc.text(
    'Sello digital del CFDI (simulado): ' + selloMock() + '…',
    margin,
    yy,
    { maxWidth: pageW - 2 * margin }
  );
  yy += 8;
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text('Este documento es una representación impresa de un CFDI.', margin, yy, {
    maxWidth: pageW - 2 * margin,
  });
  yy += 6;
  doc.text('Generado en modo demo por Agentia Cobranza.', margin, yy);

  const safe = (payload.alumno?.nombre ?? payload.razonSocial).replace(/[^\w\u00C0-\u024f]+/g, '-').slice(0, 40);
  doc.save(`CFDI-demo-${payload.folio}-${safe}.pdf`);
}
