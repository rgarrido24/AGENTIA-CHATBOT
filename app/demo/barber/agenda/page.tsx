'use client';

import dynamic from 'next/dynamic';
import { useBarber } from '../barber-context';

const CalendarDemo = dynamic(() => import('../CalendarDemo'), { ssr: false });

export default function BarberAgendaPage() {
  const { events, paidIds, lastAddedEventId } = useBarber();

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      <p className="text-slate-500 text-sm">
        Misma agenda que en el dashboard: los eventos que agregues desde el chat de prueba aparecen aquí.
      </p>
      <div className="h-[calc(100vh-12rem)] min-h-[420px] rounded-xl border border-white/10 overflow-hidden">
        <CalendarDemo events={events} paidIds={paidIds} lastAddedEventId={lastAddedEventId} />
      </div>
    </div>
  );
}
