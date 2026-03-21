/**
 * Demo Centro Médico Integral Salud+
 */
import { addDays, formatISODate, parseISODate, startOfWeekMonday } from '@/lib/mock-data-spa';

export { addDays, formatISODate, parseISODate, startOfWeekMonday };

export const BRAND_MEDICO = {
  nombre: 'Centro Médico Integral Salud+',
  corto: 'Salud+',
} as const;

export const ACCENT_MEDICO = '#16a34a';

export const MEDICOS = [
  { id: 'm1', nombre: 'Dr. Fernando Ruiz', especialidad: 'Medicina general' },
  { id: 'm2', nombre: 'Dra. Alejandra Mora', especialidad: 'Ginecología' },
  { id: 'm3', nombre: 'Dr. Héctor Castillo', especialidad: 'Cardiología' },
  { id: 'm4', nombre: 'Dra. Isabel Paredes', especialidad: 'Pediatría' },
] as const;

export type EspecialidadDemo = 'general' | 'ginecologia' | 'cardiologia' | 'pediatria';

export type NivelPaciente = 'Nuevo' | 'Regular' | 'VIP';

export type FlagsHeredo = {
  diabetes: boolean;
  hipertension: boolean;
  cancer: boolean;
  cardiopatias: boolean;
};

export type Heredofamiliares = {
  madre: FlagsHeredo;
  padre: FlagsHeredo;
  hermanos: FlagsHeredo;
};

export type DatosGinecologia = {
  fechaUltimaMenstruacion: string;
  cicloDias: number;
  metodoAnticonceptivo: string;
  gestas: number;
  partos: number;
  cesareas: number;
  abortos: number;
  fechaUltimoPapanicolau: string;
  resultadoPapanicolau: string;
  fechaUltimaMastografia: string;
};

export type DatosCardiologia = {
  factoresRiesgo: {
    hipertension: boolean;
    diabetes: boolean;
    tabaquismo: boolean;
    dislipidemia: boolean;
    obesidad: boolean;
    sedentarismo: boolean;
  };
  medicacionActual: string[];
};

export type VacunaPed = { vacuna: string; fecha: string; lote?: string };

export type DatosPediatria = {
  pesoAlNacerKg: number;
  tallaAlNacerCm: number;
  vacunacion: VacunaPed[];
  desarrolloPsicomotor: string;
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
  medicoTratante: string;
  especialidad: EspecialidadDemo;
  nivel: NivelPaciente;
  deuda: number;
  heredofamiliares: Heredofamiliares;
  cirugiasPrevias: string;
  hospitalizaciones: string;
  vacunasNotas: string;
  metodoAnticonceptivoGeneral: string;
  datosGine?: DatosGinecologia;
  datosCardio?: DatosCardiologia;
  datosPediatria?: DatosPediatria;
};

export type SignosVitales = {
  pesoKg: number;
  tallaCm: number;
  imc: number;
  presion: string;
  presionSistolica: number;
  presionDiastolica: number;
  fc: number;
  temperatura: number;
  spo2: number;
  glucosaMgDl?: number;
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
  medico: string;
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
  signosVitales: SignosVitales;
};

export type TipoCitaMed =
  | 'Consulta'
  | 'Urgencia'
  | 'Control'
  | 'Procedimiento'
  | 'Valoración preoperatoria'
  | 'Electrocardiograma'
  | 'Ecografía'
  | 'Papanicolaou';

export type StatusCita = 'confirmada' | 'pendiente' | 'completada' | 'cancelada';

export type Cita = {
  id: string;
  pacienteId: string;
  medico: string;
  fecha: string;
  hora: string;
  duracion: number;
  tipo: TipoCitaMed;
  status: StatusCita;
  costo: number;
  notas: string;
};

