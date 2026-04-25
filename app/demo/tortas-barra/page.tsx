'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Send, Trash2, ChevronDown, ChevronUp,
  MapPin, Package, CheckCircle, X, Bot
} from 'lucide-react';

// ─── Brand ────────────────────────────────────────────────────────────────────

const RED    = '#8B0000';
const GOLD   = '#D4AF37';
const BG     = '#1a0a00';
const CARD   = '#2a1200';
const BORDER = '#3d1f00';
const MUTED  = '#9a7a5a';

// ─── Menú ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id:          string;
  categoria:   'combo' | 'torta';
  nombre:      string;
  precio:      number;
  descripcion: string;
  tags:        string[];
}

const MENU: MenuItem[] = [
  {
    id: 'combo-sinaloense',
    categoria: 'combo',
    nombre: 'Combo Sinaloense Premium',
    precio: 100,
    descripcion: 'Torta Sinaloense Premium + papas fritas + agua de jamaica 500ml.',
    tags: ['combo', 'jamón'],
  },
  {
    id: 'combo-vegetariano',
    categoria: 'combo',
    nombre: 'Combo Vegetariano Premium',
    precio: 120,
    descripcion: 'Torta Vegetariana Premium + papas fritas + agua de jamaica 500ml.',
    tags: ['combo', 'vegetariano'],
  },
  {
    id: 'combo-suprema',
    categoria: 'combo',
    nombre: 'Combo Torta Suprema',
    precio: 120,
    descripcion: 'Torta Suprema de Pierna Adobada + papas fritas + agua de jamaica 500ml.',
    tags: ['combo', 'pierna'],
  },
  {
    id: 'torta-sinaloense',
    categoria: 'torta',
    nombre: 'Torta Sinaloense Premium',
    precio: 50,
    descripcion: 'Láminas de jamón con queso manchego, piña tatemada, cebolla caramelizada, lechuga y tomate. Coronada con chile jalapeño curtido, aguacate fresco y aderezo de la casa.',
    tags: ['jamón', 'económica'],
  },
  {
    id: 'torta-vegetariana',
    categoria: 'torta',
    nombre: 'Torta Vegetariana Premium',
    precio: 70,
    descripcion: 'Champiñones salteados en chile morrón con queso manchego, piña tatemada y cebolla caramelizada, lechuga y tomate. Coronada con chile jalapeño curtido, aguacate fresco y aderezo de la casa.',
    tags: ['vegetariano', 'champiñón'],
  },
  {
    id: 'torta-suprema',
    categoria: 'torta',
    nombre: 'Torta Suprema de Pierna Adobada',
    precio: 70,
    descripcion: 'Jugosa pierna de cerdo marinada en mezcla casera de chiles secos, cítricos y especias, queso manchego, piña tatemada, cebolla caramelizada, lechuga y tomate. Coronada con chile jalapeño curtido, aguacate fresco y aderezo de la casa.',
    tags: ['pierna', 'adobada'],
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface OrderItem { id: string; nombre: string; precio: number; qty: number }
type Modalidad = 'llevar' | 'domicilio';
type Msg = { role: 'user' | 'assistant'; content: string }
type View = 'menu' | 'chat' | 'pedido';

// ─── Utils ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX')}`;
}

// ─── Card de producto ─────────────────────────────────────────────────────────

function MenuCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  const [exp, setExp] = useState(false);
  const isCombo = item.categoria === 'combo';

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: CARD, border: `1px solid ${BORDER}` }}
    >
      {/* Placeholder imagen */}
      <div
        className="w-full h-36 flex flex-col items-center justify-center gap-1 text-4xl relative"
        style={{ background: `linear-gradient(135deg, ${RED}44, ${GOLD}22)` }}
      >
        <span>{isCombo ? '🌮🍟' : '🌮'}</span>
        {isCombo && (
          <span
            className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: GOLD, color: '#1a0a00' }}
          >
            COMBO
          </span>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm leading-tight" style={{ color: '#f5e6d0' }}>{item.nombre}</h3>
          <span className="font-extrabold text-base shrink-0 tabular-nums" style={{ color: GOLD }}>
            {fmt(item.precio)}
          </span>
        </div>

        <button
          onClick={() => setExp((p) => !p)}
          className="flex items-center gap-1 text-xs"
          style={{ color: MUTED }}
        >
          {exp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {exp ? 'Ocultar' : 'Ver ingredientes'}
        </button>

        {exp && (
          <p className="text-xs leading-relaxed" style={{ color: '#c9a87c' }}>
            {item.descripcion}
          </p>
        )}

        <button
          onClick={() => onAdd(item)}
          className="w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-opacity active:opacity-70"
          style={{ background: RED, color: '#fff' }}
        >
          <ShoppingCart className="w-4 h-4" />
          Agregar al pedido
        </button>
      </div>
    </div>
  );
}

