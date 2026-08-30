'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CitaGrooming, KanbanDomicilioStatus, OrdenDomicilio } from '@/lib/mock-data-grooming';
import { MOCK_CITAS_GROOMING, MOCK_ORDENES_DOMICILIO, MOCK_SERVICIOS } from '@/lib/mock-data-grooming';

type Ctx = {
  citas: CitaGrooming[];
  addCita: (c: CitaGrooming) => void;
  updateCita: (id: string, patch: Partial<CitaGrooming>) => void;
  ordenes: OrdenDomicilio[];
  updateOrden: (id: string, status: KanbanDomicilioStatus) => void;
  notasMascota: Record<string, string>;
  setNotaMascota: (mascotaId: string, nota: string) => void;
  serviciosOn: Record<string, boolean>;
  toggleServicio: (servicioId: string) => void;
};

const GroomingCtx = createContext<Ctx | null>(null);

export function GroomingProvider({ children }: { children: ReactNode }) {
  const [citas, setCitas] = useState<CitaGrooming[]>(MOCK_CITAS_GROOMING);
  const [ordenes, setOrdenes] = useState<OrdenDomicilio[]>(MOCK_ORDENES_DOMICILIO);
  const [notasMascota, setNotasMascota] = useState<Record<string, string>>({});
  const [serviciosOn, setServiciosOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MOCK_SERVICIOS.map((s) => [s.id, s.disponible]))
  );

  const addCita = useCallback((c: CitaGrooming) => {
    setCitas((prev) => [c, ...prev]);
  }, []);

  const updateCita = useCallback((id: string, patch: Partial<CitaGrooming>) => {
    setCitas((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const updateOrden = useCallback((id: string, status: KanbanDomicilioStatus) => {
    setOrdenes((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const setNotaMascota = useCallback((mascotaId: string, nota: string) => {
    setNotasMascota((prev) => ({ ...prev, [mascotaId]: nota }));
  }, []);

  const toggleServicio = useCallback((servicioId: string) => {
    setServiciosOn((prev) => ({ ...prev, [servicioId]: !prev[servicioId] }));
  }, []);

  const value = useMemo(
    () => ({
      citas,
      addCita,
      updateCita,
      ordenes,
      updateOrden,
      notasMascota,
      setNotaMascota,
      serviciosOn,
      toggleServicio,
    }),
    [citas, addCita, updateCita, ordenes, updateOrden, notasMascota, setNotaMascota, serviciosOn, toggleServicio]
  );

  return <GroomingCtx.Provider value={value}>{children}</GroomingCtx.Provider>;
}

export function useGrooming() {
  const v = useContext(GroomingCtx);
  if (!v) throw new Error('useGrooming dentro de GroomingProvider');
  return v;
}
