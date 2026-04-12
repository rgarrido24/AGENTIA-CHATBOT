/**
 * Demo Clínica Dental Sonrisa Perfecta
 */
import { addDays, formatISODate, parseISODate, startOfWeekMonday } from '@/lib/mock-data-spa';

export { addDays, formatISODate, parseISODate, startOfWeekMonday };

export const BRAND_DENTAL = {
  nombre: 'Clínica Dental Sonrisa Perfecta',
  corto: 'Sonrisa Perfecta',
} as const;

export const ACCENT_DENTAL = '#0284c7';

export const DENTISTAS = [
  { id: 'dr1', nombre: 'Dr. Ramón Vega', especialidad: 'Odontología general' },
  { id: 'dr2', nombre: 'Dra. Patricia Luna', especialidad: 'Ortodoncia' },
  { id: 'dr3', nombre: 'Dr. Carlos Soto', especialidad: 'Endodoncia e implantes' },
] as const;

export type NivelPaciente = 'Nuevo' | 'Regular' | 'VIP';

export type Radiografia = {
  id: string;
  nombre: string;
  fecha: string;
  tipo: 'periapical' | 'panoramica' | 'bitewing' | 'cefalometrica';
  diente?: string;
  notas?: string;
  url: string;
  soloDoctor: true;
};

export type FotoEvolucion = {
  id: string;
  fecha: string;
  tipo: 'antes' | 'durante' | 'despues';
  descripcion: string;
  url: string;
  tratamiento: string;
  visible: 'ambos';
};

export type Paciente = {
  id: string;
  folio: string;
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  telefono: string;
  email: string;
  sexo: 'M' | 'F';
  alergias: string[];
  enfermedades: string[];
  medicamentos: string[];
  grupoSanguineo: string;
  contactoEmergencia: { nombre: string; telefono: string; parentesco: string };
  dentistaTratante: string;
  nivel: NivelPaciente;
  deuda: number;
  radiografias: Radiografia[];
  fotosEvolucion: FotoEvolucion[];
};

export type MedicamentoReceta = {
  nombre: string;
  dosis: string;
  frecuencia: string;
  dias: number;
};

export type Consulta = {
  id: string;
  pacienteId: string;
  dentista: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  tratamientoRealizado: string;
  tratamientoPendiente: string;
  notasEvolucion: string;
  medicamentosRecetados: MedicamentoReceta[];
  proximaCita: string;
  costo: number;
  pagado: number;
  saldo: number;
  archivos: string[];
};

export type TipoCita =
  | 'Revisión'
  | 'Limpieza'
  | 'Extracción'
  | 'Endodoncia'
  | 'Ortodoncia'
  | 'Implante'
  | 'Blanqueamiento'
  | 'Urgencia';

export type StatusCita = 'confirmada' | 'pendiente' | 'completada' | 'cancelada';

export type Cita = {
  id: string;
  pacienteId: string;
  dentista: string;
  fecha: string;
  hora: string;
  duracion: number;
  tipo: TipoCita;
  status: StatusCita;
  costo: number;
  notas: string;
};

export type EstadoDiente = 'sano' | 'previo' | 'requiere' | 'ausente' | 'implante';

/** FDI 11-18, 21-28, 31-38, 41-48 */
export const DIENTES_FDI = [
  ...Array.from({ length: 8 }, (_, i) => 18 - i),
  ...Array.from({ length: 8 }, (_, i) => 21 + i),
  ...Array.from({ length: 8 }, (_, i) => 31 + i),
  ...Array.from({ length: 8 }, (_, i) => 48 - i),
];

export type OdontogramaData = {
  estados: Record<string, EstadoDiente>;
  notas: Record<string, string>;
};

export type RecetaHistorial = {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  fecha: string;
  dentista: string;
  diagnostico: string;
};

export type PagoRegistro = {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  monto: number;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  referencia?: string;
  fecha: string;
};

export const HOY_DENT = '2026-03-20';

const nombres = [
  'María López Hernández',
  'Jorge Castillo Ruiz',
  'Ana Patricia Morales',
  'Luis Fernando Díaz',
  'Gabriela Soto Vega',
  'Roberto Núñez Lara',
  'Fernanda Jiménez',
  'Carlos Mendoza',
  'Lucía Herrera',
  'Miguel Ángel Torres',
  'Patricia Ríos',
  'Daniel Vega',
  'Sofía Campos',
  'Héctor Flores',
  'Valentina Cruz',
  'Andrea Medina',
  'Diego Ramírez',
  'Mónica Espinosa',
  'Ricardo Luna',
  'Elena Vázquez',
];

