/**
 * Datos mock — Demo Cobranza Instituto Meridian
 */

export type Carrera = 'Preparatoria' | 'Ingeniería' | 'Administración' | 'Diseño';
export type Ciclo = 'Ciclo 1' | 'Ciclo 2' | 'Ciclo 3' | 'Ciclo 4';
export type StatusAlumno = 'al_corriente' | 'adeudo' | 'riesgo' | 'baja_riesgo';
export type StatusPagoMes = 'pagado' | 'tardio' | 'omitido';

export type Alumno = {
  id: string;
  nombre: string;
  tutor: string;
  telefono: string;
  email: string;
  carrera: Carrera;
  ciclo: Ciclo;
  montoColegiatura: number;
  montoAdeudo: number;
  status: StatusAlumno;
  asesor: string;
  ultimoPago: string;
  fechaInscripcion: string;
  diasAtraso: number;
  scoreRiesgo: number;
  historialPagos: Array<{ mes: string; status: StatusPagoMes }>;
};

const ASESORES = ['María González', 'Jorge Ramírez', 'Sofía Castro', 'Luis Herrera'] as const;

const MESES_HIST = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];

function tel(seed: number): string {
  const a = 100 + ((seed * 17) % 900);
  const b = 1000 + ((seed * 31) % 9000);
  return `999-${String(a).slice(-3)}-${String(b).slice(-4)}`;
}

function historialForStatus(s: StatusAlumno): Array<{ mes: string; status: StatusPagoMes }> {
  const out: Array<{ mes: string; status: StatusPagoMes }> = [];
  for (let i = 0; i < 12; i++) {
    const mes = MESES_HIST[i] ?? `M${i}`;
    if (s === 'al_corriente') {
      out.push({ mes, status: i >= 10 ? 'pagado' : i >= 8 ? 'tardio' : 'pagado' });
    } else if (s === 'adeudo') {
      out.push({ mes, status: i >= 9 ? 'tardio' : i >= 6 ? 'omitido' : 'pagado' });
    } else if (s === 'riesgo') {
      out.push({ mes, status: i >= 4 ? 'omitido' : i >= 2 ? 'tardio' : 'pagado' });
    } else {
      out.push({ mes, status: i >= 2 ? 'omitido' : 'tardio' });
    }
  }
  return out;
}

function scoreFor(status: StatusAlumno, seed: number): number {
  const r = (n: number, m: number) => n + (seed * 7) % (m - n);
  if (status === 'al_corriente') return r(75, 95);
  if (status === 'adeudo') return r(40, 65);
  if (status === 'riesgo') return r(15, 38);
  return r(5, 20);
}

const ciclos: Ciclo[] = ['Ciclo 1', 'Ciclo 2', 'Ciclo 3', 'Ciclo 4'];
const carreras: Carrera[] = ['Preparatoria', 'Ingeniería', 'Administración', 'Diseño'];

