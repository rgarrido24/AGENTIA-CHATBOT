'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, MapPin, Clock, CheckCircle, Check } from 'lucide-react';

// ─── Brand ────────────────────────────────────────────────────────────────────

const BLACK = '#000000';
const GOLD  = '#D4AF37';
const RED   = '#CC0000';

// ─── Menú ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id:          string;
  categoria:   'combo' | 'torta';
  nombre:      string;
  precio:      number;
  descripcion: string;
  foto:        string;
  badge?:      { label: string; color: string; bg: string };
}

const MENU: MenuItem[] = [
  {
    id: 'combo-sinaloense',
    categoria: 'combo',
    nombre: 'Combo Sinaloense Premium',
    precio: 100,
    descripcion: 'Torta Sinaloense Premium + papas fritas + agua de jamaica 500ml.',
    foto: '/tortas-barra/combo_sinaloense.jpg',
    badge: { label: 'COMBO', color: BLACK, bg: GOLD },
  },
  {
    id: 'combo-vegetariano',
    categoria: 'combo',
    nombre: 'Combo Vegetariano Premium',
    precio: 120,
    descripcion: 'Torta Vegetariana Premium + papas fritas + agua de jamaica 500ml.',
    foto: '/tortas-barra/COMBO_VEGETARIANO_PREMIUM.jpg',
    badge: { label: 'COMBO', color: BLACK, bg: GOLD },
  },
  {
    id: 'combo-suprema',
    categoria: 'combo',
    nombre: 'Combo Torta Suprema',
    precio: 120,
    descripcion: 'Torta Suprema de Pierna Adobada + papas fritas + agua de jamaica 500ml.',
    foto: '/tortas-barra/COMBO_TORTA_SUPREMA.jpg',
    badge: { label: 'COMBO', color: BLACK, bg: GOLD },
  },
  {
    id: 'torta-sinaloense',
    categoria: 'torta',
    nombre: 'Torta Sinaloense Premium',
    precio: 50,
    descripcion: 'Láminas de jamón con queso manchego, piña tatemada, cebolla caramelizada, lechuga y tomate. Coronada con chile jalapeño curtido, aguacate fresco y aderezo de la casa.',
    foto: '/tortas-barra/TORTA_SINALOENSE_PREMIUM.jpg',
  },
  {
    id: 'torta-vegetariana',
    categoria: 'torta',
    nombre: 'Torta Vegetariana Premium',
    precio: 70,
    descripcion: 'Champiñones salteados en chile morrón con queso manchego, piña tatemada y cebolla caramelizada, lechuga y tomate. Coronada con chile jalapeño curtido, aguacate fresco y aderezo de la casa.',
    foto: '/tortas-barra/TORTA_VEGETARIANA_PREMIUM.jpg',
  },
  {
    id: 'torta-suprema',
    categoria: 'torta',
    nombre: 'Torta Suprema de Pierna Adobada',
    precio: 70,
    descripcion: 'Jugosa pierna de cerdo marinada en mezcla casera de chiles secos, cítricos y especias, queso manchego, piña tatemada, cebolla caramelizada, lechuga y tomate. Coronada con chile jalapeño curtido, aguacate fresco y aderezo de la casa.',
    foto: '/tortas-barra/TORTA_SUPREMA_DE_PIERNA_ADOBADA.jpg',
    badge: { label: 'BESTSELLER', color: '#fff', bg: RED },
  },
];

// ─── Demo flow (hardcoded) ────────────────────────────────────────────────────

type Role = 'user' | 'bot';
interface DemoMsg { role: Role; text: string }

