'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  billableHours,
  hoursToDebit,
  loyaltyRewardHours,
  onlyDigits,
  quoteCash,
} from './pricing';
import { emptyCaja, seedActivos, seedTutors } from './seed';
import type { DiaCaja, NinoActivo, SesionCerrada, Tutor } from './types';
import { PACKAGES } from './types';

type CheckoutPreview = {
  session: NinoActivo;
  tutor: Tutor;
  minutos: number;
  horasCobradas: number;
  ruta: 'membresia' | 'efectivo';
  monto: number;
  horasDescontar: number;
  horasPremioLealtad: number;
  horasLealtadDespues: number;
};

type Store = {
  tutors: Tutor[];
  activos: NinoActivo[];
  caja: DiaCaja;
  findTutorByPhone: (phone: string) => Tutor | undefined;
  checkIn: (input: {
    nino: string;
    tutorNombre: string;
    telefono: string;
    conNinera: boolean;
  }) => { ok: true } | { ok: false; error: string };
  previewCheckout: (sessionId: string) => CheckoutPreview | null;
  confirmCheckout: (sessionId: string) => SesionCerrada | null;
  sellPackage: (tutorId: string, packageId: (typeof PACKAGES)[number]['id']) => void;
};

const Ctx = createContext<Store | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function LudotecaProvider({ children }: { children: ReactNode }) {
  const [tutors, setTutors] = useState<Tutor[]>(() => seedTutors());
  const [activos, setActivos] = useState<NinoActivo[]>(() => seedActivos(seedTutors()));
  const [caja, setCaja] = useState<DiaCaja>(() => emptyCaja());

  const findTutorByPhone = useCallback(
    (phone: string) => {
      const d = onlyDigits(phone);
      if (d.length < 10) return undefined;
      return tutors.find((t) => t.telefono === d || t.telefono.endsWith(d) || d.endsWith(t.telefono));
    },
    [tutors]
  );

  const checkIn = useCallback(
    (input: { nino: string; tutorNombre: string; telefono: string; conNinera: boolean }) => {
      const nino = input.nino.trim();
      const tutorNombre = input.tutorNombre.trim();
      const telefono = onlyDigits(input.telefono);
      if (!nino) return { ok: false as const, error: 'Escribe el nombre del niño' };
      if (!tutorNombre) return { ok: false as const, error: 'Escribe el nombre del tutor' };
      if (telefono.length < 10) return { ok: false as const, error: 'WhatsApp inválido (10 dígitos)' };

      let tutor = tutors.find((t) => t.telefono === telefono);
      if (!tutor) {
        tutor = {
          id: uid('t'),
          nombre: tutorNombre,
          telefono,
          membresiaActiva: false,
          horasRestantes: 0,
          horasLealtad: 0,
          hijosNombres: [nino],
        };
        setTutors((prev) => [tutor!, ...prev]);
      } else {
        const nombreActualizado = tutorNombre || tutor.nombre;
        setTutors((prev) =>
          prev.map((t) =>
            t.id === tutor!.id
              ? {
                  ...t,
                  nombre: nombreActualizado,
                  hijosNombres: t.hijosNombres.includes(nino)
                    ? t.hijosNombres
                    : [...t.hijosNombres, nino],
                }
              : t
          )
        );
        tutor = { ...tutor, nombre: nombreActualizado };
      }

      const already = activos.some(
        (a) => a.tutorId === tutor!.id && a.ninoNombre.toLowerCase() === nino.toLowerCase()
      );
      if (already) return { ok: false as const, error: `${nino} ya está en juego` };

      setActivos((prev) => [
        {
          sessionId: uid('s'),
          ninoNombre: nino,
          tutorId: tutor!.id,
          checkInAt: Date.now(),
          conNinera: input.conNinera,
        },
        ...prev,
      ]);
      return { ok: true as const };
    },
    [activos, tutors]
  );

  const previewCheckout = useCallback(
    (sessionId: string): CheckoutPreview | null => {
      const session = activos.find((a) => a.sessionId === sessionId);
      if (!session) return null;
      const tutor = tutors.find((t) => t.id === session.tutorId);
      if (!tutor) return null;
      const minutos = Math.floor((Date.now() - session.checkInAt) / 60000);
      const horasCobradas = billableHours(minutos);
      const usaMembresia = tutor.membresiaActiva && tutor.horasRestantes > 0;

      if (usaMembresia) {
        const horasDescontar = hoursToDebit(minutos);
        const premio = loyaltyRewardHours(tutor.horasLealtad, horasDescontar);
        return {
          session,
          tutor,
          minutos,
          horasCobradas,
          ruta: 'membresia',
          monto: 0,
          horasDescontar,
          horasPremioLealtad: premio,
          horasLealtadDespues: Math.round((tutor.horasLealtad + horasDescontar) * 100) / 100,
        };
      }

      const { amount, hours } = quoteCash(minutos, session.conNinera);
      const premio = loyaltyRewardHours(tutor.horasLealtad, hours);
      return {
        session,
        tutor,
        minutos,
        horasCobradas: hours,
        ruta: 'efectivo',
        monto: amount,
        horasDescontar: 0,
        horasPremioLealtad: premio,
        horasLealtadDespues: Math.round((tutor.horasLealtad + hours) * 100) / 100,
      };
    },
    [activos, tutors]
  );

  const confirmCheckout = useCallback(
    (sessionId: string) => {
      const preview = previewCheckout(sessionId);
      if (!preview) return null;
      const {
        session,
        tutor,
        minutos,
        horasCobradas,
        ruta,
        monto,
        horasDescontar,
        horasPremioLealtad,
      } = preview;
      const checkOutAt = Date.now();
      const horasEntregadas = ruta === 'membresia' ? horasDescontar : horasCobradas;

      setTutors((prev) =>
        prev.map((t) => {
          if (t.id !== tutor.id) return t;
          let horasRestantes = t.horasRestantes;
          let membresiaActiva = t.membresiaActiva;
          if (ruta === 'membresia') {
            horasRestantes = Math.max(0, Math.round((t.horasRestantes - horasDescontar) * 100) / 100);
          }
          if (horasPremioLealtad > 0) {
            horasRestantes = Math.round((horasRestantes + horasPremioLealtad) * 100) / 100;
            membresiaActiva = true;
          } else if (ruta === 'membresia') {
            membresiaActiva = horasRestantes > 0.01;
          }
          return {
            ...t,
            horasRestantes,
            membresiaActiva,
            horasLealtad: Math.round((t.horasLealtad + horasEntregadas) * 100) / 100,
          };
        })
      );

      const closed: SesionCerrada = {
        sessionId: session.sessionId,
        ninoNombre: session.ninoNombre,
        tutorId: tutor.id,
        tutorNombre: tutor.nombre,
        checkInAt: session.checkInAt,
        checkOutAt,
        minutosJugados: minutos,
        horasCobradas,
        conNinera: session.conNinera,
        modoCobro: ruta,
        montoCobrado: monto,
        horasDescontadas: ruta === 'membresia' ? horasDescontar : 0,
        horasPremioLealtad,
      };

      setActivos((prev) => prev.filter((a) => a.sessionId !== sessionId));
      setCaja((prev) => ({ ...prev, sesiones: [closed, ...prev.sesiones] }));
      return closed;
    },
    [previewCheckout]
  );

  const sellPackage = useCallback((tutorId: string, packageId: (typeof PACKAGES)[number]['id']) => {
    const pack = PACKAGES.find((p) => p.id === packageId);
    if (!pack) return;
    setTutors((prev) =>
      prev.map((t) =>
        t.id === tutorId
          ? {
              ...t,
              membresiaActiva: true,
              horasRestantes: Math.round((t.horasRestantes + pack.horas) * 100) / 100,
            }
          : t
      )
    );
    setCaja((prev) => ({
      ...prev,
      recargasMembresia: [
        { tutorId, paquete: pack.label, monto: pack.precio, at: Date.now() },
        ...prev.recargasMembresia,
      ],
    }));
  }, []);

  const value = useMemo(
    () => ({
      tutors,
      activos,
      caja,
      findTutorByPhone,
      checkIn,
      previewCheckout,
      confirmCheckout,
      sellPackage,
    }),
    [tutors, activos, caja, findTutorByPhone, checkIn, previewCheckout, confirmCheckout, sellPackage]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLudoteca() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLudoteca must be used within LudotecaProvider');
  return ctx;
}
