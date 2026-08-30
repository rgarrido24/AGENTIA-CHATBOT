'use client';

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Loader2, Zap } from 'lucide-react';
import { MOCK_ALUMNOS, type Alumno } from '@/lib/mock-data-cobranza';
import { generarCfdiDemoPdf, type CfdiPdfPayload } from '@/lib/cobranza-cfdi-pdf';
import {
  MESES_PERIODO,
  MOCK_HISTORIAL_CFDI,
  mockRfcReceptor,
  type CfdiHistorialRow,
} from '@/lib/cobranza-facturacion-mock';

const REGIMEN = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '626', label: '626 - Simplificado de Confianza' },
  { value: '608', label: '608 - Demás ingresos (más común para alumnos)' },
];

const USO_CFDI = [
  { value: 'D10', label: 'D10 - Pagos por servicios educativos' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
];

const FORMA_PAGO = [
  { value: '01', label: '01 - Efectivo' },
  { value: '02', label: '02 - Cheque' },
  { value: '03', label: '03 - Transferencia' },
  { value: '04', label: '04 - Tarjeta' },
];

function validarRfc(v: string): boolean {
  const s = v.trim().toUpperCase();
  return /^[A-ZÑ&0-9]{12,13}$/.test(s);
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function randomFolio() {
  return `A-${Math.floor(1000 + Math.random() * 9000)}`;
}

function mockUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().toUpperCase();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16).toUpperCase();
  });
}

