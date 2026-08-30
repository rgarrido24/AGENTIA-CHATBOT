export type NivelAutenticidad = 1 | 2 | 3;

export type VerificationRecord = {
  folio: string;
  medico: string;
  cedula: string;
  especialidad: string;
  paciente: string;
  fecha: string;
  nivel: NivelAutenticidad;
};

export const MOCK_FOLIOS: VerificationRecord[] = [
  { folio: 'RX-2025-0001', medico: 'Dr. Ramón Vega Torres',   cedula: '9876543', especialidad: 'Medicina General',     paciente: 'María López H.',      fecha: '2025-03-01', nivel: 2 },
  { folio: 'RX-2025-0042', medico: 'Dra. Ana Molina Ruiz',    cedula: '5432167', especialidad: 'Cardiología',          paciente: 'Juan García Pérez',   fecha: '2025-03-05', nivel: 2 },
  { folio: 'RX-2025-0113', medico: 'Dr. Carlos Herrera',      cedula: '1234567', especialidad: 'Odontología General', paciente: 'Luis Fernández M.',   fecha: '2025-03-10', nivel: 1 },
  { folio: 'RX-2025-0284', medico: 'Dra. Sofía Castillo',     cedula: '8765432', especialidad: 'Pediatría',           paciente: 'Valeria Torres R.',   fecha: '2025-03-12', nivel: 2 },
  { folio: 'RX-2025-0395', medico: 'Dr. Ramón Vega Torres',   cedula: '9876543', especialidad: 'Medicina General',     paciente: 'Arturo Jiménez',      fecha: '2025-03-14', nivel: 3 },
  { folio: 'RX-2025-0467', medico: 'Dr. Carlos Herrera',      cedula: '1234567', especialidad: 'Odontología General', paciente: 'Cristina Medina',     fecha: '2025-03-15', nivel: 1 },
  { folio: 'RX-2025-0512', medico: 'Dra. Ana Molina Ruiz',    cedula: '5432167', especialidad: 'Cardiología',          paciente: 'Roberto Sánchez',     fecha: '2025-03-17', nivel: 2 },
  { folio: 'RX-2025-0603', medico: 'Dra. Sofía Castillo',     cedula: '8765432', especialidad: 'Pediatría',           paciente: 'Miguel Rodríguez',    fecha: '2025-03-18', nivel: 3 },
  { folio: 'RX-2025-0711', medico: 'Dr. Ramón Vega Torres',   cedula: '9876543', especialidad: 'Medicina General',     paciente: 'Carmen López',        fecha: '2025-03-19', nivel: 2 },
  { folio: 'RX-2025-0825', medico: 'Dr. Carlos Herrera',      cedula: '1234567', especialidad: 'Odontología General', paciente: 'Elena Martínez',      fecha: '2025-03-20', nivel: 1 },
];

export function findFolio(folio: string): VerificationRecord | undefined {
  return MOCK_FOLIOS.find((r) => r.folio.toUpperCase() === folio.toUpperCase());
}

export function nivelLabel(n: NivelAutenticidad): string {
  if (n === 1) return 'Básico (QR)';
  if (n === 2) return 'Profesional (QR + Firma digital)';
  return 'e.firma SAT — Validez legal plena';
}
