import type { Consulta, Paciente } from '@/lib/mock-data-dentista';

function mx(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export async function generarExpedientePdf(p: Paciente, consultas: Consulta[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(15);
  doc.setTextColor(2, 132, 199);
  doc.text('Clínica Dental Sonrisa Perfecta', pageW / 2, 16, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Expediente clínico', pageW / 2, 24, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Folio: ${p.folio}`, pageW - 14, 32, { align: 'right' });
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 32);

  const alerg = p.alergias.filter((a) => a !== 'Ninguna').join(', ') || 'Ninguna declarada';
  const enf = p.enfermedades.filter((e) => e !== 'Ninguna').join(', ') || 'Ninguno';
  const med = p.medicamentos.filter((m) => m !== 'Ninguno').join(', ') || 'Ninguno';

  doc.setFillColor(254, 226, 226);
  doc.rect(14, 36, pageW - 28, 28, 'F');
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(10);
  doc.text('ALERTAS MÉDICAS', 16, 44);
  doc.setFontSize(9);
  doc.text(`Alergias: ${alerg}`, 16, 50);
  doc.text(`Padecimientos: ${enf}`, 16, 55);
  doc.text(`Medicamentos actuales: ${med}`, 16, 60);
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 68,
    head: [['Campo', 'Valor']],
    body: [
      ['Nombre', p.nombre],
      ['Fecha de nacimiento', p.fechaNacimiento],
      ['Edad', `${p.edad} años`],
      ['Sexo', p.sexo === 'F' ? 'Femenino' : 'Masculino'],
      ['Teléfono', p.telefono],
      ['Email', p.email],
      ['Grupo sanguíneo', p.grupoSanguineo],
      ['Dentista tratante', p.dentistaTratante],
      [
        'Contacto emergencia',
        `${p.contactoEmergencia.nombre} (${p.contactoEmergencia.parentesco}) ${p.contactoEmergencia.telefono}`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199], textColor: 255 },
    styles: { fontSize: 9, textColor: [0, 0, 0] },
  });

  const y0 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(10);
  doc.text('Últimas consultas', 14, y0 + 10);

  const ult5 = [...consultas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  const body = ult5.map((c) => [
    c.fecha,
    c.dentista,
    c.motivo,
    c.diagnostico.slice(0, 40) + (c.diagnostico.length > 40 ? '…' : ''),
    mx(c.costo),
    mx(c.pagado),
    mx(c.saldo),
  ]);

  autoTable(doc, {
    startY: y0 + 14,
    head: [['Fecha', 'Dentista', 'Motivo', 'Diagnóstico', 'Costo', 'Pagado', 'Saldo']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [2, 132, 199], textColor: 255 },
    styles: { fontSize: 7, textColor: [0, 0, 0] },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento confidencial — Clínica Dental Sonrisa Perfecta', pageW / 2, y1 + 12, { align: 'center' });

  doc.save(`expediente-${p.folio}.pdf`);
}

const VERIFY_BASE = 'https://agentia-chatbot-ventas.onrender.com/verificar/rx';

export type RecetaPdfInput = {
  paciente: Paciente;
  fecha: string;
  dentista: string;
  cedula: string;
  medicamentos: Array<{
    nombre: string;
    presentacion: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
    indicaciones: string;
  }>;
  indicacionesGenerales: string;
  diagnostico: string;
  // Auth level extras
  nivel?: 1 | 2 | 3;
  folio?: string;
  firmaBase64?: string;
  universidad?: string;
  especialidadReg?: string;
  efirmaSimulada?: boolean;
};

export async function generarRecetaPdf(data: RecetaPdfInput) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const nivel = data.nivel ?? 1;
  const folio = data.folio ?? `RX-2025-${Math.floor(1000 + Math.random() * 9000)}`;
  const verifyUrl = `${VERIFY_BASE}/${folio}`;

  // ── Nivel 3 sello (upper-right stamp) ─────────────────────────────────────
  if (nivel === 3 && data.efirmaSimulada) {
    const hashMock = Math.random().toString(36).substring(2, 10).toUpperCase();
    doc.setFillColor(30, 58, 95);
    doc.rect(155, 8, 41, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('FIRMADO CON', 175.5, 14, { align: 'center' });
    doc.text('e.firma SAT', 175.5, 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Folio SAT:', 175.5, 24, { align: 'center' });
    doc.text(hashMock, 175.5, 29, { align: 'center' });
    doc.text('Válido legalmente', 175.5, 34, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(2, 132, 199);
  doc.text('CLÍNICA DENTAL SONRISA PERFECTA', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.dentista} · Cédula Prof.: ${data.cedula}`, pageW / 2, 26, { align: 'center' });
  doc.text('Tel: 999-000-1111 · dir@clinica.com', pageW / 2, 32, { align: 'center' });
  doc.line(14, 36, pageW - 14, 36);

  doc.setFontSize(12);
  doc.text('RECETA MÉDICA', 14, 46);
  doc.text(`Fecha: ${data.fecha}`, pageW - 14, 46, { align: 'right' });

  doc.setFontSize(10);
  doc.text(`Paciente: ${data.paciente.nombre}`, 14, 56);
  doc.text(`Edad: ${data.paciente.edad} años`, pageW - 14, 56, { align: 'right' });

  doc.line(14, 62, pageW - 14, 62);
  let y = 70;
  doc.setFontSize(10);
  doc.text('Rx:', 14, y);
  y += 8;

  data.medicamentos.forEach((m, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${m.nombre} ${m.presentacion}`, 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Tomar ${m.dosis} ${m.frecuencia} por ${m.duracion}`, 18, y);
    y += 5;
    doc.text(m.indicaciones, 18, y);
    y += 10;
  });

  doc.line(14, y, pageW - 14, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.diagnostico, 14, y, { maxWidth: pageW - 28 });
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Indicaciones generales:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.indicacionesGenerales, 14, y, { maxWidth: pageW - 28 });
  y += 14;

  // ── Firma section ──────────────────────────────────────────────────────────
  if (nivel >= 2 && data.firmaBase64) {
    doc.setFont('helvetica', 'bold');
    doc.text(data.dentista, 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Cédula Prof.: ${data.cedula}`, 14, y);
    if (data.universidad) {
      doc.text(data.universidad, pageW / 2, y);
    }
    y += 6;
    if (data.especialidadReg) {
      doc.text(data.especialidadReg, 14, y);
      y += 6;
    }
    try {
      const fmt = data.firmaBase64.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      doc.addImage(data.firmaBase64, fmt, 14, y, 50, 20);
    } catch {}
    y += 22;
    doc.setDrawColor(100, 100, 100);
    doc.line(14, y, 70, y);
    y += 4;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Firma digital del médico', 14, y);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.text('_________________________', 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.text('Firma y sello del médico', 14, y);
  }

  // ── Footer: folio + QR ────────────────────────────────────────────────────
  const footerY = pageH - 36;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY, pageW - 14, footerY);

  try {
    const QRCode = await import('qrcode');
    const qrDataUrl: string = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', 14, footerY + 3, 22, 22);
  } catch {}

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(`Folio: ${folio}`, 42, footerY + 8);
  doc.text(`Emitida: ${new Date().toLocaleString('es-MX')}`, 42, footerY + 14);
  doc.text('Verificar autenticidad en:', 42, footerY + 20);
  doc.setTextColor(2, 132, 199);
  doc.text(verifyUrl, 42, footerY + 26);
  doc.setTextColor(0, 0, 0);

  doc.save(`receta-${data.paciente.folio}.pdf`);
}