export default function FacturacionPage() {
  const [buscar, setBuscar] = useState('');
  const [openDrop, setOpenDrop] = useState(false);
  const [alumnoSel, setAlumnoSel] = useState<Alumno | null>(null);

  const [rfc, setRfc] = useState('');
  const [razon, setRazon] = useState('');
  const [email, setEmail] = useState('');
  const [regimen, setRegimen] = useState('601');
  const [uso, setUso] = useState('D10');
  const [concepto, setConcepto] = useState('');
  const [periodo, setPeriodo] = useState('2026-03');
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [iva, setIva] = useState(false);
  const [formaPago, setFormaPago] = useState('03');
  const [metodoPago, setMetodoPago] = useState<'PUE' | 'PPD'>('PUE');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generando, setGenerando] = useState(false);
  const [preview, setPreview] = useState<CfdiPdfPayload | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [historial, setHistorial] = useState<CfdiHistorialRow[]>(MOCK_HISTORIAL_CFDI);
  const [cancelModal, setCancelModal] = useState<CfdiHistorialRow | null>(null);
  const filtrados = useMemo(() => {
    const t = buscar.trim().toLowerCase();
    if (!t) return [] as Alumno[];
    return MOCK_ALUMNOS.filter(
      (a) =>
        a.nombre.toLowerCase().includes(t) ||
        a.tutor.toLowerCase().includes(t) ||
        a.id.toLowerCase().includes(t)
    ).slice(0, 8);
  }, [buscar]);

  const subNum = typeof subtotal === 'number' ? subtotal : 0;
  const ivaMonto = iva ? Math.round(subNum * 0.16 * 100) / 100 : 0;
  const totalCalc = Math.round((subNum + ivaMonto) * 100) / 100;

  const aplicarAlumno = useCallback((a: Alumno) => {
    setAlumnoSel(a);
    setRfc(mockRfcReceptor(a));
    setRazon(a.tutor);
    setEmail(a.email);
    setConcepto(`Servicios educativos - ${a.carrera}`);
    const base = a.montoAdeudo > 0 ? a.montoAdeudo : a.montoColegiatura;
    setSubtotal(base);
    setBuscar(a.nombre);
    setOpenDrop(false);
  }, []);

  const limpiar = () => {
    setAlumnoSel(null);
    setRfc('');
    setRazon('');
    setEmail('');
    setConcepto('');
    setSubtotal('');
    setBuscar('');
    setPreview(null);
    setErrors({});
  };

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    if (!validarRfc(rfc)) e.rfc = 'RFC debe tener 12–13 caracteres alfanuméricos válidos.';
    if (!razon.trim()) e.razon = 'Requerido.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email válido requerido.';
    if (!concepto.trim()) e.concepto = 'Requerido.';
    if (typeof subtotal !== 'number' || subtotal <= 0) e.subtotal = 'Ingresa un subtotal mayor a 0.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const generar = async () => {
    if (!validar()) return;
    setGenerando(true);
    setPreview(null);
    await new Promise((r) => setTimeout(r, 1500));
    const folio = randomFolio();
    const uuid = mockUuid();
    const fecha = new Date().toLocaleString('es-MX');
    const payload: CfdiPdfPayload = {
      folio,
      uuid,
      fecha,
      rfcReceptor: rfc.trim().toUpperCase(),
      razonSocial: razon.trim(),
      concepto: concepto.trim(),
      subtotal: subNum,
      iva: ivaMonto,
      total: totalCalc,
      aplicaIva: iva,
      alumno: alumnoSel,
    };
    setPreview(payload);
    await generarCfdiDemoPdf(payload);
    setGenerando(false);
    setToast('✅ CFDI generado correctamente (modo demo)');
    setTimeout(() => setToast(null), 3500);
  };

  const descargarOtraVez = () => {
    if (!preview) return;
    void generarCfdiDemoPdf(preview);
  };

  const emailDemo = () => {
    setToast(
      'En producción el CFDI se envía automáticamente al email del receptor. Esta función requiere integración con el timbrador fiscal.'
    );
    setTimeout(() => setToast(null), 5000);
  };

  const cancelarConfirm = () => {
    if (!cancelModal) return;
    setHistorial((h) =>
      h.map((row) => (row.id === cancelModal.id ? { ...row, status: 'Cancelado' as const } : row))
    );
    setCancelModal(null);
  };

  const verPdfHistorial = (row: CfdiHistorialRow) => {
    const al = MOCK_ALUMNOS.find((a) => a.nombre === row.alumno) ?? null;
    const sub = row.total / (1 + 0.16);
    void generarCfdiDemoPdf({
      folio: row.folio,
      uuid: mockUuid(),
      fecha: new Date(row.fecha).toLocaleString('es-MX'),
      rfcReceptor: row.rfc,
      razonSocial: al?.tutor ?? row.alumno,
      concepto: row.concepto,
      subtotal: Math.round(sub * 100) / 100,
      iva: Math.round(row.total - sub),
      total: row.total,
      aplicaIva: true,
      alumno: al,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner demo */}
      <div
        className="rounded-xl border-2 border-blue-600/60 bg-[#0f172a] p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
        style={{ boxShadow: '0 0 24px rgba(30, 64, 175, 0.15)' }}
      >
        <div className="flex gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-blue-900/80 border border-blue-500/50 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-amber-300" />
          </div>
          <div className="text-sm text-slate-200 leading-relaxed">
            <p className="font-semibold text-white">MODO DEMO — Generación de CFDI simulada</p>
            <p className="text-slate-400 mt-1">
              En producción esta sección se conecta a Facturapi o SW Sapien para emitir CFDIs reales timbrados ante el
              SAT automáticamente.
            </p>
          </div>
        </div>
        <a
          href="mailto:contacto@agentia.mx?subject=Integración%20facturación%20CFDI"
          className="inline-flex justify-center items-center px-4 py-2.5 rounded-lg bg-[#1e40af] hover:bg-blue-800 text-sm font-semibold text-white transition whitespace-nowrap"
        >
          Contactar a Agentia
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
        {/* Formulario */}
        <div className="space-y-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-6">
          <h2 className="text-sm font-semibold text-white border-b border-white/10 pb-2">Datos del receptor</h2>

          <div className="relative">
            <label className="text-xs text-slate-500">Buscar alumno existente</label>
            <input
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setOpenDrop(true);
              }}
              onFocus={() => setOpenDrop(true)}
              placeholder="Nombre, tutor o folio…"
              className="mt-1 w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
            />
            {openDrop && filtrados.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-white/10 bg-[#0f172a] shadow-xl">
                {filtrados.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                      onClick={() => aplicarAlumno(a)}
                    >
                      {a.nombre} <span className="text-slate-500">· {a.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">RFC del receptor *</label>
              <input
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                className={`mt-1 w-full bg-slate-900/80 border rounded-lg px-3 py-2 text-sm text-white ${
                  errors.rfc ? 'border-red-500' : 'border-white/15'
                }`}
              />
              {errors.rfc && <p className="text-xs text-red-400 mt-1">{errors.rfc}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-500">Razón social / nombre *</label>
              <input
                value={razon}
                onChange={(e) => setRazon(e.target.value)}
                className={`mt-1 w-full bg-slate-900/80 border rounded-lg px-3 py-2 text-sm text-white ${
                  errors.razon ? 'border-red-500' : 'border-white/15'
                }`}
              />
              {errors.razon && <p className="text-xs text-red-400 mt-1">{errors.razon}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Email para envío del CFDI *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 w-full bg-slate-900/80 border rounded-lg px-3 py-2 text-sm text-white ${
                  errors.email ? 'border-red-500' : 'border-white/15'
                }`}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-500">Régimen fiscal</label>
              <select
                value={regimen}
                onChange={(e) => setRegimen(e.target.value)}
                className="mt-1 w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
              >
                {REGIMEN.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Uso del CFDI</label>
              <select
                value={uso}
                onChange={(e) => setUso(e.target.value)}
                className="mt-1 w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
              >
                {USO_CFDI.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-white border-b border-white/10 pb-2 pt-2">Datos del comprobante</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500">Concepto *</label>
              <input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className={`mt-1 w-full bg-slate-900/80 border rounded-lg px-3 py-2 text-sm text-white ${
                  errors.concepto ? 'border-red-500' : 'border-white/15'
                }`}
              />
              {errors.concepto && <p className="text-xs text-red-400 mt-1">{errors.concepto}</p>}
            </div>
            <div>
              <label className="text-xs text-slate-500">Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="mt-1 w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
              >
                {MESES_PERIODO.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Subtotal</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={subtotal === '' ? '' : subtotal}
                onChange={(e) => setSubtotal(e.target.value === '' ? '' : Number(e.target.value))}
                className={`mt-1 w-full bg-slate-900/80 border rounded-lg px-3 py-2 text-sm text-white ${
                  errors.subtotal ? 'border-red-500' : 'border-white/15'
                }`}
              />
              {errors.subtotal && <p className="text-xs text-red-400 mt-1">{errors.subtotal}</p>}
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={iva} onChange={(e) => setIva(e.target.checked)} className="rounded" />
                Aplicar IVA 16%
              </label>
            </div>
            <div className="sm:col-span-2 rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-white tabular-nums">{fmtMoney(totalCalc)}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500">Forma de pago</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                className="mt-1 w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
              >
                {FORMA_PAGO.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500">Método de pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as 'PUE' | 'PPD')}
                className="mt-1 w-full bg-slate-900/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="PUE">PUE — Pago en una sola exhibición</option>
                <option value="PPD">PPD — Pago en parcialidades</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              disabled={generando}
              onClick={() => void generar()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e40af] hover:bg-blue-800 disabled:opacity-60 text-sm font-semibold"
            >
              {generando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando CFDI…
                </>
              ) : (
                'Generar CFDI Demo'
              )}
            </button>
            <button
              type="button"
              onClick={limpiar}
              className="px-5 py-2.5 rounded-xl border border-white/20 text-sm text-slate-300 hover:bg-white/5"
            >
              Limpiar formulario
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-6 min-h-[320px]">
          {!preview ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-500">
              <FileText className="w-14 h-14 mb-3 opacity-40" />
              <p className="text-sm">Completa el formulario para previsualizar el CFDI</p>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <h3 className="text-white font-semibold border-b border-white/10 pb-2">CFDI generado</h3>
              <p className="text-lg font-bold text-blue-200">📄 INSTITUTO MERIDIAN</p>
              <p className="text-slate-400 text-xs">RFC emisor: IEM240101AB3</p>
              <div className="border-t border-white/10 pt-3 space-y-1 text-slate-300">
                <p>
                  <span className="text-slate-500">Folio:</span> {preview.folio}
                </p>
                <p>
                  <span className="text-slate-500">Fecha:</span> {preview.fecha}
                </p>
                <p className="break-all">
                  <span className="text-slate-500">UUID:</span> {preview.uuid}
                </p>
              </div>
              <div className="border-t border-white/10 pt-3">
                <p className="text-slate-500 text-xs">Receptor</p>
                <p className="text-white font-medium">{preview.rfcReceptor}</p>
                <p className="text-slate-300">{preview.razonSocial}</p>
              </div>
              <div className="border-t border-white/10 pt-3 space-y-1">
                <p>
                  <span className="text-slate-500">Concepto:</span> {preview.concepto}
                </p>
                <p>Subtotal: {fmtMoney(preview.subtotal)}</p>
                {preview.aplicaIva && <p>IVA 16%: {fmtMoney(preview.iva)}</p>}
                <p className="text-lg font-bold text-emerald-300">TOTAL: {fmtMoney(preview.total)}</p>
              </div>
              <p className="text-xs text-slate-500 break-all">
                Sello digital: {(preview.uuid + preview.folio).replace(/-/g, '').slice(0, 20)}…
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={descargarOtraVez}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs"
                >
                  ⬇ Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={emailDemo}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/15 text-xs hover:bg-white/5"
                >
                  📧 Enviar por email (demo)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 bg-white/[0.03]">
          <h3 className="text-sm font-semibold">Historial de facturas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/10">
                <th className="px-3 py-3 font-medium">Folio</th>
                <th className="px-3 py-3 font-medium">Alumno</th>
                <th className="px-3 py-3 font-medium">RFC</th>
                <th className="px-3 py-3 font-medium">Concepto</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((row) => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-white">{row.folio}</td>
                  <td className="px-3 py-2.5">{row.alumno}</td>
                  <td className="px-3 py-2.5 text-slate-400">{row.rfc}</td>
                  <td className="px-3 py-2.5 text-slate-400 max-w-[180px] truncate" title={row.concepto}>
                    {row.concepto}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{fmtMoney(row.total)}</td>
                  <td className="px-3 py-2.5 text-slate-400">{row.fecha}</td>
                  <td className="px-3 py-2.5">
                    {row.status === 'Timbrado' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Timbrado
                      </span>
                    )}
                    {row.status === 'Cancelado' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                        Cancelado
                      </span>
                    )}
                    {row.status === 'Pendiente' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 space-x-2">
                    <button
                      type="button"
                      onClick={() => verPdfHistorial(row)}
                      className="text-xs text-blue-300 hover:underline"
                    >
                      Ver PDF
                    </button>
                    <button
                      type="button"
                      disabled={row.status === 'Cancelado'}
                      onClick={() => setCancelModal(row)}
                      className="text-xs text-red-300 hover:underline disabled:opacity-40"
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] max-w-md px-4 py-3 rounded-lg bg-slate-800 border border-white/10 text-sm text-slate-100 shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancelModal && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelModal(null)}
              aria-label="Cerrar"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%-2rem,400px)] rounded-xl border border-white/10 bg-[#0f172a] p-5 shadow-2xl"
            >
              <p className="text-white font-medium mb-2">¿Cancelar CFDI {cancelModal.folio}?</p>
              <p className="text-sm text-slate-400 mb-4">En demo solo se actualiza el estado local.</p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCancelModal(null)}
                  className="px-4 py-2 rounded-lg border border-white/15 text-sm"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={cancelarConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-medium"
                >
                  Confirmar cancelación
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