const DEMO_STEPS: DemoMsg[][] = [
  // Step 0 — initial bot greeting
  [
    {
      role: 'bot',
      text: '¡Bienvenido a Las Tortas de la Barra! 🌮\nTodo hecho al momento con sabor único.\n¿Qué se te antoja hoy?',
    },
  ],
  // Step 1 — user says Hola → bot shows menu summary
  [
    { role: 'user', text: 'Hola' },
    {
      role: 'bot',
      text: '¡Hola! 👋 Tenemos para ti:\n\n🌮 *Torta Sinaloense Premium* — $50\n🌿 *Torta Vegetariana Premium* — $70\n🔥 *Torta Suprema de Pierna Adobada* — $70\n\nY nuestros combos incluyen papas fritas + agua de jamaica desde $100.\n\n¿Qué se te antoja?',
    },
  ],
  // Step 2 — user asks for recommendation
  [
    { role: 'user', text: '¿Qué me recomiendas?' },
    {
      role: 'bot',
      text: '¡Te recomiendo el *Combo Sinaloense Premium* por $100! 🤤\n\nLleva nuestra Torta Sinaloense con jamón, queso manchego, piña tatemada y cebolla caramelizada... coronada con aguacate fresco y jalapeño curtido. ¡Un sabor único!\n\nMás papas fritas y agua de jamaica. ¡Todo por $100! ¿Le entramos?',
    },
  ],
  // Step 3 — user wants it
  [
    { role: 'user', text: 'Ese quiero' },
    {
      role: 'bot',
      text: '¡Excelente elección! 🙌\n\n📋 *Tu pedido:*\n• Combo Sinaloense Premium x1 — $100\n\n*Total: $100*\n\n¿Para llevar o a domicilio?',
    },
  ],
  // Step 4 — user says para llevar → order confirmed
  [
    { role: 'user', text: 'Para llevar' },
    {
      role: 'bot',
      text: '¡Perfecto! ✅\n\n🧾 *Pedido confirmado:*\n• Combo Sinaloense Premium — $100\n📦 Para llevar\n💰 *Total: $100*\n⏱ Tiempo de preparación: *15-20 minutos*\n\n¡Gracias por elegir Las Tortas de la Barra! 🌮',
    },
  ],
];

