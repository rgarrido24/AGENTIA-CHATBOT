'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { CalendarEvent } from './CalendarDemo';

type Ctx = {
  events: CalendarEvent[];
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  paidIds: Set<string>;
  setPaidIds: Dispatch<SetStateAction<Set<string>>>;
  lastAddedEventId: string | null;
  setLastAddedEventId: Dispatch<SetStateAction<string | null>>;
};

const BarberCtx = createContext<Ctx | null>(null);

export function BarberProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [lastAddedEventId, setLastAddedEventId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      events,
      setEvents,
      paidIds,
      setPaidIds,
      lastAddedEventId,
      setLastAddedEventId,
    }),
    [events, paidIds, lastAddedEventId]
  );

  return <BarberCtx.Provider value={value}>{children}</BarberCtx.Provider>;
}

export function useBarber() {
  const v = useContext(BarberCtx);
  if (!v) throw new Error('useBarber dentro de BarberProvider');
  return v;
}
