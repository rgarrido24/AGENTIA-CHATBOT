'use client'

import { useState, useRef } from 'react'
import { anuarioPath } from '@/lib/anuario-k3/paths'

const COLORES = ['Rojo','Naranja','Amarillo','Verde','Azul','Morado','Rosa','Blanco','Negro','Celeste','Café']

const TS = {
  blue: '#0D47A1',
  blueMid: '#1565C0', 
  blueLight: '#1E88E5',
  yellow: '#FFD600',
  yellowLight: '#FFEB3B',
  red: '#C62828',
  green: '#2E7D32',
  greenLight: '#43A047',
  cream: '#FFFDE7',
  dark: '#0A1628',
  white: '#FFFFFF',
}

export default function FormularioPapas({ alumno, token }) {
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [fotos, setFotos] = useState([])
  const [subiendoFotos, setSubiendoFotos] = useState(false)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    nombreCompleto:'', nombreTutor:'', suenioDeGrande:'',
    comidaFavorita:'', colorFavorito:'', mejorAmigo:'',
    fraseFavorita:'', loQueMasLeGusto:'', dedicatoriaMama:'', dedicatoriaPapa:'',
  })

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleFotos = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setSubiendoFotos(true)
    setError('')
    try {
      const nuevas = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('token', token)
        const res = await fetch(anuarioPath('/api/upload'), { method:'POST', body:fd })
        const data = await res.json()
        if (data.url) nuevas.push({ url:data.url, publicId:data.publicId })
      }
      setFotos(p => [...p, ...nuevas])
    } catch { setError('Error al subir fotos.') }
    finally { setSubiendoFotos(false) }
  }

  const handleSubmit = async () => {
    if (fotos.length < 1) { setError('Sube al menos 1 foto.'); return }
    setEnviando(true); setError('')
    try {
      const res = await fetch(anuarioPath('/api/formulario'), {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token, ...form, fotos }),
      })
      const data = await res.json()
      if (data.ok) setEnviado(true)
      else setError(data.error || 'Error al enviar.')
    } catch { setError('Error de conexión.') }
    finally { setEnviando(false) }
  }

  if (enviado) return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${TS.dark} 0%, ${TS.blue} 60%, ${TS.green} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'system-ui,sans-serif', padding:'2rem' }}>
      <div style={{ textAlign:'center', color:'white', maxWidth:'480px' }}>
        <div style={{ fontSize:'5rem', marginBottom:'1rem' }}>🚀</div>
        <h1 style={{ fontSize:'2.8rem', fontWeight:'900', margin:'0 0 1rem', background:`linear-gradient(135deg, ${TS.yellow}, ${TS.yellowLight})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          ¡Al infinito y más allá!
        </h1>
        <p style={{ fontSize:'1.2rem', opacity:0.9, lineHeight:1.6 }}>
          Recibimos todo de <strong>{alumno.nombreCorto}</strong>.<br/>¡El anuario va a quedar increíble! ✨
        </p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg, ${TS.dark} 0%, #0D2137 100%)`, fontFamily:'system-ui,-apple-system,sans-serif' }}>
      
      {/* Hero Header */}
      <div style={{ background:`linear-gradient(135deg, ${TS.blue} 0%, ${TS.dark} 100%)`, padding:'2rem 1.5rem 3rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'200px', height:'200px', background:TS.yellow, borderRadius:'50%', opacity:0.05 }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'150px', height:'150px', background:TS.green, borderRadius:'50%', opacity:0.08 }} />
        
        <div style={{ position:'relative', zIndex:1, maxWidth:'600px', margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'1rem' }}>
            <span style={{ fontSize:'2rem' }}>🎓</span>
            <div>
              <p style={{ color:TS.yellow, fontWeight:'700', fontSize:'0.8rem', letterSpacing:'0.15em', textTransform:'uppercase', margin:0 }}>Colegio Asbaje · Kinder 3</p>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.75rem', margin:0 }}>Generación 2024-2025</p>
            </div>
          </div>
          
          <h1 style={{ color:'white', fontSize:'2rem', fontWeight:'900', margin:'0 0 0.3rem', lineHeight:1.2 }}>
            Anuario de{' '}
            <span style={{ color:TS.yellow }}>{alumno.nombreCorto}</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.95rem', margin:'0 0 1.5rem' }}>
            Mis días de aventura 🌟
          </p>

          {/* Progress */}
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            {[1,2,3,4].map(p => (
              <div key={p} style={{ flex:1, height:'4px', borderRadius:'99px', background: p < paso ? TS.green : p === paso ? TS.yellow : 'rgba(255,255,255,0.15)', transition:'all 0.4s' }} />
            ))}
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.78rem', marginTop:'0.5rem' }}>Paso {paso} de 4</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:'600px', margin:'0 auto', padding:'1.5rem' }}>

        {paso===1 && (
          <Card title="¿Quiénes son?" subtitle="Cuéntanos sobre el aventurero">
            <Field label="Nombre completo del alumno" required>
              <Input placeholder="Ej: Amaia Garrido Cárdenas" value={form.nombreCompleto} onChange={v=>update('nombreCompleto',v)} />
            </Field>
            <Field label="Nombre de mamá, papá o tutor" required>
              <Input placeholder="Ej: Edurne Cárdenas Rodríguez" value={form.nombreTutor} onChange={v=>update('nombreTutor',v)} />
            </Field>
            {error && <ErrorMsg msg={error} />}
            <Btn onClick={()=>{ if(!form.nombreCompleto||!form.nombreTutor){setError('Completa ambos campos.');return} setError('');setPaso(2) }}>Continuar →</Btn>
          </Card>
        )}

        {paso===2 && (
          <Card title={`Conociendo a ${alumno.nombreCorto}`} subtitle="Sus cosas favoritas para el anuario">
            {[
              ['suenioDeGrande','🚀 ¿Qué quiere ser de grande?','Bombero, doctora, astronauta...'],
              ['comidaFavorita','🍕 Comida favorita','Pizza, hot dog, tacos...'],
              ['mejorAmigo','👯 Mejor amigo o amiga','Sarita, Fer, Diego...'],
              ['fraseFavorita','💬 Frase que siempre dice','¡Yo puedo!, ¡Dime verdad!...'],
              ['loQueMasLeGusto','⭐ Lo que más le gustó del kinder','Jugar con mis amigos...'],
            ].map(([f,l,p])=>(
              <Field key={f} label={l} required={f!=='fraseFavorita'}>
                <Input placeholder={p} value={form[f]} onChange={v=>update(f,v)} />
              </Field>
            ))}
            <Field label="🎨 Color favorito" required>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'8px' }}>
                {COLORES.map(c=>(
                  <button key={c} type="button" onClick={()=>update('colorFavorito',c)} style={{ padding:'6px 16px', borderRadius:'99px', border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600', transition:'all 0.2s', background: form.colorFavorito===c ? TS.yellow : 'rgba(255,255,255,0.08)', color: form.colorFavorito===c ? TS.dark : 'rgba(255,255,255,0.7)' }}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            {error && <ErrorMsg msg={error} />}
            <div style={{ display:'flex', gap:'12px' }}>
              <BtnBack onClick={()=>{setError('');setPaso(1)}} />
              <Btn onClick={()=>{ if(!form.suenioDeGrande||!form.comidaFavorita||!form.colorFavorito||!form.mejorAmigo||!form.loQueMasLeGusto){setError('Completa todos los campos.');return} setError('');setPaso(3) }}>Continuar →</Btn>
            </div>
          </Card>
        )}

        {paso===3 && (
          <Card title="Mensaje especial" subtitle={`Escríbele algo a ${alumno.nombreCorto} para su anuario`}>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem', marginBottom:'1.5rem' }}>Máximo 280 caracteres. Aparecerá en su página del anuario. 💖</p>
            {[['dedicatoriaMama','💜 Mensaje de mamá'],['dedicatoriaPapa','💙 Mensaje de papá']].map(([f,l])=>(
              <Field key={f} label={l}>
                <textarea
                  placeholder="Ej: Mi niño hermoso, cada día me haces más feliz..."
                  value={form[f]}
                  maxLength={280}
                  onChange={e=>update(f,e.target.value)}
                  style={{ width:'100%', padding:'1rem', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white', fontSize:'0.95rem', fontFamily:'system-ui,sans-serif', resize:'vertical', minHeight:'90px', outline:'none', boxSizing:'border-box' }}
                />
                <p style={{ textAlign:'right', fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', marginTop:'4px' }}>{form[f].length}/280</p>
              </Field>
            ))}
            <div style={{ display:'flex', gap:'12px' }}>
              <BtnBack onClick={()=>{setError('');setPaso(2)}} />
              <Btn onClick={()=>{setError('');setPaso(4)}}>Continuar →</Btn>
            </div>
          </Card>
        )}

        {paso===4 && (
          <Card title="Fotos de recuerdo" subtitle="Las mejores fotos del año en el kinder">
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.9rem', marginBottom:'1.5rem' }}>Sube al menos <strong style={{color:TS.yellow}}>2 fotos</strong> — de eventos, graduación, con amigos, lo que más les guste 📸</p>
            
            <div onClick={()=>fileInputRef.current?.click()} style={{ border:`2px dashed ${subiendoFotos ? TS.yellow : 'rgba(255,255,255,0.15)'}`, borderRadius:'16px', padding:'2.5rem 1rem', textAlign:'center', cursor:'pointer', background:'rgba(255,255,255,0.03)', marginBottom:'1.5rem', transition:'all 0.3s' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{subiendoFotos ? '⏳' : '📁'}</div>
              <p style={{ color: subiendoFotos ? TS.yellow : 'rgba(255,255,255,0.6)', fontWeight:'600', margin:'0 0 0.3rem' }}>
                {subiendoFotos ? 'Subiendo fotos...' : 'Toca para subir fotos'}
              </p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.8rem', margin:0 }}>JPG, PNG · Puedes seleccionar varias</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleFotos} disabled={subiendoFotos} />
            </div>

            {fotos.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'1rem' }}>
                {fotos.map((f,i)=>(
                  <div key={i} style={{ position:'relative', borderRadius:'12px', overflow:'hidden' }}>
                    <img src={f.url} alt="" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', display:'block' }} />
                    <button onClick={()=>setFotos(p=>p.filter((_,idx)=>idx!==i))} style={{ position:'absolute', top:'6px', right:'6px', background:'rgba(0,0,0,0.7)', color:'white', border:'none', borderRadius:'50%', width:'26px', height:'26px', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ color: fotos.length >= 2 ? TS.green : 'rgba(255,255,255,0.4)', fontSize:'0.88rem', marginBottom:'1.5rem', fontWeight:'600' }}>
              {fotos.length >= 2 ? `✅ ${fotos.length} fotos listas` : `📷 ${fotos.length} foto${fotos.length!==1?'s':''} (mínimo 2)`}
            </p>

            {error && <ErrorMsg msg={error} />}
            <div style={{ display:'flex', gap:'12px' }}>
              <BtnBack onClick={()=>{setError('');setPaso(3)}} />
              <button onClick={handleSubmit} disabled={enviando||subiendoFotos} style={{ flex:1, padding:'1rem', borderRadius:'12px', background: fotos.length>=1 ? `linear-gradient(135deg, ${TS.green}, ${TS.greenLight})` : 'rgba(255,255,255,0.1)', color:'white', border:'none', cursor: fotos.length>=1 ? 'pointer' : 'not-allowed', fontSize:'1rem', fontWeight:'800', fontFamily:'system-ui,sans-serif', transition:'all 0.2s' }}>
                {enviando ? '⏳ Enviando...' : '🚀 ¡Enviar todo!'}
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(10px)', borderRadius:'20px', padding:'1.8rem', border:'1px solid rgba(255,255,255,0.08)', marginTop:'1.5rem' }}>
      <h2 style={{ color:'white', fontSize:'1.4rem', fontWeight:'900', margin:'0 0 0.3rem' }}>{title}</h2>
      <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.88rem', margin:'0 0 1.5rem' }}>{subtitle}</p>
      {children}
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom:'1.2rem' }}>
      <label style={{ display:'block', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem', fontWeight:'600', marginBottom:'6px', letterSpacing:'0.02em' }}>
        {label} {required && <span style={{ color:'#FF6B6B' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ placeholder, value, onChange }) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={e=>onChange(e.target.value)}
      style={{ width:'100%', padding:'0.9rem 1rem', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.05)', color:'white', fontSize:'0.95rem', fontFamily:'system-ui,sans-serif', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
    />
  )
}

function Btn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ flex:1, width:'100%', padding:'1rem', borderRadius:'12px', background:`linear-gradient(135deg, #1565C0, #1E88E5)`, color:'white', border:'none', cursor:'pointer', fontSize:'1rem', fontWeight:'800', fontFamily:'system-ui,sans-serif', marginTop:'0.5rem' }}>
      {children}
    </button>
  )
}

function BtnBack({ onClick }) {
  return (
    <button onClick={onClick} style={{ padding:'1rem 1.2rem', borderRadius:'12px', background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontSize:'1rem', fontFamily:'system-ui,sans-serif' }}>
      ←
    </button>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ background:'rgba(198,40,40,0.15)', border:'1px solid rgba(198,40,40,0.3)', borderRadius:'10px', padding:'0.8rem 1rem', marginBottom:'1rem', color:'#FF6B6B', fontSize:'0.88rem' }}>
      ⚠️ {msg}
    </div>
  )
}