const CHIPS = [
  ['Hola', '¿Qué tienen?', '¿Tienen algo vegetariano?', '¿Cuánto cuesta?'],
  ['¿Qué me recomiendas?', 'Quiero un combo', 'Ver todos los precios'],
  ['Ese quiero', 'Quiero dos', '¿Tienen sin carne?'],
  ['Para llevar', 'A domicilio', '¿A qué hora cierran?'],
  ['Hacer otro pedido', '¡Gracias!', 'Perfecto 👍'],
];

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup({ onOrderClick }: { onOrderClick: (item: MenuItem) => void }) {
  const [step, setStep]       = useState(0);
  const [msgs, setMsgs]       = useState<DemoMsg[]>(DEMO_STEPS[0]);
  const [typing, setTyping]   = useState(false);
  const [input, setInput]     = useState('');
  const [done, setDone]       = useState(false);
  const chatRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  const advance = (chipText?: string) => {
    const nextStep = step + 1;
    if (nextStep >= DEMO_STEPS.length) { setDone(true); return; }

    const stepMsgs = DEMO_STEPS[nextStep];
    const userMsg  = chipText ? { role: 'user' as Role, text: chipText } : stepMsgs[0];
    const botMsg   = stepMsgs.find((m) => m.role === 'bot');

    // Add user message immediately
    if (userMsg.role === 'user') {
      setMsgs((p) => [...p, userMsg]);
    }

    if (botMsg) {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMsgs((p) => [...p, botMsg]);
        setStep(nextStep);
      }, 900 + Math.random() * 400);
    } else {
      setStep(nextStep);
    }

    setInput('');
  };

  const handleSend = () => {
    if (!input.trim()) return;
    advance(input.trim());
  };

  const chips = done ? CHIPS[CHIPS.length - 1] : CHIPS[Math.min(step, CHIPS.length - 1)];

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: 300, filter: 'drop-shadow(0 32px 64px rgba(0,0,0,0.7))' }}
    >
      {/* Phone shell */}
      <div
        className="rounded-[40px] overflow-hidden flex flex-col"
        style={{
          background: '#111',
          border: `3px solid #333`,
          height: 600,
          boxShadow: `inset 0 0 0 1px #222`,
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1" style={{ background: '#075E54' }}>
          <span className="text-[10px] text-white font-medium">9:41</span>
          <div className="w-16 h-4 rounded-full bg-black/60 mx-auto absolute left-1/2 -translate-x-1/2" />
          <span className="text-[10px] text-white">📶 🔋</span>
        </div>

        {/* WA header */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5"
          style={{ background: '#075E54' }}
        >
          <div
            className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 border-white/20 relative"
          >
            <Image src="/tortas-barra/logo_torteria.jpg" alt="logo" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-tight">Las Tortas de la Barra</p>
            <p className="text-green-200 text-[10px]">en línea · responde al instante</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
          style={{ background: '#ECE5DD' }}
        >
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[82%] rounded-2xl px-3 py-2 text-xs shadow-sm"
                style={m.role === 'bot'
                  ? { background: '#fff', color: '#111', borderTopLeftRadius: 4 }
                  : { background: '#DCF8C6', color: '#111', borderTopRightRadius: 4 }
                }
              >
                <p className="whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*(.*?)\*/g, '<strong>$1</strong>') }}
                />
                <p className="text-[9px] text-right mt-0.5" style={{ color: '#999' }}>
                  {m.role === 'user' ? '✓✓' : ''} 9:{40 + i}
                </p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm flex gap-1 items-center">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${d * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick chips */}
        {!done && (
          <div
            className="px-2 pt-1.5 pb-1 flex gap-1.5 overflow-x-auto"
            style={{ background: '#F0F0F0', borderTop: '1px solid #ddd' }}
          >
            {chips.map((c) => (
              <button
                key={c}
                onClick={() => advance(c)}
                className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 transition-opacity active:opacity-60"
                style={{ background: '#fff', color: '#075E54', border: '1px solid #ccc' }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Confirmed */}
        {done && (
          <div
            className="px-3 pb-2 pt-1 flex items-center gap-2"
            style={{ background: '#F0F0F0', borderTop: '1px solid #ddd' }}
          >
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-[10px] text-green-700 font-semibold">¡Pedido confirmado! 🌮</p>
            <button onClick={() => { setStep(0); setMsgs(DEMO_STEPS[0]); setDone(false); }}
              className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#075E54', color: '#fff' }}>
              Reiniciar
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2 px-2 py-2" style={{ background: '#F0F0F0' }}>
          <div className="flex-1 flex items-center rounded-full px-3 py-1.5 gap-2" style={{ background: '#fff', border: '1px solid #ddd' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe un mensaje..."
              className="flex-1 text-xs outline-none bg-transparent"
              style={{ color: '#111' }}
            />
          </div>
          <button
            onClick={handleSend}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#075E54' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item, onOrder }: { item: MenuItem; onOrder: (item: MenuItem) => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: '#111', border: `1px solid #222` }}
    >
      {/* Photo */}
      <div className="relative w-full h-48 overflow-hidden">
        <Image
          src={item.foto}
          alt={item.nombre}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        {item.badge && (
          <span
            className="absolute top-2.5 left-2.5 text-[11px] font-extrabold px-3 py-1 rounded-full"
            style={{ background: item.badge.bg, color: item.badge.color, letterSpacing: '0.05em' }}
          >
            {item.badge.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold text-base leading-tight" style={{ color: '#fff' }}>
            {item.nombre}
          </h3>
          <span className="font-extrabold text-xl shrink-0 tabular-nums" style={{ color: GOLD }}>
            ${item.precio}
          </span>
        </div>
        <p className="text-xs leading-relaxed flex-1" style={{ color: '#aaa' }}>
          {item.descripcion}
        </p>
        <button
          onClick={() => onOrder(item)}
          className="mt-1 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity active:opacity-70"
          style={{ background: RED, color: '#fff' }}
        >
          <MessageCircle className="w-4 h-4" />
          Ordenar por WhatsApp
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TortasBarraPage() {
  const [phoneFocused, setPhoneFocused] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);

  const handleOrder = (_item: MenuItem) => {
    setPhoneFocused(true);
    setTimeout(() => phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const combos  = MENU.filter((m) => m.categoria === 'combo');
  const tortas  = MENU.filter((m) => m.categoria === 'torta');

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { background: ${BLACK}; margin: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      <div className="min-h-screen" style={{ background: BLACK, color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3" style={{ background: '#000000ee', borderBottom: `1px solid #222`, backdropFilter: 'blur(12px)' }}>
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-yellow-700/40">
            <Image src="/tortas-barra/logo_torteria.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="font-extrabold text-base leading-tight" style={{ color: GOLD }}>Las Tortas de la Barra</h1>
            <p className="text-[11px]" style={{ color: '#888' }}>
              <MapPin className="w-3 h-3 inline mr-0.5" />Los Mochis, Sinaloa
            </p>
          </div>
          <a
            href="https://wa.me/526681875252"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0"
            style={{ background: '#25D366', color: '#fff' }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            668 187 5252
          </a>
        </header>

        {/* ── BANNER ─────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-6 py-14 text-center"
          style={{ background: `linear-gradient(135deg, #1a0000 0%, #000 50%, #1a1000 100%)` }}
        >
          {/* Decorative rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full opacity-10" style={{ border: `2px solid ${GOLD}` }} />
            <div className="absolute w-96 h-96 rounded-full opacity-5" style={{ border: `2px solid ${GOLD}` }} />
          </div>

          <div className="relative">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3 inline-flex items-center gap-1.5" style={{ color: RED }}>
              <MapPin className="w-3.5 h-3.5" />
              Los Mochis, Sinaloa
            </p>
            <h2 className="text-4xl font-extrabold leading-tight mb-2" style={{ color: GOLD }}>
              Las Tortas de la Barra
            </h2>
            <p className="text-lg mb-1" style={{ color: '#fff' }}>
              "Hechas al momento con sabor único"
            </p>
            <p className="text-sm mb-8" style={{ color: '#888' }}>
              Ingredientes frescos · Receta propia · Cada torta es especial
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-sm" style={{ color: '#aaa' }}>
                <Clock className="w-4 h-4" style={{ color: GOLD }} />
                15-20 min de preparación
              </div>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: '#aaa' }}>
                <MapPin className="w-4 h-4" style={{ color: GOLD }} />
                Para llevar · A domicilio
              </div>
            </div>
          </div>
        </section>

        {/* ── MAIN: Menu + Phone ──────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">

            {/* ── Left: Menú ── */}
            <div className="space-y-10">

              {/* Section divider helper */}
              {[
                { label: 'COMBOS', subtitle: 'Torta + Papas fritas + Agua de Jamaica', items: combos },
                { label: 'TORTAS INDIVIDUALES', subtitle: 'Preparadas al momento con ingredientes frescos', items: tortas },
              ].map(({ label, subtitle, items }) => (
                <section key={label} className="fade-up">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1" style={{ background: '#222' }} />
                    <div className="text-center">
                      <p className="font-extrabold text-xs tracking-widest uppercase" style={{ color: GOLD }}>{label}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#666' }}>{subtitle}</p>
                    </div>
                    <div className="h-px flex-1" style={{ background: '#222' }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <ProductCard key={item.id} item={item} onOrder={handleOrder} />
                    ))}
                  </div>
                </section>
              ))}

            </div>

            {/* ── Right: Phone Mockup ── */}
            <div
              ref={phoneRef}
              className="mt-12 lg:mt-0 lg:sticky lg:top-20 flex flex-col items-center gap-6"
            >
              {/* Label */}
              <div className="text-center space-y-1">
                <p className="font-extrabold text-xl" style={{ color: GOLD }}>
                  Tu asistente de pedidos
                </p>
                <p className="text-sm" style={{ color: '#888' }}>
                  Haz clic en las opciones para ver cómo funciona
                </p>
              </div>

              {/* Phone */}
              <div
                className="transition-all duration-300"
                style={phoneFocused ? { transform: 'scale(1.03)', filter: `drop-shadow(0 0 30px ${GOLD}44)` } : {}}
              >
                <PhoneMockup onOrderClick={handleOrder} />
              </div>

              {/* Features bullets */}
              <div
                className="w-full max-w-xs rounded-2xl p-4 space-y-2.5"
                style={{ background: '#111', border: `1px solid #222` }}
              >
                {[
                  'Responde al instante, 24/7',
                  'Conoce todo el menú y los precios',
                  'Arma tu pedido paso a paso',
                  'Confirma con total y tiempo de espera',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${GOLD}22`, color: GOLD }}>
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    <span style={{ color: '#ccc' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer
          className="mt-16 px-4 py-8 text-center border-t"
          style={{ borderColor: '#1a1a1a' }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-yellow-700/30">
              <Image src="/tortas-barra/logo_torteria.jpg" alt="logo" fill className="object-cover" />
            </div>
            <span className="font-extrabold" style={{ color: GOLD }}>Las Tortas de la Barra</span>
          </div>
          <p className="text-xs mb-3" style={{ color: '#555' }}>
            Los Mochis, Sinaloa · "Hechas al momento con sabor único"
          </p>
          <a
            href="https://wa.me/526681875252"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
            style={{ background: '#25D366', color: '#fff' }}
          >
            <MessageCircle className="w-4 h-4" />
            Pedir por WhatsApp: 668 187 5252
          </a>
          <p className="text-[10px] mt-6" style={{ color: '#333' }}>
            Demo powered by{' '}
            <a href="https://agentia.software" target="_blank" rel="noopener noreferrer"
              className="hover:underline" style={{ color: '#444' }}>
              Agentia · agentia.software
            </a>
          </p>
        </footer>

      </div>
    </>
  );
}
