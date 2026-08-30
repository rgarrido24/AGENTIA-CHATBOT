import type { Alumno } from '@/lib/mock-data-cobranza';

function mx(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

/** Genera y descarga PDF estado de cuenta (importar solo desde componentes cliente) */
export async function generarEstadoCuentaPdf(al: Alumno) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('INSTITUTO MERIDIAN', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text('Estado de Cuenta', pageW / 2, 26, { align: 'center' });

  const ahora = new Date().toLocaleString('es-MX');
  doc.setFontSize(9);
  doc.text(`Fecha de generación: ${ahora}`, 14, 36);
  doc.text(`Folio: ${al.id}`, pageW - 14, 36, { align: 'right' });

  autoTable(doc, {
    startY: 42,
    head: [['Campo', 'Valor']],
    body: [
      ['Nombre del alumno', al.nombre],
      ['Carrera', al.carrera],
      ['Tutor responsable', al.tutor],
      ['Teléfono', al.telefono],
      ['Ciclo', al.ciclo],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    styles: { fontSize: 10, textColor: [0, 0, 0] },
  });

  const cicloNum = Number.parseInt(al.ciclo.replace(/\D/g, ''), 10) || 1;
  const meses = Math.min(3, cicloNum);
  const body: string[][] = [];
  let sub = 0;
  for (let m = 1; m <= meses; m++) {
    sub += al.montoColegiatura;
    body.push([`Colegiatura mes ${m}`, mx(al.montoColegiatura)]);
  }
  const recargo = al.diasAtraso > 30 ? sub * 0.05 : 0;
  if (recargo > 0) {
    body.push([`Recargo 5% (mora > 30 días)`, mx(recargo)]);
  }
  const total = sub + recargo;
  body.push(['TOTAL', mx(total)]);

  const y0 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y0 + 10,
    head: [['Concepto', 'Monto']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    styles: { fontSize: 10, textColor: [0, 0, 0] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(
    'Formas de pago: transferencia SPEI, tarjeta en caja Meridian y enlace de pago seguro enviado por su asesor.',
    14,
    y1 + 14,
    { maxWidth: pageW - 28 }
  );

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'Este documento es informativo y no sustituye el contrato de inscripción. ' +
      `Folio ${al.id} — Instituto Meridian © ${new Date().getFullYear()}`,
    14,
    280,
    { maxWidth: pageW - 28 }
  );

  const safeName = al.nombre.replace(/[^\w\u00C0-\u024f]+/g, '-').slice(0, 40);
  doc.save(`estado-cuenta-${safeName}.pdf`);
}
