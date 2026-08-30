import type { DiaCaja, NinoActivo, Tutor } from './types';

export function seedTutors(): Tutor[] {
  return [
    {
      id: 't1',
      nombre: 'Mariana Ek',
      telefono: '9991234567',
      membresiaActiva: true,
      horasRestantes: 6.5,
      horasLealtad: 3.5,
      hijosNombres: ['Leo', 'Sofi'],
    },
    {
      id: 't2',
      nombre: 'Carlos Pech',
      telefono: '9997654321',
      membresiaActiva: false,
      horasRestantes: 0,
      /** A 1h de ganar la hora gratis de lealtad */
      horasLealtad: 9,
      hijosNombres: ['Mateo'],
    },
    {
      id: 't3',
      nombre: 'Ana Tuyub',
      telefono: '9981112233',
      membresiaActiva: true,
      horasRestantes: 2,
      horasLealtad: 14,
      hijosNombres: ['Valentina', 'Diego'],
    },
  ];
}

export function seedActivos(tutors: Tutor[]): NinoActivo[] {
  const now = Date.now();
  return [
    {
      sessionId: 's-demo-1',
      ninoNombre: 'Leo',
      tutorId: tutors[0]!.id,
      checkInAt: now - 42 * 60 * 1000 - 15 * 1000,
      conNinera: false,
    },
    {
      sessionId: 's-demo-2',
      ninoNombre: 'Mateo',
      tutorId: tutors[1]!.id,
      checkInAt: now - 68 * 60 * 1000,
      conNinera: true,
    },
  ];
}

export function emptyCaja(): DiaCaja {
  return { sesiones: [], recargasMembresia: [] };
}