export type RecetaHistorial = {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  fecha: string;
  medico: string;
  diagnostico: string;
  cie10: string;
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

export type EstudioSeguimiento = {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  estudio: string;
  fechaSolicitud: string;
  estado: 'pendiente' | 'realizado';
};

export const HOY_MED = '2026-03-20';

export const CIE10_COMUNES = [
  { code: 'I10', label: 'Hipertensión esencial (primaria)' },
  { code: 'E11.9', label: 'Diabetes mellitus tipo 2 sin complicaciones' },
  { code: 'J06.9', label: 'Infección aguda de vías respiratorias superiores' },
  { code: 'K29.7', label: 'Gastritis, no especificada' },
  { code: 'M54.5', label: 'Dolor lumbar bajo' },
  { code: 'R51', label: 'Cefalea' },
  { code: 'N39.0', label: 'Infección de vías urinarias, sitio no especificado' },
  { code: 'O80', label: 'Parto único espontáneo' },
  { code: 'Z34.0', label: 'Supervisión de embarazo normal, primer trimestre' },
  { code: 'I25.10', label: 'Enfermedad cardiovascular aterosclerótica' },
  { code: 'I48.0', label: 'Fibrilación auricular' },
  { code: 'I50.9', label: 'Insuficiencia cardíaca, no especificada' },
  { code: 'J44.1', label: 'EPOC con exacerbación aguda' },
  { code: 'K21.9', label: 'Enfermedad por reflujo gastroesofágico' },
  { code: 'H52.4', label: 'Presbicia' },
  { code: 'L70.0', label: 'Acné vulgar' },
  { code: 'F41.1', label: 'Trastorno de ansiedad generalizada' },
  { code: 'R07.4', label: 'Dolor en el pecho, no especificado' },
  { code: 'Z00.0', label: 'Examen médico general' },
  { code: 'Z01.419', label: 'Examen ginecológico (rutina)' },
] as const;

const nombres: string[] = [
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

const especialidadesPorPaciente: EspecialidadDemo[] = [
  ...Array.from({ length: 8 }, (): EspecialidadDemo => 'general'),
  ...Array.from({ length: 5 }, (): EspecialidadDemo => 'ginecologia'),
  ...Array.from({ length: 4 }, (): EspecialidadDemo => 'cardiologia'),
  ...Array.from({ length: 3 }, (): EspecialidadDemo => 'pediatria'),
];

const medicoPorEsp: Record<EspecialidadDemo, string> = {
  general: MEDICOS[0]!.nombre,
  ginecologia: MEDICOS[1]!.nombre,
  cardiologia: MEDICOS[2]!.nombre,
  pediatria: MEDICOS[3]!.nombre,
};

function edadDe(fechaNac: string): number {
  const a = parseISODate(fechaNac);
  const h = parseISODate(HOY_MED);
  let e = h.getFullYear() - a.getFullYear();
  const m = h.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && h.getDate() < a.getDate())) e--;
  return e;
}

function mkHeredo(seed: number): Heredofamiliares {
  const f = (o: number): FlagsHeredo => ({
    diabetes: (seed + o) % 5 === 0,
    hipertension: (seed + o) % 4 === 0,
    cancer: (seed + o) % 8 === 0,
    cardiopatias: (seed + o) % 7 === 0,
  });
  return { madre: f(1), padre: f(2), hermanos: f(3) };
}

function mkSignos(seed: number, ped: boolean): SignosVitales {
  const peso = ped ? 18 + (seed % 25) : 58 + (seed % 35);
  const talla = ped ? 105 + (seed % 25) : 155 + (seed % 25);
  const imc = Math.round((peso / (talla / 100) ** 2) * 10) / 10;
  const sys = 110 + (seed % 35);
  const dia = 70 + (seed % 15);
  return {
    pesoKg: peso,
    tallaCm: talla,
    imc,
    presion: `${sys}/${dia}`,
    presionSistolica: sys,
    presionDiastolica: dia,
    fc: 68 + (seed % 25),
    temperatura: 36.2 + (seed % 8) / 10,
    spo2: 96 + (seed % 4),
    glucosaMgDl: 85 + (seed % 35),
  };
}

