'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ItemInventario,
  MovimientoCaja,
  OrdenServicio,
  StatusOrden,
} from '@/lib/mock-data-taller';
import {
  MOCK_CAJA_HOY,
  MOCK_INVENTARIO,
  MOCK_ORDENES,
} from '@/lib/mock-data-taller';

type Ctx = {
  ordenes: OrdenServicio[];
  setOrdenes: React.Dispatch<React.SetStateAction<OrdenServicio[]>>;
  movimientosCaja: MovimientoCaja[];
  setMovimientosCaja: React.Dispatch<React.SetStateAction<MovimientoCaja[]>>;
  inventario: ItemInventario[];
  setInventario: React.Dispatch<React.SetStateAction<ItemInventario[]>>;
  updateOrdenStatus: (id: string, status: StatusOrden) => void;
};

const TallerCtx = createContext<Ctx | null>(null);

export function TallerProvider({ children }: { children: ReactNode }) {
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>(MOCK_ORDENES);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>(MOCK_CAJA_HOY);
  const [inventario, setInventario] = useState<ItemInventario[]>(MOCK_INVENTARIO);

  const updateOrdenStatus = useCallback((id: string, status: StatusOrden) => {
    setOrdenes((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next: OrdenServicio = { ...o, status };
        if (status === 'entregado') {
          next.fechaEntrega = new Date().toISOString().slice(0, 10);
        }
        return next;
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      ordenes,
      setOrdenes,
      movimientosCaja,
      setMovimientosCaja,
      inventario,
      setInventario,
      updateOrdenStatus,
    }),
    [ordenes, movimientosCaja, inventario, updateOrdenStatus]
  );

  return <TallerCtx.Provider value={value}>{children}</TallerCtx.Provider>;
}

export function useTaller() {
  const v = useContext(TallerCtx);
  if (!v) throw new Error('useTaller dentro de TallerProvider');
  return v;
}
