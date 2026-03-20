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
  Ingrediente,
  Mesa,
  MovimientoCaja,
  Orden,
} from '@/lib/mock-data-restaurante';
import {
  MOCK_CAJA_HOY,
  MOCK_INGREDIENTES,
  MOCK_MESAS,
  MOCK_ORDENES,
} from '@/lib/mock-data-restaurante';

type Ctx = {
  mesas: Mesa[];
  setMesas: React.Dispatch<React.SetStateAction<Mesa[]>>;
  ordenes: Orden[];
  setOrdenes: React.Dispatch<React.SetStateAction<Orden[]>>;
  movimientosCaja: MovimientoCaja[];
  setMovimientosCaja: React.Dispatch<React.SetStateAction<MovimientoCaja[]>>;
  ingredientes: Ingrediente[];
  setIngredientes: React.Dispatch<React.SetStateAction<Ingrediente[]>>;
  addOrden: (o: Orden, opts?: { mesaId?: number; consumo?: number }) => void;
  updateOrdenStatus: (id: string, status: Orden['status']) => void;
};

const RestauranteCtx = createContext<Ctx | null>(null);

export function RestauranteProvider({ children }: { children: ReactNode }) {
  const [mesas, setMesas] = useState<Mesa[]>(MOCK_MESAS);
  const [ordenes, setOrdenes] = useState<Orden[]>(MOCK_ORDENES);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>(MOCK_CAJA_HOY);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(MOCK_INGREDIENTES);

  const addOrden = useCallback((o: Orden, opts?: { mesaId?: number; consumo?: number }) => {
    setOrdenes((prev) => [o, ...prev]);
    if (opts?.mesaId != null) {
      const cons = opts.consumo ?? o.total;
      setMesas((prev) =>
        prev.map((m) =>
          m.id === opts.mesaId
            ? {
                ...m,
                status: 'ocupada' as const,
                ordenActual: o.id,
                tiempoOcupada: 0,
                consumoActual: cons,
              }
            : m
        )
      );
    }
  }, []);

  const updateOrdenStatus = useCallback((id: string, status: Orden['status']) => {
    setOrdenes((prev) => {
      const cur = prev.find((x) => x.id === id);
      const next = prev.map((x) => (x.id === id ? { ...x, status } : x));
      if (status === 'entregada' && cur?.tipo === 'mesa' && cur.mesa) {
        setMesas((ms) =>
          ms.map((m) =>
            m.id === cur.mesa
              ? {
                  ...m,
                  status: 'disponible' as const,
                  ordenActual: undefined,
                  tiempoOcupada: undefined,
                  consumoActual: 0,
                }
              : m
          )
        );
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mesas,
      setMesas,
      ordenes,
      setOrdenes,
      movimientosCaja,
      setMovimientosCaja,
      ingredientes,
      setIngredientes,
      addOrden,
      updateOrdenStatus,
    }),
    [mesas, ordenes, movimientosCaja, ingredientes, addOrden, updateOrdenStatus]
  );

  return <RestauranteCtx.Provider value={value}>{children}</RestauranteCtx.Provider>;
}

export function useRestaurante() {
  const v = useContext(RestauranteCtx);
  if (!v) throw new Error('useRestaurante dentro de RestauranteProvider');
  return v;
}
