'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { DietaActual, Logro, MedicionInBody, RecordatorioConfig } from '@/lib/mock-data-nutricion';
import {
  MOCK_DIETAS_INICIALES,
  MOCK_LOGROS,
  MOCK_MEDICIONES,
  MOCK_RECORDATORIOS,
} from '@/lib/mock-data-nutricion';

type Ctx = {
  mediciones: MedicionInBody[];
  dietas: DietaActual[];
  logros: Logro[];
  recordatorios: RecordatorioConfig[];
  weekendBotOn: boolean;
  setWeekendBotOn: (v: boolean) => void;
  addMedicion: (m: MedicionInBody) => void;
  addLogro: (l: Logro) => void;
  addDieta: (d: DietaActual) => void;
  replaceDietaPaciente: (pacienteId: string, d: DietaActual) => void;
  updateRecordatorio: (pacienteId: string, patch: Partial<RecordatorioConfig>) => void;
};

const NutricionCtx = createContext<Ctx | null>(null);

export function NutricionProvider({ children }: { children: ReactNode }) {
  const [mediciones, setMediciones] = useState<MedicionInBody[]>(() => [...MOCK_MEDICIONES]);
  const [dietas, setDietas] = useState<DietaActual[]>(() => MOCK_DIETAS_INICIALES());
  const [logros, setLogros] = useState<Logro[]>(() => [...MOCK_LOGROS]);
  const [recordatorios, setRecordatorios] = useState<RecordatorioConfig[]>(() =>
    MOCK_RECORDATORIOS.map((r) => ({ ...r }))
  );
  const [weekendBotOn, setWeekendBotOn] = useState<boolean>(true);

  const addMedicion = useCallback((m: MedicionInBody) => {
    setMediciones((prev) => [...prev, m]);
  }, []);

  const addLogro = useCallback((l: Logro) => {
    setLogros((prev) => [l, ...prev]);
  }, []);

  const addDieta = useCallback((d: DietaActual) => {
    setDietas((prev) => [d, ...prev]);
  }, []);

  const replaceDietaPaciente = useCallback((pacienteId: string, d: DietaActual) => {
    setDietas((prev) => {
      const rest = prev.filter((x) => x.pacienteId !== pacienteId);
      return [d, ...rest];
    });
  }, []);

  const updateRecordatorio = useCallback((pacienteId: string, patch: Partial<RecordatorioConfig>) => {
    setRecordatorios((prev) =>
      prev.map((r) => (r.pacienteId === pacienteId ? { ...r, ...patch } : r))
    );
  }, []);

  const value = useMemo(
    () => ({
      mediciones,
      dietas,
      logros,
      recordatorios,
      weekendBotOn,
      setWeekendBotOn,
      addMedicion,
      addLogro,
      addDieta,
      replaceDietaPaciente,
      updateRecordatorio,
    }),
    [
      mediciones,
      dietas,
      logros,
      recordatorios,
      weekendBotOn,
      addMedicion,
      addLogro,
      addDieta,
      replaceDietaPaciente,
      updateRecordatorio,
    ]
  );

  return <NutricionCtx.Provider value={value}>{children}</NutricionCtx.Provider>;
}

export function useNutricion() {
  const x = useContext(NutricionCtx);
  if (!x) throw new Error('useNutricion dentro de NutricionProvider');
  return x;
}
