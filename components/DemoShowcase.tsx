'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export type Screen = {
  title: string;
  content: React.ReactNode;
};

export type Demo = {
  id: string;
  emoji: string;
  nombre: string;
  descripcion: string;
  descripcionCorta: string;
  accentColor: string;
  url: string;
  chips: string[];
  screens: Screen[];
};

function demoPath(fullUrl: string): string {
  try {
    return new URL(fullUrl).pathname || '/';
  } catch {
    return '/';
  }
}

const SLIDE_MS = 3000;

function ChatLine({
  side,
  children,
  accent,
}: {
  side: 'left' | 'right';
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`flex ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-lg px-2 py-1 text-[9px] leading-snug ${
          side === 'right' ? 'text-white' : 'border border-white/10 bg-slate-800/90 text-slate-200'
        }`}
        style={side === 'right' ? { backgroundColor: accent ?? '#0d9488' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

function buildDemos(): Demo[] {
  return [
    {
      id: 'barber',
      emoji: '✂️',
      nombre: 'Barbería',
      descripcionCorta: 'Agenda con IA y detección de conflictos de horario.',
      descripcion:
        'Agenda con IA que detecta conflictos de horario en tiempo real y ofrece alternativas automáticas.',
      accentColor: '#0d9488',
      url: 'https://agentia.software/demo/barber',
      chips: ['✂️ Agenda', '⚡ Conflictos', '👥 Clientes', '🔔 Recordatorios'],
      screens: [
        {
          title: 'Dashboard',
          content: (
            <div className="flex h-full flex-col gap-2 p-2 text-[9px] text-slate-200">
              <p className="border-b border-white/10 pb-1 font-semibold text-white">Dashboard · Barbería El Estilo</p>
              <div className="grid grid-cols-4 gap-1">
                {[
                  ['Citas hoy', '8'],
                  ['Próxima', '11:30am'],
                  ['Ingresos', '$1,240'],
                  ['Nuevos', '3'],
                ].map(([l, v]) => (
                  <div key={l} className="rounded border border-teal-500/30 bg-teal-950/40 px-1 py-1">
                    <p className="text-[7px] text-slate-500">{l}</p>
                    <p className="font-bold text-teal-300">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-slate-500">Calendario · Hoy</p>
              <div className="grid grid-cols-3 gap-1">
                <div className="rounded border border-amber-500/40 bg-amber-950/30 p-1 text-[7px]">10:00 Corte · Luis</div>
                <div className="rounded border border-teal-500/40 bg-teal-950/30 p-1 text-[7px]">11:30 Barba · Ana</div>
                <div className="rounded border border-violet-500/40 bg-violet-950/30 p-1 text-[7px]">4:00 VIP · Marco</div>
              </div>
            </div>
          ),
        },
        {
          title: 'Chat con conflicto',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <div className="rounded bg-[#1f2c34] px-2 py-1 text-center text-[8px] text-emerald-400">WhatsApp · Barbería</div>
              <ChatLine side="left">Hola! ¿En qué puedo ayudarte?</ChatLine>
              <ChatLine side="right" accent="#0d9488">
                Quiero cita mañana a las 11am
              </ChatLine>
              <ChatLine side="left">
                ⚠️ Ese horario está ocupado. ¿Te acomoda a las 10am o 12pm?
              </ChatLine>
              <ChatLine side="right" accent="#0d9488">
                A las 10am perfecto
              </ChatLine>
              <ChatLine side="left">✅ ¡Cita confirmada! Mañana a las 10am</ChatLine>
            </div>
          ),
        },
        {
          title: 'Clientes',
          content: (
            <div className="p-2 text-[8px]">
              <p className="mb-1 font-semibold text-white">Clientes</p>
              <div className="overflow-hidden rounded border border-white/10">
                <div className="grid grid-cols-4 gap-px bg-white/10 text-[7px] font-medium text-slate-400">
                  <div className="bg-slate-900 px-1 py-0.5">Nombre</div>
                  <div className="bg-slate-900 px-1 py-0.5">Último</div>
                  <div className="bg-slate-900 px-1 py-0.5">Próxima</div>
                  <div className="bg-slate-900 px-1 py-0.5">Status</div>
                </div>
                {[
                  ['Luis R.', 'Corte', 'Mar 10', 'VIP'],
                  ['Ana M.', 'Barba', 'Jue 4pm', '—'],
                  ['Marco T.', 'Combo', 'Vie 2pm', 'VIP'],
                  ['Sofía L.', 'Tinte', 'Lun 11am', '—'],
                  ['Diego P.', 'Corte', 'Mié 5pm', '—'],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-4 border-t border-white/5 text-[7px] text-slate-300">
                    <div className="px-1 py-0.5">{row[0]}</div>
                    <div className="px-1 py-0.5">{row[1]}</div>
                    <div className="px-1 py-0.5">{row[2]}</div>
                    <div className="px-1 py-0.5">
                      {row[3] === 'VIP' ? (
                        <span className="rounded bg-emerald-500/25 px-1 text-[6px] text-emerald-300">VIP</span>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'restaurante',
      emoji: '🍔',
      nombre: 'Restaurantes',
      descripcionCorta: 'Menú QR, cocina en vivo y delivery con CRM.',
      descripcion:
        'Sistema completo para bar-restaurante: menú QR, panel de cocina, delivery con CRM, inventario y caja con IA.',
      accentColor: '#dc2626',
      url: 'https://agentia.software/demo/restaurante',
      chips: ['📱 Menú QR', '🍳 Cocina', '🛵 Delivery', '🤖 Chat IA'],
      screens: [
        {
          title: 'Panel cocina',
          content: (
            <div className="flex h-full gap-1 p-1 text-[7px]">
              {['Nueva', 'Preparando', 'Lista'].map((col, ci) => (
                <div key={col} className="flex min-w-0 flex-1 flex-col gap-1 rounded border border-white/10 bg-slate-900/80 p-1">
                  <p className="text-center font-semibold text-red-300">{col}</p>
                  {ci === 0 && (
                    <>
                      <div className="rounded border border-amber-500/40 bg-amber-950/40 p-1">#204 Alitas×2 + mojito ⏱ 8m</div>
                      <div className="rounded border border-white/10 bg-black/30 p-1">#205 Burger + papas ⏱ 3m</div>
                    </>
                  )}
                  {ci === 1 && (
                    <div className="rounded border border-orange-500/40 bg-orange-950/40 p-1">#201 Pasta + ensalada ⏱ 12m</div>
                  )}
                  {ci === 2 && (
                    <div className="rounded border border-emerald-500/40 bg-emerald-950/40 p-1">#198 Tacos listos ✓</div>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Menú QR',
          content: (
            <div className="mx-auto flex h-full max-w-[200px] flex-col gap-1 rounded-lg border border-white/10 bg-slate-900 p-2 text-[8px]">
              <p className="text-center font-bold text-white">La Séptima · Menú</p>
              <div className="flex gap-1 rounded border border-white/10 p-1">
                <span className="text-2xl">🍔</span>
                <div>
                  <p className="font-medium">Burger BBQ</p>
                  <p className="text-slate-500">$165</p>
                </div>
              </div>
              <div className="flex gap-1 rounded border border-white/10 p-1">
                <span className="text-2xl">🍹</span>
                <div>
                  <p className="font-medium">Mojito clásico</p>
                  <p className="text-slate-500">$95</p>
                </div>
              </div>
              <button type="button" className="rounded bg-red-600 py-1 text-[8px] text-white">
                Agregar al carrito
              </button>
              <div className="mt-auto rounded border border-red-500/40 bg-red-950/40 px-2 py-1 text-center text-[7px]">
                🛒 2 items · $310
              </div>
            </div>
          ),
        },
        {
          title: 'Delivery CRM',
          content: (
            <div className="p-2 text-[8px]">
              <p className="mb-1 font-semibold text-white">Clientes delivery</p>
              <div className="space-y-1">
                {[
                  ['Carlos M.', '12 días', false],
                  ['Laura P.', '31 días', true],
                  ['Jorge S.', '5 días', false],
                  ['Mónica R.', '31 días', true],
                ].map(([n, d, warn]) => (
                  <div key={String(n)} className="flex items-center justify-between rounded border border-white/10 bg-slate-900/60 px-2 py-1">
                    <span>{n}</span>
                    {warn ? (
                      <span className="rounded bg-red-500/25 px-1 text-[7px] text-red-300">31 días sin pedir</span>
                    ) : (
                      <span className="text-slate-500">{d}</span>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="mt-2 w-full rounded bg-red-600/80 py-1 text-[8px] text-white">
                Enviar promo
              </button>
            </div>
          ),
        },
      ],
    },
    {
      id: 'spa',
      emoji: '💆',
      nombre: 'Spa & Estética',
      descripcionCorta: 'Agenda semanal, VIP y chat en recepción.',
      descripcion:
        'Agenda semanal, clientes VIP, servicios y recordatorios; dashboard con KPIs y chat IA para recepción.',
      accentColor: '#9333ea',
      url: 'https://agentia.software/demo/spa',
      chips: ['📅 Agenda', '💜 KPIs', '✨ Servicios', '🤖 Chat IA'],
      screens: [
        {
          title: 'Agenda semanal',
          content: (
            <div className="p-1 text-[7px]">
              <div className="mb-1 grid grid-cols-5 gap-px text-center font-medium text-slate-400">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((d) => (
                  <div key={d} className="bg-slate-800/80 py-0.5">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {['Carmen', 'Ana', 'Lucía', 'Carmen', 'Ana'].map((esp, i) => (
                  <div key={i} className="min-h-[52px] rounded border border-fuchsia-500/20 bg-slate-900/60 p-0.5">
                    <p className="text-[6px] text-fuchsia-300">{esp}</p>
                    <div className="mt-0.5 rounded bg-violet-500/30 px-0.5 text-[6px]">3pm Masaje</div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: 'Chat cliente',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <div className="rounded bg-[#1f2c34] px-2 py-1 text-center text-[8px] text-fuchsia-400">WhatsApp · Spa</div>
              <ChatLine side="right" accent="#9333ea">
                Masaje el martes 3pm con Carmen
              </ChatLine>
              <ChatLine side="left">Carmen está ocupada 💜 ¿Te acomoda Ana a las 4pm?</ChatLine>
              <ChatLine side="right" accent="#9333ea">
                Sí perfecto
              </ChatLine>
              <ChatLine side="left">✅ Reserva confirmada con Ana Flores</ChatLine>
            </div>
          ),
        },
        {
          title: 'Clientes VIP',
          content: (
            <div className="grid gap-1 p-1 sm:grid-cols-3">
              {[
                ['María L.', 'Facial', '8/10', true],
                ['Paula G.', 'Masaje', '5/10', false],
                ['Rosa T.', 'Depilación', '12/10', true],
              ].map(([n, fav, prog, vip]) => (
                <div key={String(n)} className="rounded border border-white/10 bg-slate-900/70 p-1 text-[7px]">
                  <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500/30 text-sm">
                    👤
                  </div>
                  <p className="font-medium text-white">{n}</p>
                  <p className="text-slate-500">Favorito: {fav}</p>
                  <p className="text-slate-400">Visitas {prog}</p>
                  {vip && (
                    <span className="mt-1 inline-block rounded bg-purple-500/30 px-1 text-[6px] text-purple-200">VIP ⭐</span>
                  )}
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      id: 'grooming',
      emoji: '🐾',
      nombre: 'Grooming Canino',
      descripcionCorta: 'Fichas por mascota, domicilio y recordatorios.',
      descripcion: 'Fichas de mascotas, agenda, servicio a domicilio con seguimiento y recordatorios inteligentes.',
      accentColor: '#f97316',
      url: 'https://agentia.software/demo/grooming',
      chips: ['🐾 Fichas', '📅 Agenda', '🚐 Domicilio', '🤖 Chat IA'],
      screens: [
        {
          title: 'Mascotas',
          content: (
            <div className="grid gap-1 p-1 sm:grid-cols-3">
              {[
                ['🐕', 'Rocky', 'Labrador', 'Mañana', true],
                ['🐩', 'Luna', 'Poodle', '15 Mar', false],
                ['🦮', 'Max', 'Golden', 'Hoy', true],
              ].map(([em, name, breed, due, urgent]) => (
                <div key={String(name)} className="rounded border border-white/10 bg-slate-900/70 p-1 text-[7px]">
                  <div className="text-lg">{em}</div>
                  <p className="font-medium text-white">{name}</p>
                  <p className="text-slate-500">{breed}</p>
                  <p className="text-slate-400">Próximo baño: {due}</p>
                  {urgent && <span className="mt-1 inline-block rounded bg-red-500/30 px-1 text-[6px] text-red-300">Vence hoy</span>}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Chat domicilio',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <ChatLine side="right" accent="#f97316">
                Baño para mi Labrador en Ecatepec
              </ChatLine>
              <ChatLine side="left">Esa zona está fuera de cobertura 🐾</ChatLine>
              <ChatLine side="left">Opciones: 🏪 Sucursal -15% | 🚐 Domicilio +$80</ChatLine>
              <ChatLine side="right" accent="#f97316">
                Domicilio entonces
              </ChatLine>
            </div>
          ),
        },
        {
          title: 'Agenda del día',
          content: (
            <div className="space-y-1 p-2 text-[8px]">
              {[
                ['9:00', 'Rocky', 'Baño completo', 'Ana'],
                ['10:30', 'Luna', 'Corte', 'Luis'],
                ['12:00', 'Max', 'Baño', 'Ana'],
                ['3:00', 'Coco', 'Uñas', 'Luis'],
                ['5:00', 'Bella', 'Spa', 'Ana'],
              ].map(([h, pet, srv, g]) => (
                <div key={String(h)} className="flex items-center justify-between rounded border border-orange-500/20 bg-slate-900/60 px-2 py-1">
                  <span className="text-orange-300">{h}</span>
                  <span>
                    {pet} · {srv}
                  </span>
                  <span className="text-slate-500">{g}</span>
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      id: 'dentista',
      emoji: '🦷',
      nombre: 'Clínica Dental',
      descripcionCorta: 'Expediente, odontograma y recetas PDF.',
      descripcion: 'Expediente clínico con odontograma, recetas PDF, agenda por dentista y cobranza.',
      accentColor: '#0284c7',
      url: 'https://agentia.software/demo/dentista',
      chips: ['🦷 Expediente', '💊 Recetas PDF', '📅 Agenda', '💰 Pagos'],
      screens: [
        {
          title: 'Expediente',
          content: (
            <div className="space-y-1 p-2 text-[8px]">
              <p className="font-bold text-white">María López · 34 años</p>
              <div className="rounded border border-red-500/50 bg-red-950/40 px-2 py-1 text-[7px] text-red-300">
                ⚠️ Alérgica a Penicilina
              </div>
              <p className="text-slate-500">Historial</p>
              <div className="space-y-1 border-l-2 border-sky-500/50 pl-2">
                <p>12 Feb · Limpieza · Dr. Ruiz</p>
                <p>03 Ene · Extracción · Dra. Mora</p>
              </div>
            </div>
          ),
        },
        {
          title: 'Alerta de alergia',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <div className="rounded bg-slate-800 px-2 py-1 text-[8px] text-slate-300">Staff: receta rápida</div>
              <ChatLine side="right" accent="#0284c7">
                Receto Amoxicilina a María López
              </ChatLine>
              <ChatLine side="left">🚨 ALERTA: María López alérgica a Penicilina</ChatLine>
              <ChatLine side="left">Alternativas: Azitromicina / Clindamicina</ChatLine>
            </div>
          ),
        },
        {
          title: 'Receta PDF',
          content: (
            <div className="relative mx-auto max-w-[180px] rounded border border-white/15 bg-white p-2 text-[7px] text-slate-800">
              <p className="text-center font-bold">Sonrisa Perfecta</p>
              <p className="mt-1">Paciente: María López</p>
              <p>Rx: Azitromicina 500mg — 5 días</p>
              <div className="mt-2 flex justify-end">
                <div className="h-10 w-10 rounded border border-slate-300 bg-slate-100" />
              </div>
              <p className="mt-1 text-[6px] text-slate-500">QR verificación</p>
            </div>
          ),
        },
      ],
    },
    {
      id: 'medico',
      emoji: '👨‍⚕️',
      nombre: 'Médico & Especialistas',
      descripcionCorta: 'Expediente digital, agenda y recetas con QR.',
      descripcion:
        'Expediente clínico digital, agenda por especialidad, recetas con QR verificable, signos vitales y recordatorios automáticos.',
      accentColor: '#16a34a',
      url: 'https://agentia.software/demo/medico',
      chips: ['📋 Expediente', '📈 Signos vitales', '💊 Recetas+Incapacidad', '🤖 IA'],
      screens: [
        {
          title: 'Dashboard',
          content: (
            <div className="flex h-full gap-1 p-1 text-[7px]">
              {[
                ['Dr. Ruiz', ['9 Gine', '11 Cardio']],
                ['Dra. Mora', ['10 Ped', '3pm Gine']],
                ['Dr. Castillo', ['8 Trauma', '2pm Post']],
              ].map(([name, citas]) => (
                <div key={String(name)} className="flex min-w-0 flex-1 flex-col gap-1 rounded border border-emerald-500/25 bg-slate-900/70 p-1">
                  <p className="text-center font-semibold text-emerald-300">{name}</p>
                  {(citas as string[]).map((c) => (
                    <div key={c} className="rounded bg-emerald-950/50 px-1 py-0.5">
                      {c}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Lista de espera',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <ChatLine side="right" accent="#16a34a">
                Cita urgente con ginecología
              </ChatLine>
              <ChatLine side="left">Dra. Mora llena 3 semanas 📋</ChatLine>
              <ChatLine side="left">¿Lista de espera? · Consulta general hoy · Cita en 21 días</ChatLine>
            </div>
          ),
        },
        {
          title: 'Signos vitales',
          content: (
            <div className="p-2 text-[8px]">
              <p className="mb-1 font-semibold text-white">Peso · últimas consultas</p>
              <div className="flex h-16 items-end justify-between gap-0.5 border-b border-white/10 pb-1">
                {[78, 76, 74, 72, 70].map((w, i) => (
                  <div key={w} className="flex flex-1 flex-col items-center gap-0.5">
                    <div
                      className="w-full rounded-t bg-emerald-500/70"
                      style={{ height: `${(w / 78) * 48}px` }}
                    />
                    <span className="text-[6px] text-slate-500">{w}</span>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-emerald-400">Tendencia: ↓ -8kg en 5 consultas</p>
            </div>
          ),
        },
      ],
    },
    {
      id: 'taller',
      emoji: '🔧',
      nombre: 'Taller Mecánico',
      descripcionCorta: 'Órdenes, PDF, inventario y recordatorios.',
      descripcion:
        'Órdenes tipo taller, historial por vehículo, presupuestos PDF, inventario de refacciones, caja y recordatorios de mantenimiento con IA.',
      accentColor: '#475569',
      url: 'https://agentia.software/demo/taller',
      chips: ['🔧 Órdenes', '📄 Presupuesto PDF', '🔔 Recordatorios', '🤖 IA'],
      screens: [
        {
          title: 'Kanban órdenes',
          content: (
            <div className="flex h-full gap-0.5 overflow-x-auto p-1 text-[6px]">
              {['Recibido', 'Diagnóstico', 'Reparación', 'Listo'].map((col) => (
                <div key={col} className="flex min-w-[56px] flex-1 flex-col gap-0.5 rounded border border-white/10 bg-slate-900/80 p-0.5">
                  <p className="text-center text-[7px] font-semibold text-slate-300">{col}</p>
                  {col === 'Recibido' && (
                    <div className="rounded border border-slate-600 bg-slate-800 p-0.5">Honda Civic ABC-123 · Juan</div>
                  )}
                  {col === 'Diagnóstico' && (
                    <div className="rounded border border-amber-500/40 bg-amber-950/40 p-0.5">Nissan · KLM-456 · Tec. Ana</div>
                  )}
                  {col === 'Reparación' && (
                    <div className="rounded border border-blue-500/40 bg-blue-950/40 p-0.5">VW · PQR-789 · Frenos</div>
                  )}
                  {col === 'Listo' && (
                    <div className="rounded border border-emerald-500/40 bg-emerald-950/40 p-0.5">Honda Civic ✓</div>
                  )}
                </div>
              ))}
            </div>
          ),
        },
        {
          title: 'Chat status',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <ChatLine side="right" accent="#475569">
                ¿Ya está mi Honda Civic ABC-123?
              </ChatLine>
              <ChatLine side="left">✅ Listo para recoger</ChatLine>
              <ChatLine side="left">⚠️ Encontramos frenos al 15%. ¿Los incluimos? +$850</ChatLine>
              <ChatLine side="right" accent="#475569">
                Sí, inclúyelos
              </ChatLine>
            </div>
          ),
        },
        {
          title: 'Presupuesto PDF',
          content: (
            <div className="mx-auto max-w-[200px] rounded border border-white/15 bg-slate-100 p-2 text-[8px] text-slate-800">
              <p className="font-bold">AutoPro · Presupuesto</p>
              <table className="mt-1 w-full text-[7px]">
                <tbody>
                  <tr>
                    <td>Cambio aceite</td>
                    <td className="text-right">$450</td>
                  </tr>
                  <tr>
                    <td>Frenos</td>
                    <td className="text-right">$850</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-1 font-bold text-red-700">Total: $1,300 MXN</p>
              <button type="button" className="mt-1 w-full rounded bg-slate-800 py-1 text-[7px] text-white">
                Descargar PDF
              </button>
            </div>
          ),
        },
      ],
    },
    {
      id: 'nutricion',
      emoji: '🥗',
      nombre: 'Nutrición & Bienestar',
      descripcionCorta: 'Tablero InBody, IA dietética y motivación.',
      descripcion:
        'Seguimiento nutricional con IA. Tablero de progreso, OCR de báscula InBody, recordatorios motivacionales y asistente que conoce la dieta de cada paciente.',
      accentColor: '#16a34a',
      url: 'https://agentia.software/demo/nutricion',
      chips: ['📊 Tablero', '🤖 IA Dietética', '📷 OCR InBody', '💬 WhatsApp'],
      screens: [
        {
          title: 'Tablero de progreso',
          content: (
            <div className="space-y-1 p-2 text-[8px]">
              <p className="font-semibold text-white">Inicio vs Hoy</p>
              <div className="rounded border border-white/10 bg-slate-900/60 p-2">
                <p>
                  Peso: <span className="text-slate-500">78kg</span> → <span className="text-emerald-400">71.5kg (-6.5kg)</span>
                </p>
                <p>
                  Grasa: <span className="text-slate-500">38%</span> → <span className="text-emerald-400">33%</span>
                </p>
                <p>
                  Músculo: <span className="text-slate-500">34kg</span> → <span className="text-emerald-400">36kg</span>
                </p>
              </div>
            </div>
          ),
        },
        {
          title: 'Chat dieta',
          content: (
            <div className="flex h-full flex-col gap-1 bg-[#0b141a] p-2">
              <ChatLine side="right" accent="#16a34a">
                ¿Puedo comer pizza hoy?
              </ChatLine>
              <ChatLine side="left">🚫 La pizza no está en tu plan</ChatLine>
              <ChatLine side="left">¿Te sugiero 3 alternativas que sí puedes comer?</ChatLine>
              <ChatLine side="right" accent="#16a34a">
                Sí por favor
              </ChatLine>
              <ChatLine side="left">✅ Opción 1: Tostadas integrales con jitomate...</ChatLine>
            </div>
          ),
        },
        {
          title: 'Bot motivacional',
          content: (
            <div className="mx-auto flex h-full max-w-[210px] flex-col rounded-lg border border-emerald-500/30 bg-[#0b141a] p-2 text-[8px]">
              <p className="text-center text-[7px] text-slate-500">WhatsApp · Sáb 11:00 AM automático</p>
              <div className="mt-2 rounded bg-[#1f2c34] p-2 text-slate-200">
                ¡Hola María! 💚 Los resultados del lunes se construyen hoy. Llevas -6.5kg ¡Tú puedes! 🌟
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'cobranza',
      emoji: '📊',
      nombre: 'Cobranza & Cartera',
      descripcionCorta: 'Morosidad, secuencias y estado de cuenta PDF.',
      descripcion:
        'Dashboard de morosidad, secuencias automáticas, estado de cuenta PDF y score de riesgo con IA para instituciones y empresas.',
      accentColor: '#1e40af',
      url: 'https://agentia.software/demo/cobranza',
      chips: ['📊 Score IA', '🧾 PDF', '🤖 Secuencias', '💬 WhatsApp'],
      screens: [
        {
          title: 'Dashboard',
          content: (
            <div className="space-y-1 p-2 text-[8px]">
              <p className="font-bold text-white">Cartera total: $284,500</p>
              <div className="flex gap-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300">Al corriente 52%</span>
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-300">Adeudo 31%</span>
              </div>
              <p className="text-[7px] text-slate-500">Ciclos</p>
              <div className="flex gap-1">
                {['C1', 'C2', 'C3', 'C4'].map((c) => (
                  <span key={c} className="rounded border border-blue-500/40 bg-blue-950/50 px-2 py-0.5 text-[7px]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: 'Score de riesgo',
          content: (
            <div className="space-y-1 p-2 text-[8px]">
              <p className="font-bold text-red-400">Score: 23/100 🔴 CRÍTICO</p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[23%] bg-red-500" />
              </div>
              <p className="text-[7px] text-slate-400">Factores: Ciclo 4 (-30pts) | Sin pago (-25pts)</p>
              <div className="rounded border border-blue-500/40 bg-blue-950/40 p-2 text-[7px] text-blue-200">
                Recomendación IA: priorizar llamada + plan de 3 pagos
              </div>
            </div>
          ),
        },
        {
          title: 'Estado de cuenta PDF',
          content: (
            <div className="relative mx-auto max-w-[200px] rounded border border-white/15 bg-white p-2 text-[7px] text-slate-800">
              <p className="text-center font-bold">Instituto Meridian</p>
              <table className="mt-1 w-full">
                <tbody>
                  <tr>
                    <td>Colegiatura ×2</td>
                    <td className="text-right">$6,800</td>
                  </tr>
                  <tr>
                    <td>Recargo 5%</td>
                    <td className="text-right">$340</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-1 font-bold text-red-600">Total: $7,140 MXN</p>
              <div className="absolute bottom-1 right-1 h-8 w-8 rounded border border-slate-300 bg-slate-100" />
            </div>
          ),
        },
      ],
    },
  ];
}

const DEMOS = buildDemos();

export function DemoShowcase() {
  const [activeId, setActiveId] = useState(DEMOS[0]!.id);
  const [screenIndex, setScreenIndex] = useState(0);
  const [typedUrl, setTypedUrl] = useState('');

  const active = useMemo(() => DEMOS.find((d) => d.id === activeId) ?? DEMOS[0]!, [activeId]);
  const screens = active.screens;

  const runUrlType = useCallback((full: string) => {
    setTypedUrl('');
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTypedUrl(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setScreenIndex(0);
    const clean = runUrlType(active.url);
    return clean;
  }, [activeId, active.url, runUrlType]);

  useEffect(() => {
    const t = window.setInterval(() => {
      setScreenIndex((i) => (i + 1) % screens.length);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [activeId, screens.length]);

  const goDot = (i: number) => setScreenIndex(i);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Mobile: chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {DEMOS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveId(d.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-left text-xs transition ${
                activeId === d.id
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/10 bg-white/5 text-slate-500'
              }`}
              style={
                activeId === d.id
                  ? { borderColor: `${d.accentColor}88`, boxShadow: `0 0 0 1px ${d.accentColor}33` }
                  : undefined
              }
            >
              <span className="mr-1">{d.emoji}</span>
              {d.nombre}
            </button>
          ))}
        </div>

        {/* Desktop list */}
        <div className="hidden w-full shrink-0 lg:block lg:w-[40%]">
          <div className="flex flex-col gap-2">
            {DEMOS.map((d) => {
              const on = activeId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setActiveId(d.id)}
                  onMouseEnter={() => setActiveId(d.id)}
                  className={`relative rounded-xl border px-4 py-3 text-left transition ${
                    on ? 'border-white/15 bg-white/[0.06]' : 'border-transparent bg-transparent hover:bg-white/[0.03]'
                  }`}
                  style={
                    on
                      ? {
                          borderColor: `${d.accentColor}55`,
                          boxShadow: `inset 4px 0 0 ${d.accentColor}`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${on ? 'text-white' : 'text-slate-500'}`}>
                      <span className="mr-1.5">{d.emoji}</span>
                      {d.nombre}
                    </span>
                  </div>
                  <p className={`mt-1 text-xs ${on ? 'text-slate-300' : 'text-slate-600 line-clamp-1'}`}>
                    {on ? d.descripcion : d.descripcionCorta}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {d.chips.map((c) => (
                      <span
                        key={c}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          on ? 'border border-white/15 bg-black/20 text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {on && (
                    <>
                      <p className="mt-2 text-xs text-slate-500">
                        Desde <span className="font-medium text-slate-300">$399 MXN/mes</span>
                        <span className="text-slate-600">*</span>
                      </p>
                      <Link
                        href={demoPath(d.url)}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
                        style={{ color: d.accentColor }}
                      >
                        Ver demo completa <ArrowRight className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mockup */}
        <div className="w-full lg:w-[60%]">
          <motion.div
            key={activeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/90 px-3 py-2">
              <div className="flex gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="min-w-0 flex-1 truncate rounded-md border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px] text-slate-400">
                {typedUrl || '…'}
              </div>
            </div>

            <div className="relative min-h-[280px] bg-gradient-to-b from-slate-900 to-slate-950 sm:min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeId}-${screenIndex}`}
                  initial={{ x: 48, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -48, opacity: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="absolute inset-0 overflow-y-auto p-2"
                >
                  <p className="mb-2 text-[10px] font-medium text-slate-500">{screens[screenIndex]?.title}</p>
                  <div className="min-h-[240px] text-slate-200">{screens[screenIndex]?.content}</div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-2 border-t border-white/10 py-3">
              {screens.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Pantalla ${i + 1}`}
                  onClick={() => goDot(i)}
                  className={`h-2 w-2 rounded-full transition ${
                    i === screenIndex ? 'scale-125 bg-white' : 'bg-slate-600 hover:bg-slate-400'
                  }`}
                  style={i === screenIndex ? { backgroundColor: active.accentColor } : undefined}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile: bottom CTA for active */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 lg:hidden">
        <p className="text-xs text-slate-400">{active.descripcion}</p>
        <p className="mt-2 text-xs text-slate-500">
          Desde <span className="font-medium text-slate-300">$399 MXN/mes</span>
          <span className="text-slate-600">*</span>
        </p>
        <Link
          href={demoPath(active.url)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: active.accentColor }}
        >
          Ver demo completa <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