// ─── Burbuja de chat ──────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-2`}>
      {isBot && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
          style={{ background: RED }}
        >
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
        style={isBot
          ? { background: CARD, color: '#f5e6d0', border: `1px solid ${BORDER}` }
          : { background: RED, color: '#fff' }
        }
      >
        {msg.content}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const GREETING: Msg = {
  role: 'assistant',
  content: '¡Bienvenido a Las Tortas de la Barra! 🌮\nHacemos cada torta al momento con ingredientes frescos.\n¿Qué se te antoja hoy?',
};

export default function TortasBarraPage() {
  const [view, setView]           = useState<View>('menu');
  const [order, setOrder]         = useState<OrderItem[]>([]);
  const [modalidad, setModalidad] = useState<Modalidad>('llevar');
  const [msgs, setMsgs]           = useState<Msg[]>([GREETING]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [paid, setPaid]           = useState(false);
  const [cartBump, setCartBump]   = useState(false);
  const chatEndRef                = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  const total = order.reduce((s, i) => s + i.precio * i.qty, 0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, streaming]);

  const addToOrder = useCallback((item: MenuItem) => {
    setOrder((prev) => {
      const ex = prev.find((o) => o.id === item.id);
      if (ex) return prev.map((o) => o.id === item.id ? { ...o, qty: o.qty + 1 } : o);
      return [...prev, { id: item.id, nombre: item.nombre, precio: item.precio, qty: 1 }];
    });
    setCartBump(true);
    setTimeout(() => setCartBump(false), 400);
  }, []);

  const removeFromOrder = (id: string) => {
    setOrder((prev) => prev.flatMap((o) => {
      if (o.id !== id) return [o];
      if (o.qty > 1)  return [{ ...o, qty: o.qty - 1 }];
      return [];
    }));
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch('/api/demo/tortas-barra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      setMsgs((p) => [...p, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // parse AI SDK data stream format: lines starting with '0:"...'
        for (const line of chunk.split('\n')) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2));
              full += text;
              setMsgs((p) => {
                const updated = [...p];
                updated[updated.length - 1] = { role: 'assistant', content: full };
                return updated;
              });
            } catch { /* skip malformed */ }
          }
        }
      }
    } catch {
      setMsgs((p) => [...p, { role: 'assistant', content: '¡Ups! Algo salió mal. Intenta de nuevo 🙈' }]);
    } finally {
      setStreaming(false);
    }
  }, [msgs, streaming]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const QUICK = ['¿Qué tienen de menú?', '¿Cuál recomiendan?', 'Quiero una vegetariana', 'Hacer mi pedido'];

  const NavBtn = ({ v, label, badge }: { v: View; label: string; badge?: number }) => (
    <button
      onClick={() => setView(v)}
      className="flex-1 py-2.5 text-sm font-bold relative transition-colors"
      style={{
        color: view === v ? GOLD : MUTED,
        borderBottom: view === v ? `2px solid ${GOLD}` : '2px solid transparent',
      }}
    >
      {label}
      {badge != null && badge > 0 && (
        <span
          className="absolute -top-0.5 right-3 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: RED, color: '#fff', animation: cartBump && v === 'pedido' ? 'bump 0.4s ease' : undefined }}
        >
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <>
      <style>{`
        body { background: ${BG}; }
        @keyframes bump { 0%{transform:scale(1.4)} 100%{transform:scale(1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .msg-in { animation: fadeIn 0.25s ease; }
      `}</style>

      <div className="min-h-screen flex flex-col" style={{ background: BG, maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <header
          className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
          style={{ background: `${BG}f0`, borderBottom: `1px solid ${BORDER}`, backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `linear-gradient(135deg, ${RED}, #5c0000)`, boxShadow: `0 4px 12px ${RED}66` }}
          >
            🌮
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight" style={{ color: GOLD }}>
              Las Tortas de la Barra
            </h1>
            <p className="text-[11px]" style={{ color: MUTED }}>
              <MapPin className="w-3 h-3 inline mr-0.5" />Los Mochis, Sinaloa · Hecho al momento
            </p>
          </div>
          <div
            className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55` }}
          >
            DEMO IA
          </div>
        </header>

        {/* Tab nav */}
        <div className="flex" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
          <NavBtn v="menu"   label="🌮 Menú" />
          <NavBtn v="chat"   label="💬 TortaBot" />
          <NavBtn v="pedido" label="🛒 Pedido" badge={order.reduce((s, i) => s + i.qty, 0)} />
        </div>

        {/* ── MENÚ ── */}
        {view === 'menu' && (
          <div className="flex-1 p-4 pb-6 overflow-y-auto space-y-5">

            {/* Banner */}
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: `linear-gradient(135deg, ${RED}33, ${GOLD}11)`, border: `1px solid ${RED}55` }}
            >
              <p className="font-bold text-base" style={{ color: GOLD }}>Ingredientes frescos · Hecho al momento</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>Los Mochis, Sinaloa</p>
            </div>

            {/* Combos */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px" style={{ background: BORDER }} />
                <p className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${GOLD}22`, color: GOLD }}>
                  🔥 COMBOS
                </p>
                <div className="flex-1 h-px" style={{ background: BORDER }} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {MENU.filter((m) => m.categoria === 'combo').map((item) => (
                  <MenuCard key={item.id} item={item} onAdd={addToOrder} />
                ))}
              </div>
            </section>

            {/* Tortas */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px" style={{ background: BORDER }} />
                <p className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${RED}33`, color: '#f5a0a0' }}>
                  🌮 TORTAS
                </p>
                <div className="flex-1 h-px" style={{ background: BORDER }} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                {MENU.filter((m) => m.categoria === 'torta').map((item) => (
                  <MenuCard key={item.id} item={item} onAdd={addToOrder} />
                ))}
              </div>
            </section>

          </div>
        )}

        {/* ── CHAT ── */}
        {view === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0" style={{ height: 'calc(100vh - 130px)' }}>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {msgs.map((m, i) => (
                <div key={i} className="msg-in"><Bubble msg={m} /></div>
              ))}
              {streaming && msgs[msgs.length - 1]?.role !== 'assistant' && (
                <div className="flex justify-start mb-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2" style={{ background: RED }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: GOLD, animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: GOLD, animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: GOLD, animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick replies */}
            {msgs.length <= 2 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {QUICK.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)}
                    className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-medium shrink-0"
                    style={{ background: `${RED}33`, color: '#f5a0a0', border: `1px solid ${RED}55` }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t flex gap-2 items-end" style={{ borderColor: BORDER, background: `${BG}f0` }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="¿Qué se te antoja hoy?"
                rows={1}
                className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: CARD, color: '#f5e6d0', border: `1px solid ${BORDER}`, maxHeight: 96 }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-opacity"
                style={{ background: input.trim() ? RED : BORDER, opacity: input.trim() && !streaming ? 1 : 0.5 }}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* ── PEDIDO ── */}
        {view === 'pedido' && (
          <div className="flex-1 p-4 pb-6 space-y-4 overflow-y-auto">

            {paid ? (
              /* Confirmación de pago */
              <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: '#16a34a22', border: '3px solid #16a34a' }}
                >
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-extrabold" style={{ color: GOLD }}>¡Pedido confirmado!</p>
                  <p className="text-sm mt-1" style={{ color: MUTED }}>
                    Tu pedido de {fmt(total)} está siendo preparado con mucho amor 🌮
                  </p>
                  <p className="text-xs mt-2" style={{ color: MUTED }}>
                    Modalidad: {modalidad === 'llevar' ? '📦 Para llevar' : '🛵 A domicilio'}
                  </p>
                </div>
                <button
                  onClick={() => { setPaid(false); setOrder([]); setView('menu'); }}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: RED, color: '#fff' }}
                >
                  Nuevo pedido
                </button>
              </div>
            ) : order.length === 0 ? (
              /* Carrito vacío */
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <span className="text-5xl opacity-30">🛒</span>
                <p className="text-base font-semibold" style={{ color: MUTED }}>Tu carrito está vacío</p>
                <button onClick={() => setView('menu')}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: RED, color: '#fff' }}>
                  Ver menú
                </button>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
                    <p className="font-bold text-sm" style={{ color: GOLD }}>Tu pedido</p>
                    <button onClick={() => setOrder([])} className="text-xs" style={{ color: MUTED }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {order.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0" style={{ borderColor: BORDER }}>
                      <span className="text-xl">🌮</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#f5e6d0' }}>{item.nombre}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{fmt(item.precio)} c/u</p>
                      </div>
                      {/* Qty controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromOrder(item.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-base"
                          style={{ background: `${RED}44`, color: '#f5a0a0' }}
                        >−</button>
                        <span className="w-5 text-center font-bold text-sm" style={{ color: GOLD }}>{item.qty}</span>
                        <button
                          onClick={() => addToOrder(MENU.find((m) => m.id === item.id)!)}
                          className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-base"
                          style={{ background: `${RED}44`, color: '#f5a0a0' }}
                        >+</button>
                      </div>
                      <p className="font-bold text-sm tabular-nums shrink-0 ml-1" style={{ color: GOLD }}>
                        {fmt(item.precio * item.qty)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Modalidad */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <p className="text-sm font-bold" style={{ color: GOLD }}>¿Cómo quieres tu pedido?</p>
                  <div className="flex gap-3">
                    {([
                      { key: 'llevar',   icon: Package,  label: 'Para llevar'  },
                      { key: 'domicilio', icon: MapPin,   label: 'A domicilio'  },
                    ] as { key: Modalidad; icon: React.ElementType; label: string }[]).map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setModalidad(key)}
                        className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold border transition-colors"
                        style={modalidad === key
                          ? { background: `${RED}33`, color: GOLD, border: `1px solid ${RED}` }
                          : { background: 'transparent', color: MUTED, border: `1px solid ${BORDER}` }
                        }
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total + pagar */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold" style={{ color: MUTED }}>Subtotal</p>
                    <p className="font-bold" style={{ color: '#f5e6d0' }}>{fmt(total)}</p>
                  </div>
                  {modalidad === 'domicilio' && (
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold" style={{ color: MUTED }}>Envío estimado</p>
                      <p className="text-sm" style={{ color: MUTED }}>Por confirmar</p>
                    </div>
                  )}
                  <div className="h-px" style={{ background: BORDER }} />
                  <div className="flex justify-between items-center">
                    <p className="font-bold" style={{ color: GOLD }}>Total</p>
                    <p className="text-xl font-extrabold tabular-nums" style={{ color: GOLD }}>{fmt(total)}</p>
                  </div>

                  <button
                    onClick={() => setPaid(true)}
                    className="w-full py-4 rounded-2xl text-base font-extrabold flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${RED}, #5c0000)`,
                      color: GOLD,
                      boxShadow: `0 8px 24px ${RED}66`,
                    }}
                  >
                    💳 Pagar {fmt(total)}
                  </button>
                  <p className="text-center text-xs" style={{ color: MUTED }}>
                    Pago simulado — demo de TortaBot IA
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </>
  );
}