export const MOCK_PACIENTES: Paciente[] = nombres.map((nombre, i) => {
  const esp = especialidadesPorPaciente[i]!;
  const isPed = esp === 'pediatria';
  const isGine = esp === 'ginecologia';
  const y = isPed ? 2014 + (i % 5) : isGine ? 1985 + (i % 15) : 1965 + (i % 45);
  const fechaNac = `${y}-${String((i % 12) + 1).padStart(2, '0')}-15`;
  const sexo = isGine ? 'F' : isPed && i % 2 === 0 ? 'M' : i % 2 === 0 ? 'F' : 'M';
  const alergias = i % 4 === 0 ? ['Penicilina'] : i % 7 === 0 ? ['AINEs'] : ['Ninguna'];
  const enf = i % 5 === 0 ? ['Diabetes'] : i % 6 === 0 ? ['Hipertensión'] : ['Ninguna'];

  const base: Paciente = {
    id: `pm${i + 1}`,
    folio: `EXP-${String(i + 1).padStart(3, '0')}`,
    nombre,
    fechaNacimiento: fechaNac,
    edad: edadDe(fechaNac),
    telefono: `999-${String(100 + i)}-${String(2000 + i)}`,
    email: `paciente.med${i + 1}@saludplus.mx`,
    sexo,
    alergias,
    enfermedades: enf,
    medicamentos: i % 8 === 0 ? ['Losartán 50mg'] : ['Ninguno'],
    grupoSanguineo: ['O+', 'A+', 'B+', 'AB+'][i % 4]!,
    contactoEmergencia: {
      nombre: i % 2 === 0 ? 'Juan López' : 'María Castillo',
      telefono: `998-${String(300 + i)}-${String(4000 + i)}`,
      parentesco: i % 2 === 0 ? 'Esposo(a)' : 'Madre',
    },
    medicoTratante: medicoPorEsp[esp],
    especialidad: esp,
    nivel: ['Nuevo', 'Regular', 'VIP'][i % 3] as NivelPaciente,
    deuda: [0, 0, 800, 2200, 0, 3000, 500, 0, 400, 0][i % 10]! + (i % 3) * 150,
    heredofamiliares: mkHeredo(i + 3),
    cirugiasPrevias: i % 6 === 0 ? 'Apendicectomía 2018' : 'Ninguna',
    hospitalizaciones: i % 9 === 0 ? 'Neumonía 2020' : 'Ninguna',
    vacunasNotas: 'Esquema al día (adulto)',
    metodoAnticonceptivoGeneral: sexo === 'F' && !isPed ? (i % 3 === 0 ? 'DIU' : 'N/A') : 'N/A',
  };

  if (esp === 'ginecologia') {
    base.datosGine = {
      fechaUltimaMenstruacion: '2026-03-01',
      cicloDias: 28,
      metodoAnticonceptivo: 'Anticonceptivo oral',
      gestas: 2,
      partos: 1,
      cesareas: 1,
      abortos: 0,
      fechaUltimoPapanicolau: '2025-08-10',
      resultadoPapanicolau: 'Negativo para lesión intraepitelial',
      fechaUltimaMastografia: '2025-01-20',
    };
  }
  if (esp === 'cardiologia') {
    base.datosCardio = {
      factoresRiesgo: {
        hipertension: true,
        diabetes: i % 2 === 0,
        tabaquismo: false,
        dislipidemia: true,
        obesidad: i % 3 === 0,
        sedentarismo: true,
      },
      medicacionActual: ['Atorvastatina 20mg', 'AAS 100mg'],
    };
  }
  if (esp === 'pediatria') {
    base.datosPediatria = {
      pesoAlNacerKg: 3.1 + (i % 5) * 0.1,
      tallaAlNacerCm: 48 + (i % 3),
      vacunacion: [
        { vacuna: 'BCG', fecha: '2014-04-01' },
        { vacuna: 'Pentavalente', fecha: '2014-06-15' },
        { vacuna: 'SRP', fecha: '2016-03-10' },
        { vacuna: 'Refuerzo DPT', fecha: '2019-08-20' },
      ],
      desarrolloPsicomotor: 'Acorde a la edad. Lenguaje fluido, coordinación fina adecuada.',
    };
  }
  return base;
});

function med(): MedicamentoReceta[] {
  return [{ nombre: 'Paracetamol 500mg', dosis: '1 tableta', frecuencia: 'cada 8 horas', dias: 3 }];
}

export const MOCK_CONSULTAS: Consulta[] = [];

