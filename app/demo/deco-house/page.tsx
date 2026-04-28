'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:     '#0a0a0f',
  card:   '#0d0d1a',
  card2:  '#111122',
  accent: '#4fc3f7',
  silver: '#b0bec5',
  border: '#1c1c2e',
  borderA:'rgba(79,195,247,0.2)',
  text:   '#ffffff',
  dim:    '#7788aa',
  green:  '#25d366',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg  = { from: 'bot' | 'client'; text: string; ts: string };
type QuoteValues = {
  producto: string; uso: string;    medidas: string; piso: string;
  ciudad:   string; cantidad: string; color: string; contacto: string;
};

// ─── Flow ─────────────────────────────────────────────────────────────────────
const FLOW: { key: keyof QuoteValues; botText: string; chips: string[] }[] = [
  {
    key: 'producto',
    botText: '¿Qué tipo de producto necesitas?\n¿Mampara, ventana, shower door, puerta, vidrio para proyecto, o algo más específico?',
    chips: ['Mampara de baño', 'Ventana', 'Shower Door', 'Puerta de cristal', 'Vidrio para proyecto'],
  },
  {
    key: 'uso',
    botText: '¿Es para uso residencial, comercial o industrial?',
    chips: ['Residencial 🏠', 'Comercial 🏢', 'Industrial 🏭'],
  },
  {
    key: 'medidas',
    botText: '¿Tienes las medidas aproximadas?\n(ancho × alto en metros o centímetros)',
    chips: ['0.80 × 2.00 m', '1.20 × 2.00 m', '1.50 × 2.20 m', 'No sé aún'],
  },
  {
    key: 'piso',
    botText: '¿En qué piso se instalará?\n(Afecta el costo de instalación y tipo de vidrio recomendado)',
    chips: ['Primer piso', 'Segundo piso', 'Tercer piso', '4to piso o más'],
  },
  {
    key: 'ciudad',
    botText: '¿En qué ciudad y comuna es la instalación?',
    chips: ['Santiago Centro', 'Las Condes', 'Providencia', 'Vitacura', 'Otra ciudad'],
  },
  {
    key: 'cantidad',
    botText: '¿Cuántas unidades o metros cuadrados necesitas aproximadamente?',
    chips: ['1 unidad', '2 unidades', '3 o más unidades', 'Cotizar por m²'],
  },
  {
    key: 'color',
    botText: '¿Qué color de perfil prefieres?\n(Negro · Blanco · Mate/Gris · Roble dorado · Titanio)',
    chips: ['Negro', 'Blanco', 'Mate/Gris', 'Roble dorado', 'Titanio'],
  },
  {
    key: 'contacto',
    botText: 'Perfecto, ya tengo todo lo que necesito 📋\n¿Me das tu nombre y teléfono para enviarte la cotización?',
    chips: ['María González — +56 9 1234 5678'],
  },
];

function buildSummary(q: Partial<QuoteValues>): string {
  return (
    '✅ *RESUMEN DE TU SOLICITUD:*\n\n' +
    `PRODUCTO: ${q.producto ?? '-'}\n` +
    `USO: ${q.uso ?? '-'}\n` +
    `MEDIDAS: ${q.medidas ?? '-'}\n` +
    `PISO: ${q.piso ?? '-'}\n` +
    `CIUDAD/COMUNA: ${q.ciudad ?? '-'}\n` +
    `CANTIDAD: ${q.cantidad ?? '-'}\n` +
    `ESPECIFICACIONES: Perfil ${q.color ?? '-'}\n` +
    `CONTACTO: ${q.contacto ?? '-'}\n\n` +
    'EN BREVE RECIBIRÁS TU COTIZACIÓN EN PDF\n' +
    '¡GRACIAS POR CONTACTAR A DECO HOUSE! 🪟'
  );
}

