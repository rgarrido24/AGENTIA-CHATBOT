'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { CalendarEvent } from './CalendarDemo';
import type { GiroId } from './giro-config';

type Ctx = {
  events: CalendarEvent[];
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  paidIds: Set<string>;
  setPaidIds: Dispatch<SetStateAction<Set<string>>>;
  lastAddedEventId: string | null;
  setLastAddedEventId: Dispatch<SetStateAction<string | null>>;
  giro: GiroId | null;
  setGiro: (g: GiroId) => void;
};

const BarberCtx = createContext<Ctx | null>(null);

export function BarberProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [lastAddedEventId, setLastAddedEventId] = useState<string | null>(null);
  const [giro, setGiroState] = useState<GiroId | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('barber-giro');
      if (saved === 'barberia' || saved === 'nail') return saved;
    }
    return null;
  });

  const setGiro = useCallback((g: GiroId) => {
    setGiroState(g);
    if (typeof window !== 'undefined') {
      localStorage.setItem('barber-giro', g);
    }
  }, []);

  const value = useMemo(
    () => ({
      events,
      setEvents,
      paidIds,
      setPaidIds,
      lastAddedEventId,
      setLastAddedEventId,
      giro,
      setGiro,
    }),
    [events, paidIds, lastAddedEventId, giro, setGiro]
  );

  return <BarberCtx.Provider value={value}>{children}</BarberCtx.Provider>;
}

export function useBarber() {
  const v = useContext(BarberCtx);
  if (!v) throw new Error('useBarber dentro de BarberProvider');
  return v;
}
