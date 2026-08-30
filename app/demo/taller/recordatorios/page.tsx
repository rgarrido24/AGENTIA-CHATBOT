'use client';

import { useMemo, useState } from 'react';
import { Car } from 'lucide-react';
import {
  MOCK_ORDENES,
  MOCK_VEHICULOS,
  getCliente,
  getVehiculo,
  diasHasta,
  diasDesde,
} from '@/lib/mock-data-taller';

const INTERVALO_KM = 10000;

type Tab = 'pendiente' | 'mantenimiento' | 'seguimiento';

function waLink(phone: string, text: string): string {
  const n = phone.replace(/\D/g, '');
  return `https://wa.me/${n.startsWith('52') ? n : `52${n}`}?text=${encodeURIComponent(text)}`;
}

export default function RecordatoriosPage() {
  const [tab, setTab] = useState<Tab>('pendiente');

  const pendientes = useMemo(
    () => MOCK_ORDENES.filter((o) => o.status !== 'entregado'),
    []
  );

  const mantenimiento = useMemo(() => {
    return MOCK_VEHICULOS.filter((v) => {
      const dias = diasHasta(v.proximoServicio);
      const kmRest = v.proximoServicioKm - v.kilometraje;
      return (dias >= 0 && dias <= 15) || (kmRest <= 500 && kmRest >= -2000);
    });
  }, []);

  const seguimiento = useMemo(() => {
    return MOCK_ORDENES.filter((o) => {
      if (o.status !== 'entregado' || !o.fechaEntrega) return false;
      const d = diasDesde(o.fechaEntrega);
      return d >= 5 && d <= 10;
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ['pendiente', 'Servicio pendiente'],
            ['mantenimiento', 'Mantenimiento próximo'],
            ['seguimiento', 'Seguimiento post-servicio'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              tab === id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pendiente' && (
        <ul className="space-y-4">
          {pendientes.map((o) => {
            const c = getCliente(o.clienteId);
            const v = getVehiculo(o.vehiculoId);
            if (!c || !v) return null;
            const msg = `Hola ${c.nombre}, le recordamos que su ${v.marca} ${v.modelo} (${v.placa}) sigue en taller — orden ${o.id}. Estado: ${o.status.replace(/_/g, ' ')}. ¿Alguna duda?`;
            return (
              <li
                key={o.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="flex gap-2 items-center">
                  <Car className="w-5 h-5 text-sky-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {v.marca} {v.modelo} — {o.tipo}
                    </p>
                    <p className="text-sm text-slate-400">{c.nombre}</p>
                  </div>
                </div>
                <a
                  href={waLink(c.telefono, msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium shrink-0"
                >
                  WhatsApp
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'mantenimiento' && (
        <div className="space-y-4">
          <p className="text-slate-500 text-sm">
            Vehículos con servicio en ≤15 días o a ≤500 km del mantenimiento programado (demo).
          </p>
          <ul className="space-y-4">
            {mantenimiento.map((v) => {
              const c = getCliente(v.propietarioId);
              if (!c) return null;
              const msg = `Hola ${c.nombre} 🔧 Su ${v.marca} ${v.modelo} está próximo a su servicio de mantenimiento (cada ${INTERVALO_KM.toLocaleString('es-MX')} km). ¿Lo agendamos esta semana? Cuide su inversión 🚗`;
              return (
                <li
                  key={v.id}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex gap-2 items-center">
                    <Car className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">
                        {v.placa} · {v.marca} {v.modelo}
                      </p>
                      <p className="text-xs text-slate-400">
                        Km: {v.kilometraje.toLocaleString('es-MX')} · Próx. km:{' '}
                        {v.proximoServicioKm.toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={waLink(c.telefono, msg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium shrink-0"
                  >
                    WhatsApp
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === 'seguimiento' && (
        <div className="space-y-4">
          <p className="text-slate-500 text-sm">
            Órdenes entregadas hace ~7 días — mensaje de seguimiento y garantía.
          </p>
          <ul className="space-y-4">
            {seguimiento.length === 0 && (
              <li className="text-slate-500 text-sm">No hay coincidencias en la ventana de 5–10 días (datos demo).</li>
            )}
            {seguimiento.map((o) => {
              const c = getCliente(o.clienteId);
              const v = getVehiculo(o.vehiculoId);
              if (!c || !v) return null;
              const vehLabel = `${v.marca} ${v.modelo}`;
              const msg = `Hola ${c.nombre}, ¿cómo va su ${vehLabel} tras el servicio? Esperamos que todo esté perfecto. Recuerde que tiene garantía de 30 días. ¿Alguna duda? Estamos para servirle 🛠️`;
              return (
                <li
                  key={o.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">Orden {o.id} · {c.nombre}</p>
                    <p className="text-sm text-slate-400">Entrega: {o.fechaEntrega}</p>
                  </div>
                  <a
                    href={waLink(c.telefono, msg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium shrink-0"
                  >
                    WhatsApp
                  </a>
                </li>
              );
            })}
            {MOCK_ORDENES.filter((o) => o.status === 'entregado').length > 0 &&
              seguimiento.length === 0 && (
                <li className="text-slate-500 text-xs border border-white/10 rounded-lg p-3">
                  Tip: en datos demo las fechas de entrega son recientes; el filtro busca entregas de hace 5–10 días.
                </li>
              )}
          </ul>
        </div>
      )}
    </div>
  );
}