function nowTs() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Msg }) {
  const isBot = msg.from === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        style={{
          maxWidth: '80%',
          background: isBot ? C.card2 : 'rgba(79,195,247,0.12)',
          border: `1px solid ${isBot ? C.border : 'rgba(79,195,247,0.3)'}`,
          borderRadius: isBot ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
          padding: '8px 10px',
        }}
      >
        <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: isBot ? C.silver : C.text }}>
          {msg.text.replace(/\*/g, '')}
        </p>
        <p className="text-right mt-1" style={{ fontSize: 9, color: C.dim }}>{msg.ts}</p>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start mb-2">
      <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '4px 12px 12px 12px', padding: '8px 12px' }}>
        <span className="inline-flex gap-1 items-center" style={{ color: C.dim }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="inline-block w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: C.accent, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// ─── Owner Alert (WhatsApp notification) ─────────────────────────────────────
function OwnerAlert({ summary }: { summary: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: C.card, border: `1px solid ${C.borderA}` }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: C.green + '22', borderBottom: `1px solid ${C.green}30` }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: C.green + '44', color: C.green }}>J</div>
        <div>
          <p className="text-xs font-bold text-white">Jorfran · Deco House</p>
          <p style={{ fontSize: 10, color: C.green }}>+56 9 3531 1883</p>
        </div>
        <div className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold animate-pulse" style={{ background: C.green + '33', color: C.green }}>
          Nueva cotización
        </div>
      </div>

      {/* Message bubble (WhatsApp style) */}
      <div className="p-4">
        <div className="rounded-xl p-3" style={{ background: '#0a2010', border: `1px solid ${C.green}40` }}>
          <p className="text-xs font-bold mb-2" style={{ color: C.green }}>🚨 Nueva solicitud de cotización</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#ccc' }}>
            {summary.replace(/\*/g, '')}
          </p>
          <p className="text-right mt-2" style={{ fontSize: 9, color: '#555' }}>{nowTs()} ✓✓</p>
        </div>
        <p className="text-center mt-3 text-xs" style={{ color: C.dim }}>
          Mensaje enviado al WhatsApp del dueño
        </p>
      </div>
    </div>
  );
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
async function generatePDF(q: Partial<QuoteValues>, advisor: AdvisorForm) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = (await import('jspdf-autotable')) as { default: (doc: InstanceType<typeof jsPDF>, opts: object) => void };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const accent: [number, number, number] = [79, 195, 247];
  const dark:   [number, number, number] = [10, 10, 15];
  const gray:   [number, number, number] = [176, 190, 197];

  // ── Background header ──
  doc.setFillColor(...dark);
  doc.rect(0, 0, 210, 40, 'F');

  // ── Logo placeholder ──
  doc.setFillColor(...accent);
  doc.roundedRect(14, 10, 22, 22, 3, 3, 'F');
  doc.setTextColor(10, 10, 15);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DECO', 25, 18, { align: 'center' });
  doc.text('HOUSE', 25, 23, { align: 'center' });
  doc.text('🪟', 25, 29, { align: 'center' });

  // ── Company name ──
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Deco House', 42, 21);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text('Especialistas en vidrio y aluminio', 42, 28);

  // ── Cotización label ──
  doc.setFillColor(...accent);
  doc.roundedRect(148, 11, 50, 18, 3, 3, 'F');
  doc.setTextColor(10, 10, 15);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('COTIZACIÓN', 173, 19, { align: 'center' });
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('es-CL'), 173, 26, { align: 'center' });

  let y = 50;

  // ── Client info ──
  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', 14, y);
  y += 4;
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(14, y, 80, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contactParts = (q.contacto ?? 'Cliente').split('—');
  const clientName  = contactParts[0]?.trim() ?? 'Cliente';
  const clientPhone = contactParts[1]?.trim() ?? '-';

  const clientRows = [
    ['Nombre', clientName],
    ['Teléfono', clientPhone],
    ['Ciudad / Comuna', q.ciudad ?? '-'],
  ];
  for (const [label, val] of clientRows) {
    doc.setTextColor(...gray);
    doc.text(label + ':', 14, y);
    doc.setTextColor(...dark);
    doc.text(val, 55, y);
    y += 5;
  }

  y += 4;

  // ── Product details ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...dark);
  doc.text('DESCRIPCIÓN DEL PRODUCTO', 14, y);
  y += 4;
  doc.setDrawColor(...accent);
  doc.line(14, y, 105, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Campo', 'Detalle']],
    body: [
      ['Producto', q.producto ?? '-'],
      ['Uso', q.uso ?? '-'],
      ['Medidas', q.medidas ?? '-'],
      ['Piso de instalación', q.piso ?? '-'],
      ['Cantidad', q.cantidad ?? '-'],
      ['Color de perfil', q.color ?? '-'],
    ],
    headStyles: { fillColor: accent, textColor: [10, 10, 15], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 50] },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Price breakdown ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESGLOSE DE PRECIOS (CLP)', 14, y);
  y += 4;
  doc.setDrawColor(...accent);
  doc.line(14, y, 100, y);

  const precioM2   = Number(advisor.precioM2) || 0;
  const instalacion = Number(advisor.costoInstalacion) || 0;
  const descPct    = Number(advisor.descuento) || 0;
  const subtotal   = precioM2 + instalacion;
  const descMonto  = subtotal * (descPct / 100);
  const base       = subtotal - descMonto;
  const iva        = base * 0.19;
  const total      = base + iva;

  const fmt = (n: number) => `$${n.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;

  autoTable(doc, {
    startY: y + 2,
    head: [['Concepto', 'Monto (CLP)']],
    body: [
      ['Material / Vidrio y aluminio', fmt(precioM2)],
      ['Instalación', fmt(instalacion)],
      ...(descPct > 0 ? [[`Descuento (${descPct}%)`, `-${fmt(descMonto)}`]] : []),
      ['Subtotal', fmt(base)],
      ['IVA (19%)', fmt(iva)],
    ],
    foot: [['TOTAL', fmt(total)]],
    headStyles: { fillColor: accent, textColor: dark, fontStyle: 'bold', fontSize: 8 },
    footStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Delivery + notes ──
  if (advisor.tiempoEntrega) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...dark);
    doc.text('Tiempo de entrega estimado: ', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(advisor.tiempoEntrega, 70, y);
    y += 5;
  }
  if (advisor.notas) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notas del asesor: ', 14, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(advisor.notas, 170);
    doc.text(lines, 14, y + 5);
    y += 5 + lines.length * 4 + 3;
  }

  // ── Validity ──
  y += 4;
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(14, y, 182, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 100, 150);
  doc.text('⏳  Validez de esta cotización: 15 días a partir de la fecha de emisión.', 103, y + 5, { align: 'center' });
  y += 14;

  // ── Contact info ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text('CONTACTO DECO HOUSE', 14, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text('📞 +56 9 3531 1883  |  📧 contacto@decohouse.cl  |  Chile', 14, y);

  // ── Footer ──
  const pageH = 297;
  doc.setFillColor(...dark);
  doc.rect(0, pageH - 14, 210, 14, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...accent);
  doc.text('Deco House · Vidrio y aluminio para espacios modernos', 105, pageH - 8, { align: 'center' });
  doc.setTextColor(...gray);
  doc.text('Este documento es una cotización. Sujeto a confirmación de stock y medidas definitivas.', 105, pageH - 4, { align: 'center' });

  doc.save(`cotizacion-deco-house-${Date.now()}.pdf`);
}

// ─── Advisor form type ────────────────────────────────────────────────────────
type AdvisorForm = {
  precioM2: string; costoInstalacion: string; descuento: string;
  tiempoEntrega: string; notas: string;
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DecoHouseDemoPage() {
  const [messages, setMessages]       = useState<Msg[]>([]);
  const [step, setStep]               = useState(-1); // -1 = not started
  const [typing, setTyping]           = useState(false);
  const [quoteData, setQuoteData]     = useState<Partial<QuoteValues>>({});
  const [done, setDone]               = useState(false);
  const [summary, setSummary]         = useState('');
  const [advisor, setAdvisor]         = useState<AdvisorForm>({
    precioM2: '', costoInstalacion: '', descuento: '0',
    tiempoEntrega: '5-7 días hábiles', notas: '',
  });
  const [generating, setGenerating]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, typing, scrollToBottom]);

  // Auto-start: show initial client message + bot welcome
  useEffect(() => {
    const t0 = setTimeout(() => {
      setMessages([{ from: 'client', text: 'Hola, necesito una mampara para mi baño', ts: nowTs() }]);
      setTyping(true);
    }, 600);
    const t1 = setTimeout(() => {
      setTyping(false);
      setMessages(prev => [
        ...prev,
        { from: 'bot', text: '¡Hola! Bienvenido a Deco House 🪟\nSomos especialistas en vidrio y aluminio para espacios modernos. ¿En qué te puedo ayudar?', ts: nowTs() },
      ]);
      setTyping(true);
    }, 1800);
    const t2 = setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: FLOW[0].botText, ts: nowTs() }]);
      setStep(0);
    }, 3200);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function handleChip(chip: string) {
    if (typing || step < 0 || done) return;
    const currentStep = FLOW[step];
    const newData = { ...quoteData, [currentStep.key]: chip.replace(/[🏠🏢🏭]/g, '').trim() };
    setQuoteData(newData);

    setMessages(prev => [...prev, { from: 'client', text: chip, ts: nowTs() }]);
    setTyping(true);

    const nextStep = step + 1;
    const delay = 900 + Math.random() * 400;

    if (nextStep >= FLOW.length) {
      // Done — show summary
      setTimeout(() => {
        setTyping(false);
        const s = buildSummary(newData);
        setMessages(prev => [...prev, { from: 'bot', text: s, ts: nowTs() }]);
        setSummary(s);
        setDone(true);
        setStep(nextStep);
      }, delay);
    } else {
      setTimeout(() => {
        setTyping(false);
        setMessages(prev => [...prev, { from: 'bot', text: FLOW[nextStep].botText, ts: nowTs() }]);
        setStep(nextStep);
      }, delay);
    }
  }

  function handleReset() {
    setMessages([]);
    setStep(-1);
    setTyping(false);
    setQuoteData({});
    setDone(false);
    setSummary('');

    const t0 = setTimeout(() => {
      setMessages([{ from: 'client', text: 'Hola, necesito una mampara para mi baño', ts: nowTs() }]);
      setTyping(true);
    }, 300);
    const t1 = setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: '¡Hola! Bienvenido a Deco House 🪟\nSomos especialistas en vidrio y aluminio para espacios modernos. ¿En qué te puedo ayudar?', ts: nowTs() }]);
      setTyping(true);
    }, 1400);
    const t2 = setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { from: 'bot', text: FLOW[0].botText, ts: nowTs() }]);
      setStep(0);
    }, 2600);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }

  const currentChips = !done && step >= 0 && step < FLOW.length && !typing
    ? FLOW[step].chips
    : [];

  async function handlePDFClick() {
    setGenerating(true);
    try {
      await generatePDF(quoteData, advisor);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      {/* ── Nav ── */}
      <nav className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: C.border, background: C.card }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: C.accent, color: C.bg }}>
            🪟
          </div>
          <div>
            <p className="text-sm font-bold text-white">Deco House</p>
            <p style={{ fontSize: 10, color: C.dim }}>Vidrio · Aluminio · Chile</p>
          </div>
        </div>
        <Link href="/" className="text-xs" style={{ color: C.dim }}>← Inicio</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Hero ── */}
        <div className="text-center">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-4"
            style={{ background: 'rgba(79,195,247,0.1)', border: `1px solid ${C.borderA}`, color: C.accent }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
            Asistente de cotizaciones IA — Deco House
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Cotiza en segundos,{' '}
            <span style={{ color: C.accent }}>vende más rápido</span>
          </h1>
          <p style={{ color: C.silver }} className="text-sm max-w-lg mx-auto">
            El chatbot recopila todos los datos que necesitas para cotizar: producto, medidas, piso, comuna y contacto — sin formularios aburridos.
          </p>
        </div>

        {/* ── Two-column: Phone | Owner alert ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── Phone mockup ── */}
          <div className="flex flex-col items-center">
            <div
              className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: '#050508', border: `2px solid ${C.borderA}`, boxShadow: `0 0 60px rgba(79,195,247,0.08)` }}
            >
              {/* Status bar */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1" style={{ background: '#050508' }}>
                <span className="text-xs text-white font-medium">{new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
                <div className="w-16 h-4 rounded-full" style={{ background: '#111' }} />
                <div className="flex gap-1 items-center">
                  <span style={{ fontSize: 10, color: C.silver }}>●●●●</span>
                </div>
              </div>

              {/* WhatsApp header */}
              <div className="px-3 py-2.5 flex items-center gap-2.5" style={{ background: '#075e54' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#0a2a25', color: '#25d366' }}>🪟</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white">Asistente Deco House</p>
                  <p style={{ fontSize: 10, color: '#aaa' }}>
                    {typing ? 'escribiendo...' : 'en línea'}
                  </p>
                </div>
                <div className="flex gap-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ fontSize: 14 }}>📞</span>
                  <span style={{ fontSize: 14 }}>⋮</span>
                </div>
              </div>

              {/* Chat area */}
              <div
                className="px-3 py-3 overflow-y-auto space-y-1"
                style={{ height: 380, background: '#0b1a18', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(79,195,247,0.02) 0%, transparent 70%)' }}
              >
                {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                {typing && <TypingDots />}
                <div ref={chatEndRef} />
              </div>

              {/* Chips */}
              <div className="px-3 py-2.5 min-h-[56px]" style={{ background: '#050810', borderTop: `1px solid ${C.border}` }}>
                {currentChips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {currentChips.map(chip => (
                      <button
                        key={chip}
                        onClick={() => handleChip(chip)}
                        className="text-xs px-2.5 py-1 rounded-full font-medium transition-all active:scale-95"
                        style={{
                          background: 'rgba(79,195,247,0.1)',
                          border: `1px solid rgba(79,195,247,0.35)`,
                          color: C.accent,
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                ) : done ? (
                  <button
                    onClick={handleReset}
                    className="w-full text-xs py-1.5 rounded-full font-medium transition-all"
                    style={{ background: 'rgba(79,195,247,0.08)', border: `1px solid ${C.borderA}`, color: C.dim }}
                  >
                    ↺ Reiniciar demo
                  </button>
                ) : (
                  <p className="text-center text-xs" style={{ color: C.dim }}>
                    {typing ? '' : 'Iniciando...'}
                  </p>
                )}
              </div>
            </div>

            <p className="text-center mt-3 text-xs" style={{ color: C.dim }}>
              Toca las opciones para avanzar en el flujo de cotización
            </p>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">

            {/* Product catalog */}
            <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="text-sm font-bold text-white mb-4">Catálogo de productos</p>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: C.silver }}>
                {[
                  ['🪟', 'Mamparas aluminio', 'Negro, Blanco, Titanio...'],
                  ['🚿', 'Shower Door', 'Herrajes inoxidable'],
                  ['🪞', 'Espejos', 'Laminados, biselados'],
                  ['🏢', 'Puertas Protex', 'Cristal 1 y 2 hojas'],
                  ['🔶', 'Vidrios especiales', 'Solar Cool, Bronce'],
                  ['🔒', 'Seguridad', '30mm-50mm para joyerías'],
                ].map(([icon, name, sub]) => (
                  <div key={name} className="rounded-xl p-2.5" style={{ background: C.card2, border: `1px solid ${C.border}` }}>
                    <span className="text-lg">{icon}</span>
                    <p className="font-semibold mt-1 text-white" style={{ fontSize: 11 }}>{name}</p>
                    <p style={{ fontSize: 10, color: C.dim }}>{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner alert — shown after demo completes */}
            {done && summary && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: C.accent }}>
                  Notificación enviada al dueño
                </p>
                <OwnerAlert summary={summary} />
              </div>
            )}

            {/* Placeholder when not done */}
            {!done && (
              <div className="rounded-2xl p-5 text-center" style={{ background: C.card, border: `1px dashed ${C.border}` }}>
                <p className="text-2xl mb-2">📲</p>
                <p className="text-sm font-semibold text-white mb-1">Alerta al dueño</p>
                <p className="text-xs" style={{ color: C.dim }}>
                  Cuando el cliente complete el flujo, Jorfran recibe el resumen completo en WhatsApp automáticamente.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Quote panel ── */}
        {done && (
          <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.borderA}` }}>
            <div className="px-6 py-4" style={{ background: 'rgba(79,195,247,0.06)', borderBottom: `1px solid ${C.borderA}` }}>
              <p className="text-base font-bold text-white">Nueva cotización pendiente</p>
              <p className="text-xs mt-0.5" style={{ color: C.dim }}>Completa los campos para generar el PDF profesional</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ── Lead data (pre-filled) ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.accent }}>Datos del cliente</p>
                {(
                  [
                    ['Producto solicitado', quoteData.producto],
                    ['Medidas', quoteData.medidas],
                    ['Piso de instalación', quoteData.piso],
                    ['Ciudad / Comuna', quoteData.ciudad],
                    ['Cantidad', quoteData.cantidad],
                    ['Especificaciones', `Perfil ${quoteData.color ?? '-'}`],
                    ['Contacto', quoteData.contacto],
                  ] as [string, string | undefined][]
                ).map(([label, val]) => (
                  <div key={label} className="rounded-xl px-3 py-2" style={{ background: C.card2, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, color: C.dim }}>{label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{val ?? '-'}</p>
                  </div>
                ))}
              </div>

              {/* ── Advisor fields ── */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.accent }}>Campos del asesor</p>

                {([
                  { key: 'precioM2',           label: 'Precio material (CLP)',       type: 'number', placeholder: '85000' },
                  { key: 'costoInstalacion',    label: 'Costo instalación (CLP)',     type: 'number', placeholder: '35000' },
                  { key: 'descuento',           label: 'Descuento (%)',               type: 'number', placeholder: '0' },
                  { key: 'tiempoEntrega',       label: 'Tiempo de entrega estimado',  type: 'text',   placeholder: '5-7 días hábiles' },
                ] as { key: keyof AdvisorForm; label: string; type: string; placeholder: string }[]).map(f => (
                  <div key={f.key}>
                    <label className="block text-xs mb-1" style={{ color: C.dim }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={advisor[f.key]}
                      placeholder={f.placeholder}
                      onChange={e => setAdvisor(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full text-sm rounded-xl px-3 py-2"
                      style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs mb-1" style={{ color: C.dim }}>Notas del asesor</label>
                  <textarea
                    rows={3}
                    value={advisor.notas}
                    placeholder="Ej: Incluye traslado, vidrio templado 6mm..."
                    onChange={e => setAdvisor(prev => ({ ...prev, notas: e.target.value }))}
                    className="w-full text-sm rounded-xl px-3 py-2 resize-none"
                    style={{ background: C.card2, border: `1px solid ${C.border}`, color: C.text, outline: 'none' }}
                  />
                </div>

                {/* Price preview */}
                {(Number(advisor.precioM2) > 0 || Number(advisor.costoInstalacion) > 0) && (() => {
                  const sub   = Number(advisor.precioM2) + Number(advisor.costoInstalacion);
                  const desc  = sub * (Number(advisor.descuento) / 100);
                  const base  = sub - desc;
                  const total = base * 1.19;
                  const fmt   = (n: number) => `$${n.toLocaleString('es-CL', { maximumFractionDigits: 0 })}`;
                  return (
                    <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(79,195,247,0.06)', border: `1px solid ${C.borderA}` }}>
                      <div className="flex justify-between text-xs" style={{ color: C.dim }}>
                        <span>Subtotal</span><span>{fmt(base)}</span>
                      </div>
                      <div className="flex justify-between text-xs" style={{ color: C.dim }}>
                        <span>IVA 19%</span><span>{fmt(base * 0.19)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold" style={{ color: C.accent }}>
                        <span>TOTAL</span><span>{fmt(total)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handlePDFClick}
                disabled={generating}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.99] disabled:opacity-60"
                style={{ background: C.accent, color: C.bg }}
              >
                {generating ? 'Generando PDF...' : '📄 Generar cotización PDF'}
              </button>
              <p className="text-center mt-2 text-xs" style={{ color: C.dim }}>
                El PDF incluye logo, desglose de precios con IVA, validez 15 días y datos de contacto.
              </p>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="text-center pt-6 border-t" style={{ borderColor: C.border }}>
          <p className="text-xs" style={{ color: C.dim }}>
            © {new Date().getFullYear()} Deco House · Vidrio y aluminio para espacios modernos · Chile
          </p>
          <p className="text-xs mt-1" style={{ color: '#333' }}>
            Demo desarrollada por{' '}
            <Link href="/" style={{ color: C.accent }}>Agentia</Link>
            {' '}— Chatbots con IA para negocios
          </p>
        </footer>
      </div>
    </div>
  );
}