const niveles: NivelPaciente[] = [
  ...Array(6).fill('Nuevo' as NivelPaciente),
  ...Array(10).fill('Regular' as NivelPaciente),
  ...Array(4).fill('VIP' as NivelPaciente),
];

const dentistasRot = DENTISTAS.map((d) => d.nombre);

function edadDe(fechaNac: string): number {
  const a = parseISODate(fechaNac);
  const h = parseISODate(HOY_DENT);
  let e = h.getFullYear() - a.getFullYear();
  const m = h.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < a.getDate())) e--;
  return e;
}

function mkOdontograma(seed: number): OdontogramaData {
  const estados: Record<string, EstadoDiente> = {};
  const notas: Record<string, string> = {};
  const opts: EstadoDiente[] = ['sano', 'sano', 'sano', 'previo', 'requiere', 'ausente', 'implante'];
  DIENTES_FDI.forEach((n, i) => {
    const k = String(n);
    estados[k] = opts[(seed + i * 3) % opts.length]!;
    if (estados[k] === 'previo') notas[k] = 'Corona porcelana 2023';
    if (estados[k] === 'requiere') notas[k] = 'Caries a valorar';
    if (estados[k] === 'implante') notas[k] = 'Implante 2024';
    if (estados[k] === 'ausente') notas[k] = 'Extraído 2022';
  });
  return { estados, notas };
}

