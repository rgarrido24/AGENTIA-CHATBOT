'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLucianoPortalThemeOptional } from './LucianoPortalTheme';

type Formulario = { formId: string; formName: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AddClientModal({ resellerId }: { resellerId: string }) {
  const router = useRouter();
  const themeCtx = useLucianoPortalThemeOptional();
  const light = themeCtx?.light ?? false;
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const [nombre,         setNombre]         = useState('');
  const [negocio,        setNegocio]        = useState('');
  const [telefono,       setTelefono]       = useState('');
  const [email,          setEmail]          = useState('');
  const [alertNumber,    setAlertNumber]    = useState('');
  const [forms,          setForms]          = useState<Formulario[]>([{ formId: '', formName: '' }]);
  const [tempPassword,   setTempPassword]   = useState('');

  function addForm() { setForms((f) => [...f, { formId: '', formName: '' }]); }
  function removeForm(i: number) { setForms((f) => f.filter((_, idx) => idx !== i)); }
  function updateForm(i: number, field: keyof Formulario, val: string) {
    setForms((f) => f.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  function reset() {
    setNombre(''); setNegocio(''); setTelefono(''); setEmail(''); setAlertNumber('');
    setForms([{ formId: '', formName: '' }]); setError(''); setTempPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${resellerId}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, negocio, telefono, email, alertNumber,
          formularios: forms.filter((f) => f.formId.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
      if (data.temporalPassword) setTempPassword(data.temporalPassword);
      else { reset(); setOpen(false); router.refresh(); }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = light
    ? {
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        color: '#0f172a',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        width: '100%',
        outline: 'none',
      }
    : {
        background: '#111',
        border: '1px solid #2a2a2a',
        color: '#fff',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        width: '100%',
        outline: 'none',
      };
  const labelStyle: React.CSSProperties = {
    color: light ? '#475569' : '#666',
    fontSize: 11,
    display: 'block',
    marginBottom: 5,
  };

  const addBtnBg = light ? '#ecfdf5' : '#0d2200';
  const addBtnColor = light ? '#047857' : '#22c55e';
  const addBtnBorder = light ? '#a7f3d0' : '#1a4400';
  const overlayBg = light ? 'rgba(15,23,42,0.35)' : 'rgba(0,0,0,0.85)';
  const panelBg = light ? '#ffffff' : '#0d0d0d';
  const panelBorder = light ? 'rgba(15,23,42,0.12)' : '#222';
  const headBorder = light ? 'rgba(15,23,42,0.08)' : '#1a1a1a';
  const titleColor = light ? '#0f172a' : '#fff';
  const closeColor = light ? '#64748b' : '#444';
  const hintColor = light ? '#64748b' : '#666';
  const slugMuted = light ? '#94a3b8' : '#444';
  const slugHi = light ? '#475569' : '#555';
  const pwdBoxBg = light ? '#f0fdf4' : '#0d1f00';
  const pwdBoxBorder = light ? '#86efac' : '#CCFF0044';
  const pwdBoxText = light ? '#166534' : '#CCFF00';
  const pathColor = light ? '#475569' : '#778';
  const errBg = light ? '#fef2f2' : '#1a0000';
  const cancelBg = light ? '#f1f5f9' : '#111';
  const cancelColor = light ? '#475569' : '#555';
  const cancelBorder = light ? '#cbd5e1' : '#222';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
        style={{ background: addBtnBg, color: addBtnColor, border: `1px solid ${addBtnBorder}` }}
      >
        + Agregar cliente
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: overlayBg }}
          onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); reset(); } }}
        >
          <div
            className="w-full max-w-md rounded-2xl border overflow-y-auto shadow-xl"
            style={{ background: panelBg, borderColor: panelBorder, maxHeight: '90vh' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: headBorder }}>
              <p className="text-sm font-bold" style={{ color: titleColor }}>Nuevo cliente</p>
              <button onClick={() => { setOpen(false); reset(); }} style={{ color: closeColor, fontSize: 18 }}>✕</button>
            </div>

            {/* Password reveal screen — shown after successful creation */}
            {tempPassword && (
              <div className="px-5 py-6 text-center space-y-4">
                <div className="text-3xl">🔑</div>
                <p className="text-sm font-bold" style={{ color: titleColor }}>Cliente creado</p>
                <p className="text-xs" style={{ color: hintColor }}>
                  Contraseña temporal generada. Compártela con el cliente.
                </p>
                <div
                  className="rounded-xl px-4 py-3 text-center font-mono text-lg font-bold tracking-widest select-all"
                  style={{ background: pwdBoxBg, border: `1px solid ${pwdBoxBorder}`, color: pwdBoxText }}
                >
                  {tempPassword}
                </div>
                <p className="text-xs" style={{ color: slugMuted }}>
                  El cliente ingresa en{' '}
                  <span style={{ color: pathColor }}>
                    /portal/{resellerId}/cliente/{slugify(nombre)}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => { reset(); setOpen(false); router.refresh(); }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: '#CCFF00', color: '#000' }}
                >
                  Listo
                </button>
              </div>
            )}

            {!tempPassword && (
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label style={labelStyle}>Nombre del cliente *</label>
                <input style={inputStyle} value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej: Juan García" />
                {nombre && (
                  <p className="text-[10px] mt-1" style={{ color: slugMuted }}>
                    Slug: <span style={{ color: slugHi }}>{slugify(nombre)}</span>
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Nombre del negocio *</label>
                <input style={inputStyle} value={negocio} onChange={(e) => setNegocio(e.target.value)} required placeholder="Ej: Servicios financieros Córdoba" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input style={inputStyle} value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="5493511234567" />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@mail.com" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Número de alerta WhatsApp</label>
                <input style={inputStyle} value={alertNumber} onChange={(e) => setAlertNumber(e.target.value)} placeholder="5493511234567" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Formularios de Meta</label>
                  <button type="button" onClick={addForm} className="text-[11px]" style={{ color: addBtnColor }}>+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {forms.map((f, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <input
                          style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }}
                          value={f.formId}
                          onChange={(e) => updateForm(i, 'formId', e.target.value)}
                          placeholder="Form ID"
                        />
                        <input
                          style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }}
                          value={f.formName}
                          onChange={(e) => updateForm(i, 'formName', e.target.value)}
                          placeholder="Nombre del formulario"
                        />
                      </div>
                      {forms.length > 1 && (
                        <button type="button" onClick={() => removeForm(i)} style={{ color: slugHi, marginTop: 6, fontSize: 16 }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: errBg, color: '#ef4444' }}>{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm transition"
                  style={{ background: cancelBg, color: cancelColor, border: `1px solid ${cancelBorder}` }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !nombre || !negocio}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40"
                  style={{ background: '#22c55e', color: '#000' }}
                >
                  {loading ? 'Guardando…' : 'Guardar cliente'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
