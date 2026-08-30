import { MOCK_ALUMNOS, type Alumno, type StatusAlumno } from '@/lib/mock-data-cobranza';

export type MovStatus = 'Conciliado' | 'Sin identificar' | 'Duplicado';

export type MovimientoBanco = {
  id: string;
  fecha: string;
  referencia: string;
  concepto: string;
  monto: number;
  status: MovStatus;
  alumnoId?: string;
};

/** 6 movimientos ligados a alumnos del mock; 6 sin match inicial */
export function buildMovimientosIniciales(): MovimientoBanco[] {
  const pick = [0, 1, 2, 4, 5, 6].map((i) => MOCK_ALUMNOS[i]).filter(Boolean) as Alumno[];
  const refsConc = pick.map((a, i) => ({
    id: `mov-c-${i}`,
    fecha: `2026-03-${String(10 + i).padStart(2, '0')}`,
    referencia: `MER-${a.id.replace(/\D/g, '')}-${String(202603 + i)}`,
    concepto: `SPEI recibido — ${a.tutor.split(' ')[0] ?? 'Tutor'}`,
    monto: Math.max(a.montoColegiatura, 1000),
    status: 'Conciliado' as const,
    alumnoId: a.id,
  }));

  const sinId: MovimientoBanco[] = [
    {
      id: 'mov-u1',
      fecha: '2026-03-11',
      referencia: 'SPEI-REF-998877',
      concepto: 'Transferencia sin leyenda',
      monto: 4500,
      status: 'Sin identificar',
    },
    {
      id: 'mov-u2',
      fecha: '2026-03-11',
      referencia: 'ORD-5544332211',
      concepto: 'Depósito en ventanilla',
      monto: 6200,
      status: 'Sin identificar',
    },
    {
      id: 'mov-u3',
      fecha: '2026-03-12',
      referencia: 'MER-UNKNOWN-01',
      concepto: 'SPEI genérico',
      monto: 3500,
      status: 'Sin identificar',
    },
    {
      id: 'mov-u4',
      fecha: '2026-03-12',
      referencia: 'PAGO-SIN-REF',
      concepto: 'SPEI',
      monto: 7100,
      status: 'Sin identificar',
    },
    {
      id: 'mov-u5',
      fecha: '2026-03-13',
      referencia: 'ABONO-2026-0313',
      concepto: 'Tercero',
      monto: 5500,
      status: 'Sin identificar',
    },
    {
      id: 'mov-u6',
      fecha: '2026-03-13',
      referencia: 'DUPLICADO-SIM',
      concepto: 'Posible duplicado',
      monto: 4800,
      status: 'Sin identificar',
    },
  ];

  return [...refsConc, ...sinId];
}

/** Marca 2 movimientos sin identificar como duplicados; el resto permanece sin identificar */
export function aplicarConciliacionAuto(movs: MovimientoBanco[]): MovimientoBanco[] {
  let dup = 0;
  return movs.map((m) => {
    if (m.status !== 'Sin identificar') return m;
    if (dup < 2) {
      dup++;
      return { ...m, status: 'Duplicado' as const };
    }
    return m;
  });
}

export type ImpactoRow = {
  alumnoId: string;
  nombre: string;
  monto: number;
  statusAntes: StatusAlumno;
  statusDespues: StatusAlumno;
  fecha: string;
};

export function buildImpactoMock(): ImpactoRow[] {
  const alumnos = [MOCK_ALUMNOS[7], MOCK_ALUMNOS[8], MOCK_ALUMNOS[9], MOCK_ALUMNOS[10], MOCK_ALUMNOS[11], MOCK_ALUMNOS[12]].filter(
    Boolean
  ) as Alumno[];
  return alumnos.map((a, i) => ({
    alumnoId: a.id,
    nombre: a.nombre,
    monto: Math.min(a.montoAdeudo || a.montoColegiatura, 12000),
    statusAntes: a.status,
    statusDespues:
      a.status === 'riesgo'
        ? 'adeudo'
        : a.status === 'adeudo'
          ? 'al_corriente'
          : a.status === 'baja_riesgo'
            ? 'riesgo'
            : 'al_corriente',
    fecha: `2026-03-${String(14 + (i % 5)).padStart(2, '0')} 10:${String(i * 5).padStart(2, '0')}:00`,
  }));
}