const RADIOGRAFIAS_MOCK: Record<string, Radiografia[]> = {
  p1: [
    { id: 'rx-p1-1', nombre: 'Periapical molar superior', fecha: '2026-01-15', tipo: 'periapical', diente: '16', notas: 'Control post-extracción molar superior derecho', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Periapical', soloDoctor: true },
    { id: 'rx-p1-2', nombre: 'Panorámica general', fecha: '2025-08-10', tipo: 'panoramica', notas: 'Evaluación general. Se observan terceros molares retenidos', url: 'https://placehold.co/800x400/1a1a2e/ffffff?text=Rx+Panoramica', soloDoctor: true },
    { id: 'rx-p1-3', nombre: 'Bitewing interproximal', fecha: '2025-11-20', tipo: 'bitewing', diente: '14, 15', notas: 'Revisión caries interproximal premolares', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Bitewing', soloDoctor: true },
  ],
  p2: [
    { id: 'rx-p2-1', nombre: 'Panorámica ortodoncia', fecha: '2025-06-01', tipo: 'panoramica', notas: 'Inicio tratamiento ortodoncia. Base inicial', url: 'https://placehold.co/800x400/1a1a2e/ffffff?text=Rx+Panoramica', soloDoctor: true },
    { id: 'rx-p2-2', nombre: 'Cefalométrica lateral', fecha: '2025-06-01', tipo: 'cefalometrica', notas: 'Análisis cefalométrico clase II esqueletal', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Bitewing', soloDoctor: true },
  ],
  p3: [
    { id: 'rx-p3-1', nombre: 'Periapical endodoncia 36', fecha: '2026-02-05', tipo: 'periapical', diente: '36', notas: 'Pre-endodoncia. Lesión periapical visible', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Periapical', soloDoctor: true },
    { id: 'rx-p3-2', nombre: 'Periapical control 36', fecha: '2026-03-10', tipo: 'periapical', diente: '36', notas: 'Post-endodoncia. Buena condensación. Sin lesión activa', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Periapical', soloDoctor: true },
    { id: 'rx-p3-3', nombre: 'Bitewing sector posterior', fecha: '2025-09-14', tipo: 'bitewing', diente: '35, 36, 37', notas: 'Revisión caries secundarias sector posterior izquierdo', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Bitewing', soloDoctor: true },
  ],
  p4: [
    { id: 'rx-p4-1', nombre: 'Panorámica implante', fecha: '2025-12-03', tipo: 'panoramica', notas: 'Planificación implante zona 46. Buena densidad ósea', url: 'https://placehold.co/800x400/1a1a2e/ffffff?text=Rx+Panoramica', soloDoctor: true },
    { id: 'rx-p4-2', nombre: 'Periapical post-implante', fecha: '2026-02-20', tipo: 'periapical', diente: '46', notas: 'Control osteointegración implante. Sin signos de rechazo', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Periapical', soloDoctor: true },
  ],
  p5: [
    { id: 'rx-p5-1', nombre: 'Bitewing bilateral', fecha: '2026-01-08', tipo: 'bitewing', notas: 'Revisión anual. Pequeña caries incipiente en 25', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Bitewing', soloDoctor: true },
    { id: 'rx-p5-2', nombre: 'Panorámica control', fecha: '2025-07-22', tipo: 'panoramica', notas: 'Sin novedades. Terceros molares en posición correcta', url: 'https://placehold.co/800x400/1a1a2e/ffffff?text=Rx+Panoramica', soloDoctor: true },
    { id: 'rx-p5-3', nombre: 'Periapical sector anterior', fecha: '2025-10-30', tipo: 'periapical', diente: '11, 21', notas: 'Control post-blanqueamiento. Tejidos periodontales sanos', url: 'https://placehold.co/400x300/1a1a2e/ffffff?text=Rx+Periapical', soloDoctor: true },
  ],
};

const FOTOS_EVOLUCION_MOCK: Record<string, FotoEvolucion[]> = {
  p1: [
    { id: 'fe-p1-1', fecha: '2025-01-10', tipo: 'antes', descripcion: 'Apiñamiento dental severo, clase II canina bilateral', url: 'https://placehold.co/400x300/2d1b1b/ffffff?text=Antes', tratamiento: 'Ortodoncia metálica', visible: 'ambos' },
    { id: 'fe-p1-2', fecha: '2025-07-15', tipo: 'durante', descripcion: 'A 6 meses. Descruzamiento anterior logrado, alineación en progreso', url: 'https://placehold.co/400x300/1b2d1b/ffffff?text=Durante', tratamiento: 'Ortodoncia metálica', visible: 'ambos' },
    { id: 'fe-p1-3', fecha: '2026-03-10', tipo: 'despues', descripcion: 'Tratamiento finalizado. Alineación completa, oclusión clase I', url: 'https://placehold.co/400x300/1b1b2d/ffffff?text=Despues', tratamiento: 'Ortodoncia metálica', visible: 'ambos' },
  ],
  p2: [
    { id: 'fe-p2-1', fecha: '2025-06-01', tipo: 'antes', descripcion: 'Diastema central superior 3mm. Caninos retenidos', url: 'https://placehold.co/400x300/2d1b1b/ffffff?text=Antes', tratamiento: 'Ortodoncia + cirugía exposición caninos', visible: 'ambos' },
    { id: 'fe-p2-2', fecha: '2025-10-20', tipo: 'durante', descripcion: 'Cierre de diastema 60% completado. Caninos en erupción guiada', url: 'https://placehold.co/400x300/1b2d1b/ffffff?text=Durante', tratamiento: 'Ortodoncia + cirugía exposición caninos', visible: 'ambos' },
  ],
  p3: [
    { id: 'fe-p3-1', fecha: '2026-02-05', tipo: 'antes', descripcion: 'Tejidos inflamados. Caries avanzada molar 36 con absceso', url: 'https://placehold.co/400x300/2d1b1b/ffffff?text=Antes', tratamiento: 'Endodoncia + corona cerámica', visible: 'ambos' },
    { id: 'fe-p3-2', fecha: '2026-03-18', tipo: 'despues', descripcion: 'Molar restaurado con corona E-max. Tejidos periodontales sanos', url: 'https://placehold.co/400x300/1b1b2d/ffffff?text=Despues', tratamiento: 'Endodoncia + corona cerámica', visible: 'ambos' },
  ],
};

export const MOCK_PACIENTES: Paciente[] = nombres.map((nombre, i) => {
  const y = 1965 + (i % 45);
  const fechaNac = `${y}-${String((i % 12) + 1).padStart(2, '0')}-15`;
  const alergias = i % 4 === 0 ? ['Penicilina'] : i % 7 === 0 ? ['Látex'] : ['Ninguna'];
  const enf = i % 5 === 0 ? ['Diabetes'] : i % 6 === 0 ? ['Hipertensión'] : ['Ninguna'];
  return {
    id: `p${i + 1}`,
    folio: `PAC-${String(i + 1).padStart(3, '0')}`,
    nombre,
    fechaNacimiento: fechaNac,
    edad: edadDe(fechaNac),
    telefono: `999-${String(100 + i)}-${String(2000 + i)}`,
    email: `paciente${i + 1}@email.com`,
    sexo: i % 2 === 0 ? 'F' : 'M',
    alergias,
    enfermedades: enf,
    medicamentos: i % 8 === 0 ? ['Metformina 850mg'] : ['Ninguno'],
    grupoSanguineo: ['O+', 'A+', 'B+', 'AB+'][i % 4]!,
    contactoEmergencia: {
      nombre: i % 2 === 0 ? 'Juan López' : 'María Castillo',
      telefono: `998-${String(300 + i)}-${String(4000 + i)}`,
      parentesco: i % 2 === 0 ? 'Esposo(a)' : 'Madre',
    },
    dentistaTratante: dentistasRot[i % 3]!,
    nivel: niveles[i]!,
    deuda: [0, 0, 500, 1200, 0, 2500, 800, 0, 300, 0][i % 10]! + (i % 3) * 100,
    radiografias: RADIOGRAFIAS_MOCK[`p${i + 1}`] ?? [],
    fotosEvolucion: FOTOS_EVOLUCION_MOCK[`p${i + 1}`] ?? [],
  };
});

export const MOCK_ODONTOGRAMAS: Record<string, OdontogramaData> = Object.fromEntries(
  MOCK_PACIENTES.map((p, i) => [p.id, mkOdontograma(i + 7)])
);

function med(): MedicamentoReceta[] {
  return [
    { nombre: 'Ibuprofeno 400mg', dosis: '1 tableta', frecuencia: 'cada 8 horas', dias: 3 },
  ];
}

export const MOCK_CONSULTAS: Consulta[] = [];

for (let i = 0; i < 20; i++) {
  const pid = `p${i + 1}`;
  const d = dentistasRot[i % 3]!;
  MOCK_CONSULTAS.push({
    id: `co${i * 2 + 1}`,
    pacienteId: pid,
    dentista: d,
    fecha: `2025-${String(11 + (i % 2)).padStart(2, '0')}-${String(10 + i).padStart(2, '0')}`,
    motivo: i % 2 === 0 ? 'Revisión rutinaria' : 'Dolor molar',
    diagnostico: i % 2 === 0 ? 'Sin caries visibles' : 'Caries en molar 36',
    tratamientoRealizado: i % 2 === 0 ? 'Profilaxis' : 'Obturación con resina',
    tratamientoPendiente: i % 3 === 0 ? 'Corona en 46' : '',
    notasEvolucion: 'Paciente colaborador. Buena higiene.',
    medicamentosRecetados: i % 2 === 0 ? [] : med(),
    proximaCita: 'Revisión en 6 meses',
    costo: 800,
    pagado: 800,
    saldo: 0,
    archivos: i % 2 === 0 ? [] : ['rx_molar.jpg'],
  });
  MOCK_CONSULTAS.push({
    id: `co${i * 2 + 2}`,
    pacienteId: pid,
    dentista: dentistasRot[(i + 1) % 3]!,
    fecha: `2026-02-${String(5 + (i % 20)).padStart(2, '0')}`,
    motivo: 'Control post-tratamiento',
    diagnostico: 'Tejidos sanos',
    tratamientoRealizado: 'Ajuste oclusal',
    tratamientoPendiente: i % 4 === 0 ? 'Endodoncia 16' : '',
    notasEvolucion: 'Sin complicaciones.',
    medicamentosRecetados: [],
    proximaCita: 'Mar 2026',
    costo: 1200,
    pagado: i % 5 === 0 ? 400 : 1200,
    saldo: i % 5 === 0 ? 800 : 0,
    archivos: ['foto_antes.jpg'],
  });
}

export const MOCK_CITAS: Cita[] = [
  { id: 'ci1', pacienteId: 'p1', dentista: dentistasRot[0]!, fecha: HOY_DENT, hora: '09:00', duracion: 45, tipo: 'Revisión', status: 'confirmada', costo: 350, notas: '' },
  { id: 'ci2', pacienteId: 'p2', dentista: dentistasRot[1]!, fecha: HOY_DENT, hora: '09:30', duracion: 60, tipo: 'Ortodoncia', status: 'confirmada', costo: 500, notas: '' },
  { id: 'ci3', pacienteId: 'p3', dentista: dentistasRot[2]!, fecha: HOY_DENT, hora: '10:00', duracion: 90, tipo: 'Endodoncia', status: 'confirmada', costo: 4000, notas: '' },
  { id: 'ci4', pacienteId: 'p4', dentista: dentistasRot[0]!, fecha: HOY_DENT, hora: '11:00', duracion: 30, tipo: 'Limpieza', status: 'confirmada', costo: 600, notas: '' },
  { id: 'ci5', pacienteId: 'p5', dentista: dentistasRot[1]!, fecha: HOY_DENT, hora: '12:00', duracion: 45, tipo: 'Revisión', status: 'pendiente', costo: 350, notas: '' },
  { id: 'ci6', pacienteId: 'p6', dentista: dentistasRot[2]!, fecha: HOY_DENT, hora: '14:00', duracion: 60, tipo: 'Implante', status: 'confirmada', costo: 15000, notas: '' },
  { id: 'ci7', pacienteId: 'p7', dentista: dentistasRot[0]!, fecha: HOY_DENT, hora: '15:30', duracion: 45, tipo: 'Urgencia', status: 'confirmada', costo: 800, notas: '' },
  { id: 'ci8', pacienteId: 'p8', dentista: dentistasRot[1]!, fecha: HOY_DENT, hora: '16:30', duracion: 30, tipo: 'Blanqueamiento', status: 'pendiente', costo: 3500, notas: '' },
  { id: 'ci9', pacienteId: 'p9', dentista: dentistasRot[2]!, fecha: '2026-03-17', hora: '10:00', duracion: 45, tipo: 'Extracción', status: 'completada', costo: 900, notas: '' },
  { id: 'ci10', pacienteId: 'p10', dentista: dentistasRot[0]!, fecha: '2026-03-18', hora: '11:00', duracion: 60, tipo: 'Limpieza', status: 'completada', costo: 650, notas: '' },
  { id: 'ci11', pacienteId: 'p11', dentista: dentistasRot[1]!, fecha: '2026-03-19', hora: '09:00', duracion: 45, tipo: 'Revisión', status: 'completada', costo: 350, notas: '' },
  { id: 'ci12', pacienteId: 'p12', dentista: dentistasRot[2]!, fecha: '2026-03-21', hora: '10:30', duracion: 90, tipo: 'Endodoncia', status: 'confirmada', costo: 4500, notas: '' },
  { id: 'ci13', pacienteId: 'p13', dentista: dentistasRot[0]!, fecha: '2026-03-22', hora: '12:00', duracion: 45, tipo: 'Limpieza', status: 'confirmada', costo: 600, notas: '' },
  { id: 'ci14', pacienteId: 'p14', dentista: dentistasRot[1]!, fecha: '2026-03-23', hora: '13:00', duracion: 60, tipo: 'Ortodoncia', status: 'pendiente', costo: 500, notas: '' },
  { id: 'ci15', pacienteId: 'p15', dentista: dentistasRot[2]!, fecha: '2026-03-21', hora: '16:00', duracion: 45, tipo: 'Revisión', status: 'confirmada', costo: 350, notas: '' },
  { id: 'ci16', pacienteId: 'p16', dentista: dentistasRot[0]!, fecha: '2026-03-18', hora: '15:00', duracion: 30, tipo: 'Urgencia', status: 'completada', costo: 700, notas: '' },
  { id: 'ci17', pacienteId: 'p17', dentista: dentistasRot[1]!, fecha: '2026-03-19', hora: '17:00', duracion: 45, tipo: 'Blanqueamiento', status: 'confirmada', costo: 3800, notas: '' },
  { id: 'ci18', pacienteId: 'p18', dentista: dentistasRot[2]!, fecha: '2026-03-22', hora: '11:30', duracion: 60, tipo: 'Implante', status: 'pendiente', costo: 12000, notas: '' },
  { id: 'ci19', pacienteId: 'p19', dentista: dentistasRot[0]!, fecha: '2026-03-23', hora: '09:30', duracion: 45, tipo: 'Revisión', status: 'confirmada', costo: 350, notas: '' },
  { id: 'ci20', pacienteId: 'p20', dentista: dentistasRot[1]!, fecha: '2026-03-17', hora: '12:30', duracion: 45, tipo: 'Limpieza', status: 'completada', costo: 550, notas: '' },
  { id: 'ci21', pacienteId: 'p1', dentista: dentistasRot[2]!, fecha: '2026-03-24', hora: '10:00', duracion: 45, tipo: 'Endodoncia', status: 'pendiente', costo: 4000, notas: '' },
  { id: 'ci22', pacienteId: 'p3', dentista: dentistasRot[0]!, fecha: '2026-03-25', hora: '11:00', duracion: 30, tipo: 'Revisión', status: 'confirmada', costo: 350, notas: '' },
  { id: 'ci23', pacienteId: 'p5', dentista: dentistasRot[1]!, fecha: '2026-03-20', hora: '18:00', duracion: 30, tipo: 'Revisión', status: 'pendiente', costo: 350, notas: '' },
  { id: 'ci24', pacienteId: 'p11', dentista: dentistasRot[2]!, fecha: '2026-03-20', hora: '08:30', duracion: 45, tipo: 'Limpieza', status: 'confirmada', costo: 600, notas: '' },
  { id: 'ci25', pacienteId: 'p14', dentista: dentistasRot[0]!, fecha: '2026-03-21', hora: '09:00', duracion: 60, tipo: 'Extracción', status: 'confirmada', costo: 1000, notas: '' },
];

export const MOCK_RECETAS_HISTORIAL: RecetaHistorial[] = Array.from({ length: 10 }, (_, i) => ({
  id: `rx${i + 1}`,
  pacienteId: `p${(i % 20) + 1}`,
  pacienteNombre: MOCK_PACIENTES[i % 20]!.nombre,
  fecha: `2026-03-${String(1 + i).padStart(2, '0')}`,
  dentista: dentistasRot[i % 3]!,
  diagnostico: ['Post extracción', 'Gingivitis leve', 'Control ortodoncia', 'Dolor TMJ'][i % 4]!,
}));

export const MOCK_PAGOS_DIA: PagoRegistro[] = [
  { id: 'pg1', pacienteId: 'p2', pacienteNombre: MOCK_PACIENTES[1]!.nombre, monto: 1200, metodo: 'tarjeta', fecha: HOY_DENT },
  { id: 'pg2', pacienteId: 'p7', pacienteNombre: MOCK_PACIENTES[6]!.nombre, monto: 800, metodo: 'efectivo', fecha: HOY_DENT },
  { id: 'pg3', pacienteId: 'p12', pacienteNombre: MOCK_PACIENTES[11]!.nombre, monto: 3500, metodo: 'transferencia', referencia: 'TRF-99821', fecha: HOY_DENT },
];

export function getPaciente(id: string): Paciente | undefined {
  return MOCK_PACIENTES.find((p) => p.id === id);
}

export function consultasDePaciente(consultas: Consulta[], pid: string): Consulta[] {
  return consultas.filter((c) => c.pacienteId === pid).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function citasHoyD(citas: Cita[], fecha = HOY_DENT): Cita[] {
  return citas.filter((c) => c.fecha === fecha);
}

export function ultimaConsulta(consultas: Consulta[], pid: string): Consulta | undefined {
  const list = consultasDePaciente(consultas, pid);
  return list[0];
}

export function ingresosPorTipo(citas: Cita[]): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const c of citas) {
    if (c.status !== 'completada') continue;
    m.set(c.tipo, (m.get(c.tipo) ?? 0) + c.costo);
  }
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}

export function citasPorMes6(): { mes: string; citas: number }[] {
  return [
    { mes: 'Oct', citas: 42 },
    { mes: 'Nov', citas: 48 },
    { mes: 'Dic', citas: 51 },
    { mes: 'Ene', citas: 55 },
    { mes: 'Feb', citas: 58 },
    { mes: 'Mar', citas: 62 },
  ];
}

export function tratamientosEnCurso(consultas: Consulta[]): number {
  return consultas.filter((c) => c.tratamientoPendiente.trim().length > 0).length;
}

export function cuentasPorCobrarTotal(pacientes: Paciente[]): number {
  return pacientes.reduce((s, p) => s + p.deuda, 0);
}