for (let i = 0; i < 20; i++) {
  const pid = `pm${i + 1}`;
  const esp = especialidadesPorPaciente[i]!;
  const m0 = medicoPorEsp[esp];
  const m1 =
    esp === 'general'
      ? MEDICOS[0]!.nombre
      : esp === 'ginecologia'
        ? MEDICOS[1]!.nombre
        : esp === 'cardiologia'
          ? MEDICOS[2]!.nombre
          : MEDICOS[3]!.nombre;

  MOCK_CONSULTAS.push({
    id: `cm${i * 2 + 1}`,
    pacienteId: pid,
    medico: m0,
    fecha:
      i < 5
        ? `2024-06-${String(10 + i).padStart(2, '0')}`
        : `2025-${String(11 + (i % 2)).padStart(2, '0')}-${String(10 + i).padStart(2, '0')}`,
    motivo: i % 2 === 0 ? 'Revisión anual' : 'Dolor torácico atípico',
    diagnostico: i % 2 === 0 ? 'Paciente clínicamente sano' : 'Gastritis leve',
    tratamientoRealizado: i % 2 === 0 ? 'Exploración física completa' : 'Plan dietético + IBP',
    tratamientoPendiente: i % 3 === 0 ? 'Perfil lipídico' : '',
    notasEvolucion: 'Paciente orientado, buen estado general.',
    medicamentosRecetados: i % 2 === 0 ? [] : med(),
    proximaCita: 'Control en 3 meses',
    costo: 600,
    pagado: 600,
    saldo: 0,
    archivos: i % 2 === 0 ? [] : ['lab_perfil.jpg'],
    signosVitales: mkSignos(i + 11, esp === 'pediatria'),
  });
  MOCK_CONSULTAS.push({
    id: `cm${i * 2 + 2}`,
    pacienteId: pid,
    medico: m1,
    fecha:
      i < 5
        ? `2024-08-${String(1 + i).padStart(2, '0')}`
        : `2026-02-${String(5 + (i % 20)).padStart(2, '0')}`,
    motivo: 'Control evolutivo',
    diagnostico: 'Estable',
    tratamientoRealizado: 'Ajuste de tratamiento',
    tratamientoPendiente: i % 4 === 0 ? 'Electrocardiograma' : '',
    notasEvolucion: 'Sin intercurrencias.',
    medicamentosRecetados: [],
    proximaCita: 'Jun 2026',
    costo: 800,
    pagado: i % 5 === 0 ? 300 : 800,
    saldo: i % 5 === 0 ? 500 : 0,
    archivos: ['nota_evolucion.pdf'],
    signosVitales: mkSignos(i + 77, esp === 'pediatria'),
  });
}