/** 25 alumnos: 10 al_corriente, 7 adeudo, 5 riesgo, 3 baja_riesgo */
export const MOCK_ALUMNOS: Alumno[] = [
  // al_corriente x10
  {
    id: 'mer-001',
    nombre: 'Ana Lucía Fernández',
    tutor: 'Rosa Fernández',
    telefono: tel(1),
    email: 'r.fernandez@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 2',
    montoColegiatura: 6200,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[0],
    ultimoPago: '2026-03-01',
    fechaInscripcion: '2024-08-15',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 1),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-002',
    nombre: 'Diego Herrera Solís',
    tutor: 'Miguel Herrera',
    telefono: tel(2),
    email: 'mherrera@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 1',
    montoColegiatura: 4800,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[1],
    ultimoPago: '2026-03-03',
    fechaInscripcion: '2025-01-10',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 2),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-003',
    nombre: 'Valentina Ruiz',
    tutor: 'Patricia Ruiz',
    telefono: tel(3),
    email: 'pat.ruiz@email.com',
    carrera: 'Diseño',
    ciclo: 'Ciclo 3',
    montoColegiatura: 7100,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[2],
    ultimoPago: '2026-02-28',
    fechaInscripcion: '2023-01-20',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 3),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-004',
    nombre: 'Carlos Méndez',
    tutor: 'Laura Méndez',
    telefono: tel(4),
    email: 'l.mendez@email.com',
    carrera: 'Preparatoria',
    ciclo: 'Ciclo 1',
    montoColegiatura: 3500,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[3],
    ultimoPago: '2026-03-05',
    fechaInscripcion: '2025-08-01',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 4),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-005',
    nombre: 'Sofía Delgado',
    tutor: 'Ernesto Delgado',
    telefono: tel(5),
    email: 'e.delgado@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 4',
    montoColegiatura: 8500,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[0],
    ultimoPago: '2026-03-02',
    fechaInscripcion: '2022-08-22',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 5),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-006',
    nombre: 'Andrés Vidal',
    tutor: 'Mónica Vidal',
    telefono: tel(6),
    email: 'mvidal@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 2',
    montoColegiatura: 5100,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[1],
    ultimoPago: '2026-03-04',
    fechaInscripcion: '2024-01-12',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 6),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-007',
    nombre: 'Mariana López',
    tutor: 'Fernando López',
    telefono: tel(7),
    email: 'f.lopez@email.com',
    carrera: 'Diseño',
    ciclo: 'Ciclo 2',
    montoColegiatura: 6800,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[2],
    ultimoPago: '2026-03-01',
    fechaInscripcion: '2024-08-05',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 7),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-008',
    nombre: 'Javier Ortiz',
    tutor: 'Claudia Ortiz',
    telefono: tel(8),
    email: 'c.ortiz@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 3',
    montoColegiatura: 7900,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[3],
    ultimoPago: '2026-03-06',
    fechaInscripcion: '2023-08-18',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 8),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-009',
    nombre: 'Regina Campos',
    tutor: 'Alejandro Campos',
    telefono: tel(9),
    email: 'a.campos@email.com',
    carrera: 'Preparatoria',
    ciclo: 'Ciclo 1',
    montoColegiatura: 3800,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[0],
    ultimoPago: '2026-03-04',
    fechaInscripcion: '2025-08-25',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 9),
    historialPagos: historialForStatus('al_corriente'),
  },
  {
    id: 'mer-010',
    nombre: 'Emilio Navarro',
    tutor: 'Gabriela Navarro',
    telefono: tel(10),
    email: 'g.navarro@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 3',
    montoColegiatura: 5400,
    montoAdeudo: 0,
    status: 'al_corriente',
    asesor: ASESORES[1],
    ultimoPago: '2026-03-02',
    fechaInscripcion: '2023-01-08',
    diasAtraso: 0,
    scoreRiesgo: scoreFor('al_corriente', 10),
    historialPagos: historialForStatus('al_corriente'),
  },
  // adeudo x7
  {
    id: 'mer-011',
    nombre: 'Paola Jiménez',
    tutor: 'Ricardo Jiménez',
    telefono: tel(11),
    email: 'r.jimenez@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 2',
    montoColegiatura: 6400,
    montoAdeudo: 6400,
    status: 'adeudo',
    asesor: ASESORES[2],
    ultimoPago: '2026-01-10',
    fechaInscripcion: '2024-02-01',
    diasAtraso: 7,
    scoreRiesgo: scoreFor('adeudo', 11),
    historialPagos: historialForStatus('adeudo'),
  },
  {
    id: 'mer-012',
    nombre: 'Héctor Salas',
    tutor: 'Norma Salas',
    telefono: tel(12),
    email: 'n.salas@email.com',
    carrera: 'Diseño',
    ciclo: 'Ciclo 3',
    montoColegiatura: 7200,
    montoAdeudo: 14400,
    status: 'adeudo',
    asesor: ASESORES[3],
    ultimoPago: '2025-11-20',
    fechaInscripcion: '2022-08-10',
    diasAtraso: 15,
    scoreRiesgo: scoreFor('adeudo', 12),
    historialPagos: historialForStatus('adeudo'),
  },
  {
    id: 'mer-013',
    nombre: 'Daniela Reyes',
    tutor: 'Oscar Reyes',
    telefono: tel(13),
    email: 'o.reyes@email.com',
    carrera: 'Preparatoria',
    ciclo: 'Ciclo 1',
    montoColegiatura: 4100,
    montoAdeudo: 4100,
    status: 'adeudo',
    asesor: ASESORES[0],
    ultimoPago: '2026-02-01',
    fechaInscripcion: '2025-08-12',
    diasAtraso: 30,
    scoreRiesgo: scoreFor('adeudo', 13),
    historialPagos: historialForStatus('adeudo'),
  },
  {
    id: 'mer-014',
    nombre: 'Roberto Peña',
    tutor: 'Silvia Peña',
    telefono: tel(14),
    email: 's.pena@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 2',
    montoColegiatura: 5000,
    montoAdeudo: 10000,
    status: 'adeudo',
    asesor: ASESORES[1],
    ultimoPago: '2025-12-15',
    fechaInscripcion: '2024-01-20',
    diasAtraso: 60,
    scoreRiesgo: scoreFor('adeudo', 14),
    historialPagos: historialForStatus('adeudo'),
  },
  {
    id: 'mer-015',
    nombre: 'Fernanda Castro',
    tutor: 'Luis Castro',
    telefono: tel(15),
    email: 'l.castro@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 4',
    montoColegiatura: 8200,
    montoAdeudo: 16400,
    status: 'adeudo',
    asesor: ASESORES[2],
    ultimoPago: '2025-10-05',
    fechaInscripcion: '2021-08-30',
    diasAtraso: 75,
    scoreRiesgo: scoreFor('adeudo', 15),
    historialPagos: historialForStatus('adeudo'),
  },
  {
    id: 'mer-016',
    nombre: 'Óscar Villanueva',
    tutor: 'Teresa Villanueva',
    telefono: tel(16),
    email: 't.villanueva@email.com',
    carrera: 'Diseño',
    ciclo: 'Ciclo 1',
    montoColegiatura: 4600,
    montoAdeudo: 4600,
    status: 'adeudo',
    asesor: ASESORES[3],
    ultimoPago: '2026-02-15',
    fechaInscripcion: '2025-08-28',
    diasAtraso: 15,
    scoreRiesgo: scoreFor('adeudo', 16),
    historialPagos: historialForStatus('adeudo'),
  },
  {
    id: 'mer-017',
    nombre: 'Lucía Morales',
    tutor: 'Jorge Morales',
    telefono: tel(17),
    email: 'j.morales@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 3',
    montoColegiatura: 5300,
    montoAdeudo: 10600,
    status: 'adeudo',
    asesor: ASESORES[0],
    ultimoPago: '2025-12-01',
    fechaInscripcion: '2023-02-14',
    diasAtraso: 48,
    scoreRiesgo: scoreFor('adeudo', 17),
    historialPagos: historialForStatus('adeudo'),
  },
  // riesgo x5
  {
    id: 'mer-018',
    nombre: 'Mateo Serrano',
    tutor: 'Adriana Serrano',
    telefono: tel(18),
    email: 'a.serrano@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 4',
    montoColegiatura: 8000,
    montoAdeudo: 32000,
    status: 'riesgo',
    asesor: ASESORES[1],
    ultimoPago: '2025-08-01',
    fechaInscripcion: '2021-01-10',
    diasAtraso: 120,
    scoreRiesgo: scoreFor('riesgo', 18),
    historialPagos: historialForStatus('riesgo'),
  },
  {
    id: 'mer-019',
    nombre: 'Ximena Ríos',
    tutor: 'Daniel Ríos',
    telefono: tel(19),
    email: 'd.rios@email.com',
    carrera: 'Diseño',
    ciclo: 'Ciclo 3',
    montoColegiatura: 6900,
    montoAdeudo: 20700,
    status: 'riesgo',
    asesor: ASESORES[2],
    ultimoPago: '2025-09-12',
    fechaInscripcion: '2022-08-05',
    diasAtraso: 95,
    scoreRiesgo: scoreFor('riesgo', 19),
    historialPagos: historialForStatus('riesgo'),
  },
  {
    id: 'mer-020',
    nombre: 'Bruno Aguilar',
    tutor: 'Marisol Aguilar',
    telefono: tel(20),
    email: 'm.aguilar@email.com',
    carrera: 'Preparatoria',
    ciclo: 'Ciclo 2',
    montoColegiatura: 4200,
    montoAdeudo: 8400,
    status: 'riesgo',
    asesor: ASESORES[3],
    ultimoPago: '2025-10-20',
    fechaInscripcion: '2024-08-18',
    diasAtraso: 88,
    scoreRiesgo: scoreFor('riesgo', 20),
    historialPagos: historialForStatus('riesgo'),
  },
  {
    id: 'mer-021',
    nombre: 'Camila Duarte',
    tutor: 'Sergio Duarte',
    telefono: tel(21),
    email: 's.duarte@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 4',
    montoColegiatura: 5500,
    montoAdeudo: 22000,
    status: 'riesgo',
    asesor: ASESORES[0],
    ultimoPago: '2025-07-22',
    fechaInscripcion: '2020-08-12',
    diasAtraso: 150,
    scoreRiesgo: scoreFor('riesgo', 21),
    historialPagos: historialForStatus('riesgo'),
  },
  {
    id: 'mer-022',
    nombre: 'Iker Molina',
    tutor: 'Brenda Molina',
    telefono: tel(22),
    email: 'b.molina@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 3',
    montoColegiatura: 7600,
    montoAdeudo: 22800,
    status: 'riesgo',
    asesor: ASESORES[1],
    ultimoPago: '2025-08-30',
    fechaInscripcion: '2022-01-25',
    diasAtraso: 110,
    scoreRiesgo: scoreFor('riesgo', 22),
    historialPagos: historialForStatus('riesgo'),
  },
  // baja_riesgo x3
  {
    id: 'mer-023',
    nombre: 'Natalia Paredes',
    tutor: 'Hugo Paredes',
    telefono: tel(23),
    email: 'h.paredes@email.com',
    carrera: 'Diseño',
    ciclo: 'Ciclo 4',
    montoColegiatura: 7000,
    montoAdeudo: 42000,
    status: 'baja_riesgo',
    asesor: ASESORES[2],
    ultimoPago: '2025-04-10',
    fechaInscripcion: '2020-08-01',
    diasAtraso: 200,
    scoreRiesgo: scoreFor('baja_riesgo', 23),
    historialPagos: historialForStatus('baja_riesgo'),
  },
  {
    id: 'mer-024',
    nombre: 'Gael Espinoza',
    tutor: 'Verónica Espinoza',
    telefono: tel(24),
    email: 'v.espinoza@email.com',
    carrera: 'Ingeniería',
    ciclo: 'Ciclo 4',
    montoColegiatura: 8300,
    montoAdeudo: 49800,
    status: 'baja_riesgo',
    asesor: ASESORES[3],
    ultimoPago: '2025-02-01',
    fechaInscripcion: '2019-08-20',
    diasAtraso: 240,
    scoreRiesgo: scoreFor('baja_riesgo', 24),
    historialPagos: historialForStatus('baja_riesgo'),
  },
  {
    id: 'mer-025',
    nombre: 'Renata Fuentes',
    tutor: 'Iván Fuentes',
    telefono: tel(25),
    email: 'i.fuentes@email.com',
    carrera: 'Administración',
    ciclo: 'Ciclo 4',
    montoColegiatura: 5600,
    montoAdeudo: 33600,
    status: 'baja_riesgo',
    asesor: ASESORES[0],
    ultimoPago: '2025-05-18',
    fechaInscripcion: '2020-01-15',
    diasAtraso: 180,
    scoreRiesgo: scoreFor('baja_riesgo', 25),
    historialPagos: historialForStatus('baja_riesgo'),
  },
];

