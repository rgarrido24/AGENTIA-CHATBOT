import type { Consulta, Paciente } from '@/lib/mock-data-medico';

const VERIFY_BASE = 'https://agentia-chatbot-ventas.onrender.com/verificar/rx';

function mx(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const GREEN = [22, 163, 74] as const;

export async function generarExpedientePdfMedico(p: Paciente, consultas: Consulta[]) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(15);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text('Centro Médico Integral Salud+', pageW / 2, 16, { align: 'center' });
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
      ['Médico tratante', p.medicoTratante],
      ['Especialidad', p.especialidad],
      [
        'Contacto emergencia',
        `${p.contactoEmergencia.nombre} (${p.contactoEmergencia.parentesco}) ${p.contactoEmergencia.telefono}`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [GREEN[0], GREEN[1], GREEN[2]], textColor: 255 },
    styles: { fontSize: 9, textColor: [0, 0, 0] },
  });

  const y0 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  doc.setFontSize(10);
  doc.text('Últimas consultas', 14, y0 + 10);

  const ult5 = [...consultas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  const body = ult5.map((c) => [
    c.fecha,
    c.medico,
    c.motivo,
    c.diagnostico.slice(0, 36) + (c.diagnostico.length > 36 ? '…' : ''),
    `${c.signosVitales.presion} · FC ${c.signosVitales.fc}`,
    mx(c.costo),
    mx(c.pagado),
    mx(c.saldo),
  ]);

  autoTable(doc, {
    startY: y0 + 14,
    head: [['Fecha', 'Médico', 'Motivo', 'Dx', 'PA/FC', 'Costo', 'Pagado', 'Saldo']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [GREEN[0], GREEN[1], GREEN[2]], textColor: 255 },
    styles: { fontSize: 7, textColor: [0, 0, 0] },
  });

  const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Documento confidencial — Centro Médico Integral Salud+', pageW / 2, y1 + 12, { align: 'center' });

  doc.save(`expediente-${p.folio}.pdf`);
}

export type RecetaMedPdfInput = {
  paciente: Paciente;
  fecha: string;
  medico: string;
  cedula: string;
  cie10: string;
  cie10Label: string;
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
  diasReposo: number;
  restriccionesLaborales: string;
  // Auth level extras
  nivel?: 1 | 2 | 3;
  folio?: string;
  firmaBase64?: string;
  universidad?: string;
  especialidadReg?: string;
  efirmaSimulada?: boolean;
};

export async function generarRecetaPdfMedico(data: RecetaMedPdfInput) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const nivel = data.nivel ?? 1;
  const folio = data.folio ?? `RX-2025-${Math.floor(1000 + Math.random() * 9000)}`;
  const verifyUrl = `${VERIFY_BASE}/${folio}`;

  // ── Nivel 3 sello ──────────────────────────────────────────────────────────
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
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text('CENTRO MÉDICO INTEGRAL SALUD+', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.medico} · Cédula Prof.: ${data.cedula}`, pageW / 2, 26, { align: 'center' });
  doc.text('Tel: 999-000-2222 · contacto@saludplus.mx', pageW / 2, 32, { align: 'center' });
  doc.line(14, 36, pageW - 14, 36);

  doc.setFontSize(12);
  doc.text('RECETA MÉDICA', 14, 46);
  doc.text(`Fecha: ${data.fecha}`, pageW - 14, 46, { align: 'right' });

  doc.setFontSize(10);
  doc.text(`Paciente: ${data.paciente.nombre}`, 14, 56);
  doc.text(`Edad: ${data.paciente.edad} años`, pageW - 14, 56, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text(`CIE-10: ${data.cie10} — ${data.cie10Label}`, 14, 64);
  doc.setTextColor(0, 0, 0);
  doc.line(14, 68, pageW - 14, 68);
  let y = 76;
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
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Reposo (días):', 14, y);
  doc.text(String(data.diasReposo), 50, y);
  y += 8;
  doc.text('Restricciones laborales / incapacidad:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.restriccionesLaborales || '—', 14, y, { maxWidth: pageW - 28 });
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Indicaciones generales:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.indicacionesGenerales, 14, y, { maxWidth: pageW - 28 });
  y += 14;

  // ── Firma section ──────────────────────────────────────────────────────────
  if (nivel >= 2 && data.firmaBase64) {
    doc.setFont('helvetica', 'bold');
    doc.text(data.medico, 14, y);
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

  // ── Footer: folio + QR ─────────────────────────────────────────────────────
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
  doc.setTextColor(22, 163, 74);
  doc.text(verifyUrl, 42, footerY + 26);
  doc.setTextColor(0, 0, 0);

  doc.save(`receta-${data.paciente.folio}.pdf`);
}

export type IncapacidadPdfInput = {
  paciente: Paciente;
  fecha: string;
  medico: string;
  cedula: string;
  cie10: string;
  cie10Label: string;
  diasIncapacidad: number;
  diagnostico: string;
};

export async function generarIncapacidadPdf(data: IncapacidadPdfInput) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text('CENTRO MÉDICO INTEGRAL SALUD+', pageW / 2, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('CONSTANCIA DE INCAPACIDAD LABORAL', pageW / 2, 30, { align: 'center' });
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, 38, pageW - 28, 100);

  doc.setFontSize(10);
  let y = 48;
  doc.text(`Fecha de emisión: ${data.fecha}`, 20, y);
  y += 10;
  doc.text(`Paciente: ${data.paciente.nombre}`, 20, y);
  y += 8;
  doc.text(`Edad: ${data.paciente.edad} años    Sexo: ${data.paciente.sexo === 'F' ? 'Femenino' : 'Masculino'}`, 20, y);
  y += 8;
  doc.text(`Identificación expediente: ${data.paciente.folio}`, 20, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico (CIE-10):', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.cie10} — ${data.cie10Label}`, 20, y);
  y += 6;
  doc.text(data.diagnostico, 20, y, { maxWidth: pageW - 40 });
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.text(`Días de incapacidad: ${data.diasIncapacidad} días naturales`, 20, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.text(
    'El suscrito médico certifica que el paciente requiere reposo e incapacidad temporal para el desempeño de sus actividades laborales, en los términos señalados.',
    20,
    y,
    { maxWidth: pageW - 40 }
  );
  y += 28;
  doc.text(`${data.medico}`, 20, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Cédula profesional: ${data.cedula}`, 20, y);
  y += 20;
  doc.text('_______________________________', 20, y);
  y += 6;
  doc.text('Nombre y firma del médico', 20, y);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Documento informativo para fines de demostración — no constituye documento fiscal.', pageW / 2, 270, {
    align: 'center',
  });

  doc.save(`incapacidad-${data.paciente.folio}.pdf`);
}