export const MOCK_CITAS: Cita[] = [
  { id: 'cmed1', pacienteId: 'pm1', medico: MEDICOS[0]!.nombre, fecha: HOY_MED, hora: '09:00', duracion: 30, tipo: 'Consulta', status: 'confirmada', costo: 500, notas: '' },
  { id: 'cmed2', pacienteId: 'pm2', medico: MEDICOS[1]!.nombre, fecha: HOY_MED, hora: '09:30', duracion: 45, tipo: 'Control', status: 'confirmada', costo: 600, notas: '' },
  { id: 'cmed3', pacienteId: 'pm3', medico: MEDICOS[2]!.nombre, fecha: HOY_MED, hora: '10:00', duracion: 40, tipo: 'Electrocardiograma', status: 'confirmada', costo: 450, notas: '' },
  { id: 'cmed4', pacienteId: 'pm4', medico: MEDICOS[3]!.nombre, fecha: HOY_MED, hora: '11:00', duracion: 35, tipo: 'Consulta', status: 'confirmada', costo: 500, notas: '' },
  { id: 'cmed5', pacienteId: 'pm5', medico: MEDICOS[0]!.nombre, fecha: HOY_MED, hora: '12:00', duracion: 30, tipo: 'Urgencia', status: 'pendiente', costo: 700, notas: '' },
  { id: 'cmed6', pacienteId: 'pm6', medico: MEDICOS[1]!.nombre, fecha: HOY_MED, hora: '14:00', duracion: 30, tipo: 'Papanicolaou', status: 'confirmada', costo: 550, notas: '' },
  { id: 'cmed7', pacienteId: 'pm7', medico: MEDICOS[2]!.nombre, fecha: HOY_MED, hora: '15:30', duracion: 45, tipo: 'Consulta', status: 'confirmada', costo: 800, notas: '' },
  { id: 'cmed8', pacienteId: 'pm8', medico: MEDICOS[3]!.nombre, fecha: HOY_MED, hora: '16:30', duracion: 30, tipo: 'Control', status: 'pendiente', costo: 500, notas: '' },
  { id: 'cmed9', pacienteId: 'pm9', medico: MEDICOS[1]!.nombre, fecha: '2026-03-17', hora: '10:00', duracion: 40, tipo: 'Consulta', status: 'completada', costo: 600, notas: '' },
  { id: 'cmed10', pacienteId: 'pm10', medico: MEDICOS[0]!.nombre, fecha: '2026-03-18', hora: '11:00', duracion: 30, tipo: 'Consulta', status: 'completada', costo: 500, notas: '' },
  { id: 'cmed11', pacienteId: 'pm11', medico: MEDICOS[2]!.nombre, fecha: '2026-03-19', hora: '09:00', duracion: 50, tipo: 'Procedimiento', status: 'completada', costo: 1200, notas: '' },
  { id: 'cmed12', pacienteId: 'pm12', medico: MEDICOS[3]!.nombre, fecha: '2026-03-21', hora: '10:30', duracion: 35, tipo: 'Consulta', status: 'confirmada', costo: 500, notas: '' },
  { id: 'cmed13', pacienteId: 'pm13', medico: MEDICOS[0]!.nombre, fecha: '2026-03-22', hora: '12:00', duracion: 30, tipo: 'Control', status: 'confirmada', costo: 500, notas: '' },
  { id: 'cmed14', pacienteId: 'pm14', medico: MEDICOS[2]!.nombre, fecha: '2026-03-23', hora: '13:00', duracion: 45, tipo: 'Consulta', status: 'pendiente', costo: 900, notas: '' },
  { id: 'cmed15', pacienteId: 'pm15', medico: MEDICOS[1]!.nombre, fecha: '2026-03-21', hora: '16:00', duracion: 30, tipo: 'Ecografía', status: 'confirmada', costo: 1100, notas: '' },
  { id: 'cmed16', pacienteId: 'pm16', medico: MEDICOS[3]!.nombre, fecha: '2026-03-18', hora: '15:00', duracion: 30, tipo: 'Consulta', status: 'completada', costo: 500, notas: '' },
  { id: 'cmed17', pacienteId: 'pm17', medico: MEDICOS[0]!.nombre, fecha: '2026-03-19', hora: '17:00', duracion: 40, tipo: 'Valoración preoperatoria', status: 'confirmada', costo: 850, notas: '' },
  { id: 'cmed18', pacienteId: 'pm18', medico: MEDICOS[2]!.nombre, fecha: '2026-03-22', hora: '11:30', duracion: 40, tipo: 'Consulta', status: 'pendiente', costo: 800, notas: '' },
  { id: 'cmed19', pacienteId: 'pm19', medico: MEDICOS[3]!.nombre, fecha: '2026-03-23', hora: '09:30', duracion: 35, tipo: 'Control', status: 'confirmada', costo: 500, notas: '' },
  { id: 'cmed20', pacienteId: 'pm20', medico: MEDICOS[1]!.nombre, fecha: '2026-03-17', hora: '12:30', duracion: 30, tipo: 'Consulta', status: 'completada', costo: 600, notas: '' },
  { id: 'cmed21', pacienteId: 'pm1', medico: MEDICOS[2]!.nombre, fecha: '2026-03-24', hora: '10:00', duracion: 45, tipo: 'Consulta', status: 'pendiente', costo: 700, notas: '' },
  { id: 'cmed22', pacienteId: 'pm3', medico: MEDICOS[0]!.nombre, fecha: '2026-03-25', hora: '11:00', duracion: 30, tipo: 'Control', status: 'confirmada', costo: 500, notas: '' },
  { id: 'cmed23', pacienteId: 'pm5', medico: MEDICOS[1]!.nombre, fecha: HOY_MED, hora: '18:00', duracion: 30, tipo: 'Consulta', status: 'pendiente', costo: 500, notas: '' },
  { id: 'cmed24', pacienteId: 'pm11', medico: MEDICOS[2]!.nombre, fecha: HOY_MED, hora: '08:30', duracion: 40, tipo: 'Consulta', status: 'confirmada', costo: 800, notas: '' },
  { id: 'cmed25', pacienteId: 'pm14', medico: MEDICOS[0]!.nombre, fecha: '2026-03-21', hora: '09:00', duracion: 30, tipo: 'Urgencia', status: 'confirmada', costo: 750, notas: '' },
];

export const MOCK_RECETAS_HISTORIAL: RecetaHistorial[] = Array.from({ length: 10 }, (_, i) => ({
  id: `rxm${i + 1}`,
  pacienteId: `pm${(i % 20) + 1}`,
  pacienteNombre: MOCK_PACIENTES[i % 20]!.nombre,
  fecha: `2026-03-${String(1 + i).padStart(2, '0')}`,
  medico: MEDICOS[i % 4]!.nombre,
  diagnostico: 'Control evolutivo',
  cie10: CIE10_COMUNES[i % 20]!.code,
}));

