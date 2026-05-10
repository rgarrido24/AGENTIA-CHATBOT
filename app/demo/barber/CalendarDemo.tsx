'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import styles from './demo-barber.module.css';
import type { EventContentArg } from '@fullcalendar/core';
import type { DemoBusinessConfig } from '@/src/lib/demo-config';
import type { CitaData } from './barber-chat-types';

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: { tipoNegocio?: string; statusPago?: string; citaId?: string };
};

function hexToRgba(hex: string, alpha: number): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CalendarDemo({
  events,
  paidIds,
  lastAddedEventId,
  config: _config,
  onEventAdded: _onEventAdded,
  light = false,
}: {
  events: CalendarEvent[];
  paidIds: Set<string>;
  lastAddedEventId?: string | null;
  config?: DemoBusinessConfig;
  onEventAdded?: (c: CitaData) => void;
  /** Aplica tema claro (para Nail Studio). */
  light?: boolean;
}) {
  void _config;
  void _onEventAdded;
  return (
    <div className={`${styles.calendarWrap}${light ? ' ' + styles.light : ''}`}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale="es"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        events={events.map((ev) => {
          const isPaid = paidIds.has(ev.id);
          const bg = ev.backgroundColor || '#64748b';
          const border = ev.borderColor || bg;
          return {
            ...ev,
            backgroundColor: isPaid ? '#16a34a' : hexToRgba(bg, 0.85),
            borderColor: isPaid ? '#22c55e' : border,
            classNames: isPaid ? ['paid'] : [],
          };
        })}
        eventContent={(arg: EventContentArg) => {
          const isPaid = paidIds.has(arg.event.id);
          const isNew = lastAddedEventId === arg.event.id;
          const bg = arg.event.backgroundColor;
          const border = arg.event.borderColor;
          const content = (
            <div
              className={isNew ? styles.eventGlow : ''}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: isPaid ? '#16a34a' : bg,
                border: `2px solid ${isPaid ? '#22c55e' : border}`,
                boxShadow: isPaid
                  ? '0 0 12px rgba(34, 197, 94, 0.5)'
                  : (border && border.startsWith('#')
                      ? `0 0 10px ${hexToRgba(border, 0.45)}`
                      : '0 0 10px rgba(255,255,255,0.2)'),
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {arg.event.title} {isPaid ? '✓ PAGADO' : ''}
            </div>
          );
          if (isNew) {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {content}
              </motion.div>
            );
          }
          return content;
        }}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        height="100%"
        nowIndicator
      />
    </div>
  );
}
