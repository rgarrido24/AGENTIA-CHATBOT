'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Cita, Consulta, Paciente, PagoRegistro, RecetaHistorial } from '@/lib/mock-data-medico';
import {
  HOY_MED,
  MOCK_CITAS,
  MOCK_CONSULTAS,
  MOCK_PACIENTES,
  MOCK_PAGOS_DIA,
  MOCK_RECETAS_HISTORIAL,
} from '@/lib/mock-data-medico';

type Ctx = {
  pacientes: Paciente[];
  consultas: Consulta[];
  citas: Cita[];
  recetasHistorial: RecetaHistorial[];
  pagos: PagoRegistro[];
  addConsulta: (c: Consulta) => void;
  addCita: (c: Cita) => void;
  updateCita: (id: string, patch: Partial<Cita>) => void;
  updatePacienteDeuda: (pacienteId: string, deuda: number) => void;
  addReceta: (r: RecetaHistorial) => void;
  addPago: (p: PagoRegistro) => void;
  registrarPago: (
    pacienteId: string,
    monto: number,
    metodo: PagoRegistro['metodo'],
    referencia?: string
  ) => void;
};

const MedicoCtx = createContext<Ctx | null>(null);

export function MedicoProvider({ children }: { children: ReactNode }) {
  const [pacientes, setPacientes] = useState<Paciente[]>(() => [...MOCK_PACIENTES]);
  const [consultas, setConsultas] = useState<Consulta[]>(() => [...MOCK_CONSULTAS]);
  const [citas, setCitas] = useState<Cita[]>(() => [...MOCK_CITAS]);
  const [recetasHistorial, setRecetasHistorial] = useState<RecetaHistorial[]>(() => [...MOCK_RECETAS_HISTORIAL]);
  const [pagos, setPagos] = useState<PagoRegistro[]>(() => [...MOCK_PAGOS_DIA]);

  const addConsulta = useCallback((c: Consulta) => {
    setConsultas((prev) => [c, ...prev]);
  }, []);

  const addCita = useCallback((c: Cita) => {
    setCitas((prev) => [c, ...prev]);
  }, []);

  const updateCita = useCallback((id: string, patch: Partial<Cita>) => {
    setCitas((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, []);

  const updatePacienteDeuda = useCallback((pacienteId: string, deuda: number) => {
    setPacientes((prev) => prev.map((p) => (p.id === pacienteId ? { ...p, deuda: Math.max(0, deuda) } : p)));
  }, []);

  const addReceta = useCallback((r: RecetaHistorial) => {
    setRecetasHistorial((prev) => [r, ...prev]);
  }, []);

  const addPago = useCallback((p: PagoRegistro) => {
    setPagos((prev) => [p, ...prev]);
  }, []);

  const registrarPago = useCallback(
    (pacienteId: string, monto: number, metodo: PagoRegistro['metodo'], referencia?: string) => {
      const p = pacientes.find((x) => x.id === pacienteId);
      if (!p || monto <= 0) return;
      const nuevo: PagoRegistro = {
        id: `pgm-${Date.now()}`,
        pacienteId,
        pacienteNombre: p.nombre,
        monto,
        metodo,
        referencia,
        fecha: HOY_MED,
      };
      setPagos((prev) => [nuevo, ...prev]);
      setPacientes((prev) =>
        prev.map((x) => (x.id === pacienteId ? { ...x, deuda: Math.max(0, x.deuda - monto) } : x))
      );
    },
    [pacientes]
  );

  const value = useMemo(
    () => ({
      pacientes,
      consultas,
      citas,
      recetasHistorial,
      pagos,
      addConsulta,
      addCita,
      updateCita,
      updatePacienteDeuda,
      addReceta,
      addPago,
      registrarPago,
    }),
    [
      pacientes,
      consultas,
      citas,
      recetasHistorial,
      pagos,
      addConsulta,
      addCita,
      updateCita,
      updatePacienteDeuda,
      addReceta,
      addPago,
      registrarPago,
    ]
  );

  return <MedicoCtx.Provider value={value}>{children}</MedicoCtx.Provider>;
}

export function useMedico() {
  const v = useContext(MedicoCtx);
  if (!v) throw new Error('useMedico dentro de MedicoProvider');
  return v;
}
