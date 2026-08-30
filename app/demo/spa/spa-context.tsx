'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Cita } from '@/lib/mock-data-spa';
import { MOCK_CITAS } from '@/lib/mock-data-spa';

type Ctx = {
  citas: Cita[];
  setCitas: React.Dispatch<React.SetStateAction<Cita[]>>;
  addCita: (c: Cita) => void;
  updateCita: (id: string, patch: Partial<Cita>) => void;
};

const SpaCtx = createContext<Ctx | null>(null);

export function SpaProvider({ children }: { children: ReactNode }) {
  const [citas, setCitas] = useState<Cita[]>(MOCK_CITAS);

  const addCita = useCallback((c: Cita) => {
    setCitas((prev) => [c, ...prev]);
  }, []);

  const updateCita = useCallback((id: string, patch: Partial<Cita>) => {
    setCitas((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const value = useMemo(
    () => ({ citas, setCitas, addCita, updateCita }),
    [citas, addCita, updateCita]
  );

  return <SpaCtx.Provider value={value}>{children}</SpaCtx.Provider>;
}

export function useSpa() {
  const v = useContext(SpaCtx);
  if (!v) throw new Error('useSpa dentro de SpaProvider');
  return v;
}
