import type { Alumno } from '@/lib/mock-data-cobranza';

/** RFC mock determinista 12–13 caracteres para demo */
export function mockRfcReceptor(al: Alumno): string {
  const base = al.id.replace(/\D/g, '').padStart(4, '0').slice(-4);
  return `MER${base}${al.nombre.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}A8B`.slice(0, 13);
}

export type CfdiHistorialRow = {
  id: string;
  folio: string;
  alumno: string;
  rfc: string;
  concepto: string;
  total: number;
  fecha: string;
  status: 'Timbrado' | 'Cancelado' | 'Pendiente';
};

export const MOCK_HISTORIAL_CFDI: CfdiHistorialRow[] = [
  {
    id: 'h1',
    folio: 'A-2104',
    alumno: 'Ana Lucía Fernández',
    rfc: 'FERA850101ABC',
    concepto: 'Servicios educativos — Ingeniería',
    total: 6200,
    fecha: '2026-03-02',
    status: 'Timbrado',
  },
  {
    id: 'h2',
    folio: 'A-2105',
    alumno: 'Diego Herrera Solís',
    rfc: 'HESM920315XY2',
    concepto: 'Servicios educativos — Administración',
    total: 4800,
    fecha: '2026-03-03',
    status: 'Timbrado',
  },
  {
    id: 'h3',
    folio: 'A-2106',
    alumno: 'Valentina Ruiz',
    rfc: 'RUIP881201DE3',
    concepto: 'Servicios educativos — Diseño',
    total: 7100,
    fecha: '2026-02-28',
    status: 'Pendiente',
  },
  {
    id: 'h4',
    folio: 'A-2098',
    alumno: 'Mateo Castillo',
    rfc: 'CAMA900505FG1',
    concepto: 'Servicios educativos — Preparatoria',
    total: 3500,
    fecha: '2026-02-15',
    status: 'Cancelado',
  },
  {
    id: 'h5',
    folio: 'A-2099',
    alumno: 'Lucía Mendoza',
    rfc: 'MELU870722HJ4',
    concepto: 'Servicios educativos — Ingeniería',
    total: 7600,
    fecha: '2026-02-18',
    status: 'Timbrado',
  },
  {
    id: 'h6',
    folio: 'A-2100',
    alumno: 'Emilio Vargas',
    rfc: 'VAEI910910KL7',
    concepto: 'Servicios educativos — Administración',
    total: 5500,
    fecha: '2026-02-20',
    status: 'Timbrado',
  },
  {
    id: 'h7',
    folio: 'A-2101',
    alumno: 'Sofía Navarro',
    rfc: 'NASO940404MN2',
    concepto: 'Servicios educativos — Diseño',
    total: 6900,
    fecha: '2026-02-22',
    status: 'Pendiente',
  },
  {
    id: 'h8',
    folio: 'A-2102',
    alumno: 'Andrés Peña',
    rfc: 'PEAN880808PQ5',
    concepto: 'Servicios educativos — Preparatoria',
    total: 4200,
    fecha: '2026-02-25',
    status: 'Timbrado',
  },
];

export const MESES_PERIODO = [
  { value: '2026-03', label: 'Marzo 2026' },
  { value: '2026-02', label: 'Febrero 2026' },
  { value: '2026-01', label: 'Enero 2026' },
  { value: '2025-12', label: 'Diciembre 2025' },
];
