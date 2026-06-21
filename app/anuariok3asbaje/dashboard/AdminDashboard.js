'use client'

import { useState } from 'react'
import { anuarioPath } from '@/lib/anuario-k3/paths'

export default function AdminDashboard({ alumnos }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const [buscando, setBuscando] = useState('')

  const enviados = alumnos.filter(a => a.formularioEnviado).length
  const pendientes = alumnos.length - enviados
  const filtrados = alumnos.filter(a =>
    a.nombreCorto.toLowerCase().includes(buscando.toLowerCase()) ||
    (a.nombreCompleto||'').toLowerCase().includes(buscando.toLowerCase())
  )

  const copiarLink = (token) => {
    const url = `${window.location.origin}${anuarioPath(`/formulario/${token}`)}`
    navigator.clipboard.writeText(url)
    alert('✅ Link copiado')
  }

  const descargarCSV = () => {
    const headers = ['Nombre','Nombre Completo','Tutor','Sueño','Comida','Color','Mejor Amigo','Frase','Le Gustó','Dedicatoria Mamá','Dedicatoria Papá','Fotos','Enviado']
    const rows = alumnos.map(a => [a.nombreCorto,a.nombreCompleto,a.nombreTutor,a.suenioDeGrande,a.comidaFavorita,a.colorFavorito,a.mejorAmigo,a.fraseFavorita,a.loQueMasLeGusto,a.dedicatoriaMama,a.dedicatoriaPapa,(a.fotos||[]).map(f=>f.url).join(' | '),a.formularioEnviado?'Sí':'No'])
    const csv = [headers,...rows].map(r=>r.map(c=>`"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href=url; a.download='anuario-k3.csv'; a.click()
  }

  const TEXT_DARK = '#1a1a1a'

  return (
    <div style={{ minHeight:'100vh', background:'#F0F4FF', fontFamily:"'Nunito',sans-serif" }}>
      <header style={{ background:'linear-gradient(135deg,#1B4F8A,#7C4DFF)', padding:'1.5rem 2rem', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Fredoka One',cursive", fontSize:'1.8rem', margin:0 }}>🎓 Dashboard Anuario K3</h1>
          <p style={{ margin:0, opacity:0.8, fontSize:'0.9rem' }}>Colegio Asbaje 2024-2025</p>
        </div>
        <button onClick={descargarCSV} style={{ background:'#FFD54F', color:'#1B4F8A', border:'none', padding:'0.6rem 1.2rem', borderRadius:'8px', fontWeight:'800', cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
          📥 Descargar CSV
        </button>
      </header>

      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'2rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[['👶',alumnos.length,'Total alumnos','#1B4F8A'],['✅',enviados,'Recibidos','#4CAF82'],['⏳',pendientes,'Pendientes','#FF7043']].map(([e,v,l,c])=>(
            <div key={l} style={{ background:'white', borderRadius:'16px', padding:'1.5rem', textAlign:'center', boxShadow:'0 2px 10px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize:'2rem' }}>{e}</div>
              <div style={{ fontSize:'2.5rem', fontWeight:'900', color:c, fontFamily:"'Fredoka One',cursive" }}>{v}</div>
              <div style={{ color:'#666', fontSize:'0.85rem', fontWeight:'600' }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'white', borderRadius:'12px', padding:'1rem 1.5rem', marginBottom:'2rem', boxShadow:'0 2px 10px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
            <span style={{ fontWeight:'700' }}>Progreso</span>
            <span style={{ color:'#4CAF82', fontWeight:'700' }}>{Math.round(enviados/alumnos.length*100)}%</span>
          </div>
          <div style={{ background:'#E0E0E0', borderRadius:'99px', height:'12px' }}>
            <div style={{ background:'linear-gradient(90deg,#4CAF82,#1B4F8A)', width:`${enviados/alumnos.length*100}%`, height:'100%', borderRadius:'99px' }} />
          </div>
        </div>

        <input
          style={{ width:'100%', padding:'0.8rem 1rem', borderRadius:'10px', border:'2px solid #E0E0E0', fontSize:'1rem', marginBottom:'1.5rem', fontFamily:"'Nunito',sans-serif", boxSizing:'border-box' }}
          placeholder="🔍 Buscar alumno..."
          value={buscando}
          onChange={e=>setBuscando(e.target.value)}
        />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
          {filtrados.map(alumno=>(
            <div key={alumno._id} style={{ background:'white', borderRadius:'16px', padding:'1.2rem', boxShadow:'0 2px 10px rgba(0,0,0,0.08)', border:`2px solid ${alumno.formularioEnviado?'#4CAF82':'#E0E0E0'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily:"'Fredoka One',cursive", fontSize:'1.3rem', color:'#1B4F8A', margin:0 }}>{alumno.nombreCorto}</h3>
                  {alumno.nombreCompleto && <p style={{ color:'#666', fontSize:'0.85rem', margin:'0.2rem 0 0' }}>{alumno.nombreCompleto}</p>}
                </div>
                <span style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'700', background:alumno.formularioEnviado?'#E8F5E9':'#FFF3E0', color:alumno.formularioEnviado?'#4CAF82':'#FF7043' }}>
                  {alumno.formularioEnviado?'✅ Listo':'⏳ Pendiente'}
                </span>
              </div>
              {alumno.formularioEnviado && (
                <div style={{ marginTop:'0.8rem', fontSize:'0.85rem', color:'#666' }}>
                  📸 {(alumno.fotos||[]).length} fotos · {alumno.fechaEnvio?new Date(alumno.fechaEnvio).toLocaleDateString('es-MX'):'—'}
                </div>
              )}
              <div style={{ marginTop:'0.8rem', display:'flex', gap:'0.5rem' }}>
                <button onClick={()=>copiarLink(alumno.token)} style={{ flex:1, padding:'0.4rem', borderRadius:'8px', background:'#F0F4FF', color:'#1B4F8A', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:'700', fontFamily:"'Nunito',sans-serif" }}>
                  🔗 Copiar link
                </button>
                <button onClick={()=>setSeleccionado(alumno)} style={{ flex:1, padding:'0.4rem', borderRadius:'8px', background:'#F0F4FF', color:'#7C4DFF', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:'700', fontFamily:"'Nunito',sans-serif" }}>
                  👁️ Ver datos
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {seleccionado && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }} onClick={()=>setSeleccionado(null)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'2rem', maxWidth:'600px', width:'100%', maxHeight:'80vh', overflowY:'auto', color: TEXT_DARK }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontFamily:"'Fredoka One',cursive", fontSize:'1.8rem', color:'#1B4F8A', margin:0 }}>{seleccionado.nombreCorto}</h2>
              <button onClick={()=>setSeleccionado(null)} style={{ background:'#F0F0F0', border:'none', borderRadius:'50%', width:'36px', height:'36px', cursor:'pointer', fontSize:'1.2rem' }}>×</button>
            </div>
            {!seleccionado.formularioEnviado ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'#FF7043' }}>
                <div style={{ fontSize:'3rem' }}>⏳</div>
                <p style={{ fontWeight:'700', marginTop:'1rem' }}>Formulario pendiente</p>
                <button onClick={()=>copiarLink(seleccionado.token)} style={{ marginTop:'1rem', padding:'0.7rem 1.5rem', borderRadius:'10px', background:'#1B4F8A', color:'white', border:'none', cursor:'pointer', fontWeight:'700', fontFamily:"'Nunito',sans-serif" }}>
                  🔗 Copiar link
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.8rem', marginBottom:'1.5rem' }}>
                  {[['Nombre completo',seleccionado.nombreCompleto],['Tutor',seleccionado.nombreTutor],['🚒 Sueño',seleccionado.suenioDeGrande],['🍕 Comida',seleccionado.comidaFavorita],['🎨 Color',seleccionado.colorFavorito],['👫 Mejor amigo',seleccionado.mejorAmigo],['💬 Frase',seleccionado.fraseFavorita||'—'],['⭐ Le gustó',seleccionado.loQueMasLeGusto]].map(([l,v])=>(
                    <div key={l} style={{ background:'#F8F9FF', borderRadius:'10px', padding:'0.8rem' }}>
                      <p style={{ color:'#666', fontSize:'0.75rem', margin:'0 0 0.2rem', fontWeight:'700', textTransform:'uppercase' }}>{l}</p>
                      <p style={{ margin:0, fontWeight:'600', color: TEXT_DARK }}>{v || '—'}</p>
                    </div>
                  ))}
                </div>
                {(seleccionado.dedicatoriaMama||seleccionado.dedicatoriaPapa) && (
                  <div style={{ marginBottom:'1.5rem' }}>
                    <h3 style={{ color:'#7C4DFF', marginBottom:'0.8rem' }}>💌 Dedicatorias</h3>
                    {seleccionado.dedicatoriaMama && <div style={{ background:'#FFF0FB', borderRadius:'10px', padding:'1rem', marginBottom:'0.5rem', color: TEXT_DARK }}><strong>Mamá:</strong> {seleccionado.dedicatoriaMama}</div>}
                    {seleccionado.dedicatoriaPapa && <div style={{ background:'#F0F8FF', borderRadius:'10px', padding:'1rem', color: TEXT_DARK }}><strong>Papá:</strong> {seleccionado.dedicatoriaPapa}</div>}
                  </div>
                )}
                {seleccionado.fotos?.length > 0 && (
                  <div>
                    <h3 style={{ color:'#FF7043', marginBottom:'0.8rem' }}>📸 Fotos ({seleccionado.fotos.length})</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                      {seleccionado.fotos.map((f,i)=>(
                        <a key={i} href={f.url} target="_blank" rel="noopener noreferrer">
                          <img src={f.url} alt={`Foto ${i+1}`} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'10px' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}