export const ASESORES_COBRANZA = [...ASESORES];

/** Monto total “asignado” por asesor (cartera bajo su gestión) */
export function cobranzaPorAsesor() {
  const map = new Map<string, { total: number; recuperado: number }>();
  for (const a of ASESORES) map.set(a, { total: 0, recuperado: 0 });
  for (const al of MOCK_ALUMNOS) {
    const row = map.get(al.asesor)!;
    row.total += al.montoColegiatura + al.montoAdeudo;
    // mock: recuperado = colegiatura mensual * meses al corriente en historial
    const pagados = al.historialPagos.filter((h) => h.status === 'pagado').length;
    row.recuperado += al.montoColegiatura * (pagados / 12) * 0.85;
  }
  return ASESORES.map((nombre) => ({ nombre, ...map.get(nombre)! }));
}

/** Tendencia morosidad últimos 6 meses (%) — leve descenso */
export const MOROSIDAD_TENDENCIA = [
  { mes: 'Oct', pct: 22 },
  { mes: 'Nov', pct: 21 },
  { mes: 'Dic', pct: 20.5 },
  { mes: 'Ene', pct: 19.8 },
  { mes: 'Feb', pct: 19.2 },
  { mes: 'Mar', pct: 18.5 },
];

export function kpisFromMock() {
  const carteraTotal = MOCK_ALUMNOS.reduce((s, a) => s + a.montoColegiatura + a.montoAdeudo, 0);
  const alCorriente = MOCK_ALUMNOS.filter((a) => a.status === 'al_corriente');
  const pctCorriente = (alCorriente.length / MOCK_ALUMNOS.length) * 100;
  const montoAdeudo = MOCK_ALUMNOS.reduce((s, a) => s + a.montoAdeudo, 0);
  const riesgoBaja = MOCK_ALUMNOS.filter((a) => a.status === 'riesgo' || a.status === 'baja_riesgo').length;
  const conAtraso = MOCK_ALUMNOS.filter((a) => a.diasAtraso > 0);
  const promedioDiasAtraso =
    conAtraso.length === 0
      ? 0
      : Math.round(conAtraso.reduce((s, a) => s + a.diasAtraso, 0) / conAtraso.length);
  const ciclo4Criticos = MOCK_ALUMNOS.filter(
    (a) => a.ciclo === 'Ciclo 4' && (a.status === 'riesgo' || a.status === 'baja_riesgo')
  ).length;
  return {
    carteraTotal,
    pctCorriente,
    nAlCorriente: alCorriente.length,
    montoAdeudo,
    riesgoBaja,
    tasaRecuperacionMes: 34,
    promedioDiasAtraso,
    ciclo4Criticos,
  };
}