export const MOCK_PAGOS_DIA: PagoRegistro[] = [
  { id: 'pgm1', pacienteId: 'pm2', pacienteNombre: MOCK_PACIENTES[1]!.nombre, monto: 1200, metodo: 'tarjeta', fecha: HOY_MED },
  { id: 'pgm2', pacienteId: 'pm7', pacienteNombre: MOCK_PACIENTES[6]!.nombre, monto: 600, metodo: 'efectivo', fecha: HOY_MED },
  { id: 'pgm3', pacienteId: 'pm12', pacienteNombre: MOCK_PACIENTES[11]!.nombre, monto: 2500, metodo: 'transferencia', referencia: 'TRF-77421', fecha: HOY_MED },
];

export const MOCK_ESTUDIOS: EstudioSeguimiento[] = [
  { id: 'es1', pacienteId: 'pm3', pacienteNombre: MOCK_PACIENTES[2]!.nombre, estudio: 'Perfil lipídico', fechaSolicitud: '2026-02-01', estado: 'pendiente' },
  { id: 'es2', pacienteId: 'pm14', pacienteNombre: MOCK_PACIENTES[13]!.nombre, estudio: 'Ecocardiograma', fechaSolicitud: '2026-03-01', estado: 'pendiente' },
  { id: 'es3', pacienteId: 'pm9', pacienteNombre: MOCK_PACIENTES[8]!.nombre, estudio: 'Mastografía bilateral', fechaSolicitud: '2025-11-10', estado: 'realizado' },
];

export function getPaciente(id: string): Paciente | undefined {
  return MOCK_PACIENTES.find((p) => p.id === id);
}

export function consultasDePaciente(consultas: Consulta[], pid: string): Consulta[] {
  return consultas.filter((c) => c.pacienteId === pid).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function citasHoyM(citas: Cita[], fecha = HOY_MED): Cita[] {
  return citas.filter((c) => c.fecha === fecha);
}

export function ultimaConsulta(consultas: Consulta[], pid: string): Consulta | undefined {
  const list = consultasDePaciente(consultas, pid);
  return list[0];
}

export function ingresosPorTipoCita(citas: Cita[]): { name: string; value: number }[] {
  const m = new Map<string, number>();
  for (const c of citas) {
    if (c.status !== 'completada') continue;
    m.set(c.tipo, (m.get(c.tipo) ?? 0) + c.costo);
  }
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}

export function citasPorMes6(): { mes: string; citas: number }[] {
  return [
    { mes: 'Oct', citas: 38 },
    { mes: 'Nov', citas: 44 },
    { mes: 'Dic', citas: 49 },
    { mes: 'Ene', citas: 52 },
    { mes: 'Feb', citas: 56 },
    { mes: 'Mar', citas: 59 },
  ];
}

export function tratamientosEnCurso(consultas: Consulta[]): number {
  return consultas.filter((c) => c.tratamientoPendiente.trim().length > 0).length;
}

export function cuentasPorCobrarTotal(pacientes: Paciente[]): number {
  return pacientes.reduce((s, p) => s + p.deuda, 0);
}

const MS_DAY = 86400000;

export function diasDesdeUltimaConsulta(consultas: Consulta[], pid: string, hoy: string): number | null {
  const u = ultimaConsulta(consultas, pid);
  if (!u) return null;
  const d0 = parseISODate(hoy).getTime();
  const d1 = parseISODate(u.fecha).getTime();
  return Math.floor((d0 - d1) / MS_DAY);
}

export function pacientesSinRevision6Meses(
  pacientes: Paciente[],
  consultas: Consulta[],
  hoy: string
): { paciente: Paciente; dias: number; ultimaFecha: string }[] {
  const limite = 183;
  const out: { paciente: Paciente; dias: number; ultimaFecha: string }[] = [];
  for (const p of pacientes) {
    const u = ultimaConsulta(consultas, p.id);
    if (!u) continue;
    const dias = diasDesdeUltimaConsulta(consultas, p.id, hoy);
    if (dias !== null && dias > limite) {
      out.push({ paciente: p, dias, ultimaFecha: u.fecha });
    }
  }
  return out.sort((a, b) => b.dias - a.dias);
}

export function ingresosMesMock(pagos: PagoRegistro[], mesPrefix = '2026-03'): number {
  return pagos.filter((p) => p.fecha.startsWith(mesPrefix)).reduce((s, p) => s + p.monto, 0);
}
