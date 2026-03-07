'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getStoredConfig,
  setStoredConfig,
  getDefaultConfig,
  type DemoBusinessConfig,
} from '@/src/lib/demo-config';

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<DemoBusinessConfig>(getDefaultConfig());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredConfig();
    if (stored) setConfig(stored);
  }, []);

  const update = (partial: Partial<DemoBusinessConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const updateService = (index: number, field: 'name' | 'price' | 'tipo' | 'duracionEstimada', value: string | number) => {
    setConfig((prev) => {
      const next = [...prev.services];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, services: next };
    });
    setSaved(false);
  };

  const addService = () => {
    setConfig((prev) => ({
      ...prev,
      services: [...prev.services, { name: '', price: '', tipo: 'Barbería', duracionEstimada: 30 }],
    }));
    setSaved(false);
  };

  const removeService = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
    setSaved(false);
  };

  const save = () => {
    setStoredConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ coverUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const syncGoogle = () => {
    alert('Sincronización con Google Calendar: en producción aquí se conectaría la API de Google. Por ahora es un placeholder.');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white font-['Inter',sans-serif]">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm text-slate-400 hover:text-emerald-400 transition"
            >
              Panel
            </Link>
            <Link
              href="/demo/barber"
              className="text-sm text-slate-400 hover:text-emerald-400 transition"
            >
              ← Volver a la demo
            </Link>
          </div>
          <button
            type="button"
            onClick={save}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition"
          >
            {saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>

        <div
          className="rounded-2xl p-6 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <h1 className="text-xl font-bold text-white/95">Configuración del negocio</h1>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/50 shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full bg-slate-700/80 flex items-center justify-center text-2xl font-bold text-blue-400"
                  style={{
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                  }}
                >
                  A
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="text-sm text-slate-400 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500/30 file:text-blue-300 file:font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Foto de portada</label>
            <div className="rounded-xl overflow-hidden bg-slate-800/50 h-32 flex items-center justify-center">
              {config.coverUrl ? (
                <img
                  src={config.coverUrl}
                  alt="Portada"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-500 text-sm">Sin imagen</span>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="mt-2 text-sm text-slate-400 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500/30 file:text-blue-300 file:font-medium"
            />
            <p className="text-xs text-slate-500 mt-1">O pega una URL en el campo Dirección / mapa más abajo si usas imagen externa.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Nombre del local</label>
            <input
              type="text"
              value={config.businessName}
              onChange={(e) => update({ businessName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Agentia Barber"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Dirección (texto)</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => update({ address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Mérida, Yucatán"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Enlace de Google Maps</label>
            <input
              type="url"
              value={config.mapUrl}
              onChange={(e) => update({ mapUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.google.com/maps/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Horario (días y horas)</label>
            <input
              type="text"
              value={config.schedule}
              onChange={(e) => update({ schedule: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Lunes a Sábado 9:00 - 20:00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Capacidad simultánea</label>
            <input
              type="number"
              min={1}
              max={20}
              value={config.capacidadSimultanea}
              onChange={(e) => update({ capacidadSimultanea: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: 2 (barberos)"
            />
            <p className="text-xs text-slate-500 mt-1">Número de citas que pueden atenderse al mismo tiempo (ej. 2 barberos = 2).</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-400">Servicios y precios</label>
              <button
                type="button"
                onClick={addService}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                + Añadir servicio
              </button>
            </div>
            <div className="space-y-3">
              {config.services.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-2 items-center p-3 rounded-xl bg-slate-800/50 border border-white/5"
                >
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateService(i, 'name', e.target.value)}
                    placeholder="Servicio"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={s.price}
                    onChange={(e) => updateService(i, 'price', e.target.value)}
                    placeholder="Precio"
                    className="w-20 px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={s.tipo || 'Barbería'}
                    onChange={(e) => updateService(i, 'tipo', e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Barbería">Barbería</option>
                    <option value="Estética">Estética</option>
                    <option value="Uñas">Uñas</option>
                    <option value="Infantil">Infantil</option>
                  </select>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={s.duracionEstimada ?? 30}
                    onChange={(e) => updateService(i, 'duracionEstimada', parseInt(e.target.value, 10) || 30)}
                    placeholder="Min"
                    title="Duración en minutos"
                    className="w-14 px-2 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="p-2 text-slate-400 hover:text-red-400 transition"
                    aria-label="Quitar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={syncGoogle}
              className="w-full py-3 rounded-xl font-semibold text-sm transition border border-blue-500/50 text-blue-300 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sincronizar con Google Calendar
            </button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Conecta tu cuenta de Google para ver las citas en tu calendario.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