export type CicloRow = {
  ciclo: Ciclo;
  alumnos: number;
  alCorriente: number;
  adeudo: number;
  montoRiesgo: number;
};

export function estadoPorCiclo(): CicloRow[] {
  return ciclos.map((ciclo) => {
    const list = MOCK_ALUMNOS.filter((a) => a.ciclo === ciclo);
    const alCorriente = list.filter((a) => a.status === 'al_corriente').length;
    const adeudo = list.filter((a) => a.status === 'adeudo').length;
    const montoRiesgo = list
      .filter((a) => a.status === 'riesgo' || a.status === 'baja_riesgo')
      .reduce((s, a) => s + a.montoAdeudo, 0);
    return {
      ciclo,
      alumnos: list.length,
      alCorriente,
      adeudo,
      montoRiesgo,
    };
  });
}

export function accionSugeridaChip(ciclo: Ciclo): { label: string; className: string } {
  switch (ciclo) {
    case 'Ciclo 1':
      return { label: 'Recordatorio', className: 'bg-blue-600/30 text-blue-200 border border-blue-500/40' };
    case 'Ciclo 2':
      return { label: 'Seguimiento activo', className: 'bg-amber-500/20 text-amber-200 border border-amber-500/40' };
    case 'Ciclo 3':
      return { label: 'Plan de pago', className: 'bg-orange-500/20 text-orange-200 border border-orange-500/40' };
    case 'Ciclo 4':
    default:
      return { label: 'Gestión urgente', className: 'bg-red-500/20 text-red-200 border border-red-500/40' };
  }
}

/** Cola del día: alumnos cuyo diasAtraso coincide con hitos de secuencia */
export function colaHoy() {
  const hitos = [7, 15, 30];
  return MOCK_ALUMNOS.filter((a) => hitos.includes(a.diasAtraso));
}

export function telefonoWaDigits(tel: string): string {
  const d = tel.replace(/\D/g, '');
  if (d.length >= 10) return d.slice(-10);
  return d.padStart(10, '0');
}
