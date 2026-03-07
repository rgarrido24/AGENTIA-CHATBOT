'use client';

import { useState, useEffect } from 'react';

type Message = { from: 'client' | 'bot'; text: string; time?: string };

export default function WhatsAppSimulator({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [slots, setSlots] = useState<{ start: string; end: string; label: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showCalendarAnimation, setShowCalendarAnimation] = useState(false);
  const [step, setStep] = useState(0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  useEffect(() => {
    setMessages([
      { from: 'client', text: 'Hola, ¿tienes espacio mañana en la tarde?', time: '14:32' },
    ]);
    setStep(0);
    setSelectedSlot(null);
    setShowCalendarAnimation(false);
  }, [clientId]);

  useEffect(() => {
    if (step === 0) {
      const t = setTimeout(async () => {
        const res = await fetch(`/api/calendar/availability?clientId=${encodeURIComponent(clientId)}&date=${dateStr}`);
        const data = await res.json();
        const slotList = data.slots ?? [];
        setSlots(slotList);
        const afternoonSlots = slotList.filter((s: { start: string }) => {
          const d = new Date(s.start);
          const h = d.getHours();
          return h >= 12 && h < 20;
        });
        const labels = (afternoonSlots.length ? afternoonSlots : slotList.slice(0, 3)).map((s: { label: string }) => s.label);
        const replyText = labels.length
          ? `Hola, tengo disponibles las ${labels.join(', ')}. ¿Cuál prefieres?`
          : 'Lo siento, no tengo horarios disponibles para mañana en la tarde. ¿Te gustaría otro día?';
        setMessages((prev) => [
          ...prev,
          { from: 'bot', text: replyText, time: '14:33' },
        ]);
        setSlots(afternoonSlots.length ? afternoonSlots : slotList);
        setStep(1);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [step, clientId, dateStr]);

  const handleSelectSlot = (slot: { start: string; end: string; label: string }) => {
    setSelectedSlot(slot.label);
    setMessages((prev) => [
      ...prev,
      { from: 'client', text: `El de las ${slot.label}`, time: '14:34' },
      { from: 'bot', text: `¡Listo! Tu cita quedó confirmada para las ${slot.label}. Te enviaremos un recordatorio 2 horas antes.`, time: '14:34' },
    ]);
    setShowCalendarAnimation(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold title-tracking text-white font-heading">
        Simulador de WhatsApp
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat izquierdo */}
        <div className="card-glass p-4 rounded-2xl overflow-hidden" style={{ maxHeight: '400px' }}>
          <div className="flex items-center gap-3 pb-3 border-b border-forest mb-3">
            <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center text-white text-sm font-bold">
              C
            </div>
            <div>
              <p className="font-medium">Cliente Ficticio</p>
              <p className="text-xs text-slate-400">En línea</p>
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '300px' }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    m.from === 'client'
                      ? 'bg-sage text-inverted rounded-br-md'
                      : 'bg-slate-800/60 text-[#CBD5E1] rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{m.text}</p>
                  {m.time && (
                    <p className={`text-xs mt-1 ${m.from === 'client' ? 'text-white/80' : 'text-slate-400'}`}>
                      {m.time}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {step === 1 && slots.length > 0 && !selectedSlot && (
            <div className="mt-3 pt-3 border-t border-forest">
              <p className="text-xs text-slate-400 mb-2">Selecciona un horario:</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSelectSlot(s)}
                    className="px-3 py-2 rounded-lg text-sm border border-forest hover:border-sage hover:bg-sage/10 transition text-white"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho: IA + MongoDB */}
        <div className="card-glass p-4 rounded-2xl overflow-hidden" style={{ maxHeight: '400px' }}>
          <div className="flex items-center gap-2 pb-3 border-b border-forest mb-3">
            <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <p className="font-medium text-sm">Backend Agentia</p>
          </div>
          <div className="space-y-3 text-sm font-mono text-slate-400">
            <p className="text-xs text-sage">1. Consulta MongoDB</p>
            <p className="pl-2">db.business_settings.findOne(&#123; clientId: &quot;{clientId}&quot; &#125;)</p>
            <p className="text-xs text-sage">2. Verifica horarios configurados</p>
            <p className="pl-2">getSlotsFromSchedule(date, settings)</p>
            <p className="text-xs text-sage">3. Filtra slots ocupados</p>
            <p className="pl-2">getAvailableSlots(clientId, date)</p>
            <p className="text-xs text-sage">4. IA responde con slots libres</p>
            <p className="pl-2 text-white">&quot;Hola, tengo disponibles las 4:00 PM y las 5:30 PM...&quot;</p>
          </div>
        </div>
      </div>

      {/* Animación del calendario */}
      {showCalendarAnimation && selectedSlot && (
        <div
          className="card-glass p-6"
          style={{
            animation: 'fadeInSlide 0.6s ease-out',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="font-semibold">Evento creado en Calendario</p>
              <p className="text-sm text-slate-400">
                Cita confirmada para las {selectedSlot} · Cliente: Cliente Ficticio
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-sage/20 overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all duration-1000"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
