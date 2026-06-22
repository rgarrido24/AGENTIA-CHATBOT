'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import './anuario-flipbook.css';

const SALON_NOMBRES = [
  'Elías',
  'Fernanda',
  'Ana Pau',
  'Gabito',
  'Naty',
  'Fabio',
  'Matthías',
  'Luciana',
  'Amaia',
  'Cami',
  'Lia',
  'Kesleigh',
  'Sara',
  'Romina',
];

const LEGACY_TOTAL = 9;

function bitacoraTitulo(nombreCorto) {
  const n = (nombreCorto || '').trim().toLowerCase();
  const fem = ['fernanda', 'ana pau', 'naty', 'luciana', 'amaia', 'cami', 'lia', 'kesleigh', 'sara', 'romina'];
  return fem.includes(n) ? 'Bitácora de una Aventurera' : 'Bitácora de un Aventurero';
}

function LegacyPageContent({ index, alumno }) {
  const nombre = alumno.nombreCompleto || alumno.nombreCorto;
  const fotoGrad = alumno.fotos?.[0]?.url;
  const fotoPolaroid = alumno.fotos?.[1]?.url || alumno.fotos?.[0]?.url;
  const fotos = alumno.fotos || [];

  switch (index) {
    case 0:
      return (
        <div className="anuario-page-inner page-portada">
          <span className="cloud cloud-1">☁️</span>
          <span className="cloud cloud-2">☁️</span>
          <span className="cloud cloud-3">☁️</span>
          <p style={{ margin: 0, opacity: 0.9, fontWeight: 700 }}>🤠 ✨ 🚀</p>
          <h1 className="nombre">{nombre}</h1>
          <p className="anuario-sub" style={{ fontWeight: 800, fontSize: '1.15rem' }}>
            Mis Días de Aventura
          </p>
          <p className="anuario-sub" style={{ opacity: 0.9, marginBottom: '0.5rem' }}>
            Kinder 3 — Colegio Asbaje 2024-2025
          </p>
          {fotoGrad ? (
            <img src={fotoGrad} alt={nombre} className="foto-grad" />
          ) : (
            <div
              className="foto-grad"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.2)',
                fontSize: '3rem',
              }}
            >
              🎓
            </div>
          )}
        </div>
      );

    case 1:
      return (
        <div className="anuario-page-inner page-bienvenida">
          <div className="emoji-row">🤠 🧸 ⭐ 🚀 👢</div>
          <h2 className="anuario-title" style={{ color: '#FFD600', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
            Querido Aventurero
          </h2>
          <p className="anuario-sub" style={{ fontSize: '1.1rem', lineHeight: 1.65 }}>
            ¡Al infinito y más allá! Wow, ya creciste amigo... ¡Felicidades generación 2024-2025!
          </p>
        </div>
      );

    case 2:
      return (
        <div className="anuario-page-inner page-bitacora">
          <div className="polaroid">
            {fotoPolaroid ? (
              <img src={fotoPolaroid} alt={alumno.nombreCorto} />
            ) : (
              <div
                style={{
                  aspectRatio: '1',
                  background: '#eee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                }}
              >
                📷
              </div>
            )}
            <p style={{ textAlign: 'center', margin: '0.5rem 0 0', fontWeight: 800, color: '#1565C0' }}>
              {alumno.nombreCorto}
            </p>
          </div>
          <div>
            <h2 className="anuario-title" style={{ color: '#1565C0', fontSize: '1.25rem' }}>
              {bitacoraTitulo(alumno.nombreCorto)}
            </h2>
            <dl className="pergamino">
              <dt>🚒 Sueño de grande</dt>
              <dd>{alumno.suenioDeGrande || '—'}</dd>
              <dt>🍕 Comida favorita</dt>
              <dd>{alumno.comidaFavorita || '—'}</dd>
              <dt>🎨 Color favorito</dt>
              <dd>{alumno.colorFavorito || '—'}</dd>
              <dt>👫 Mejores amigos</dt>
              <dd>{alumno.mejorAmigo || '—'}</dd>
              <dt>💬 Frase favorita</dt>
              <dd>{alumno.fraseFavorita || '—'}</dd>
              <dt>⭐ Lo que más le gustó del kinder</dt>
              <dd>{alumno.loQueMasLeGusto || '—'}</dd>
            </dl>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="anuario-page-inner page-guardianas">
          <h2 className="anuario-title" style={{ color: '#1565C0' }}>
            Nuestras Guardianas
          </h2>
          <div className="guardianas-grid">
            {['Miss Vale', 'Miss Paty', 'Magaly'].map((name) => (
              <div key={name} className="guardiana-card">
                <div className="icon">👩‍🏫</div>
                <strong>{name}</strong>
              </div>
            ))}
          </div>
          <p className="anuario-sub" style={{ marginTop: '1.25rem', color: '#666', fontWeight: 600 }}>
            Gracias por guiarnos en cada misión
          </p>
        </div>
      );

    case 4:
      return (
        <div className="anuario-page-inner page-maestra">
          <h2 className="anuario-title" style={{ color: '#1565C0' }}>
            Mensaje de la Maestra
          </h2>
          <p className="anuario-sub">
            ¡Nuestra primera gran misión está cumplida! Hoy cerramos una etapa herosa llena de aprendizajes,
            risas y aventuras. Cada uno de ustedes lleva en el corazón la magia de estos años en el kinder.
            <br />
            <br />
            ¡Al infinito y más allá! 🤠🧸
          </p>
        </div>
      );

    case 5:
      return (
        <div className="anuario-page-inner page-mision">
          <h2 className="titulo-ts">MISIÓN COMPLETADA</h2>
          <p style={{ fontWeight: 800, margin: '0.5rem 0' }}>Generación 2024-2025</p>
          <div className="foto-grupal-placeholder">👨‍👩‍👧‍👦 📸</div>
          <div className="nombres-lista">
            {SALON_NOMBRES.map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      );

    case 6:
      return (
        <div className="anuario-page-inner page-recuerdos">
          <h2 className="anuario-title" style={{ color: '#1565C0' }}>
            Recuerdos de Nuestra Misión
          </h2>
          {fotos.length > 0 ? (
            <div className="fotos-grid">
              {fotos.map((f, i) => (
                <a key={f.publicId || i} href={f.url} target="_blank" rel="noopener noreferrer">
                  <img src={f.url} alt={`Recuerdo ${i + 1}`} />
                </a>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666', marginTop: '1rem' }}>Aún no hay fotos en este anuario.</p>
          )}
        </div>
      );

    case 7:
      return (
        <div className="anuario-page-inner page-comando">
          <h2 className="anuario-title" style={{ color: '#FFD600' }}>
            Mensaje del Comando Estelar
          </h2>
          <div className="etch-grid">
            <div className="etch-card">
              <h4>💜 Mamá</h4>
              <p>{alumno.dedicatoriaMama || '—'}</p>
            </div>
            <div className="etch-card">
              <h4>💙 Papá</h4>
              <p>{alumno.dedicatoriaPapa || '—'}</p>
            </div>
          </div>
        </div>
      );

    case 8:
      return (
        <div className="anuario-page-inner page-despedida">
          <h2 className="anuario-title" style={{ color: '#FFD600', fontSize: 'clamp(1.2rem, 3.5vw, 1.75rem)' }}>
            ¡Hasta Siempre, Generación 2024-2025!
          </h2>
          <div className="nombres-lista nombres-colores" style={{ fontSize: '1rem' }}>
            {SALON_NOMBRES.map((n) => (
              <span key={n} style={{ background: 'transparent', fontWeight: 900 }}>
                {n}
              </span>
            ))}
          </div>
          <div className="pelota-ts">🔴⭐</div>
        </div>
      );

    default:
      return null;
  }
}

function FlipbookShell({ totalPages, imageMode, renderPage }) {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [flipDir, setFlipDir] = useState(0);
  const touchStartX = useRef(null);

  const go = useCallback(
    (next) => {
      if (animating || next < 0 || next >= totalPages || next === page) return;
      setFlipDir(next > page ? 1 : -1);
      setAnimating(true);
      setTimeout(() => {
        setPage(next);
        setAnimating(false);
        setFlipDir(0);
      }, 650);
    },
    [animating, page, totalPages]
  );

  const prev = () => go(page - 1);
  const next = () => go(page + 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(page - 1);
      if (e.key === 'ArrowRight') go(page + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, page]);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 55) go(page - 1);
    else if (diff < -55) go(page + 1);
    touchStartX.current = null;
  };

  const pageClass = (i) => {
    if (i === page && !animating) return 'anuario-page is-current';
    if (animating && i === page && flipDir === 1) return 'anuario-page is-flip-out-forward';
    if (animating && i === page && flipDir === -1) return 'anuario-page is-flip-out-back';
    if (animating && flipDir === 1 && i === page + 1) return 'anuario-page is-current';
    if (animating && flipDir === -1 && i === page - 1) return 'anuario-page is-current';
    if (i === page) return 'anuario-page is-current';
    return 'anuario-page is-hidden';
  };

  const viewerClass = imageMode ? 'anuario-viewer anuario-viewer--images' : 'anuario-viewer';
  const navClass = imageMode ? 'anuario-nav-btn anuario-nav-btn--minimal' : 'anuario-nav-btn';
  const indicatorClass = imageMode ? 'anuario-indicator anuario-indicator--top-right' : 'anuario-indicator';

  return (
    <div className={viewerClass} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className={`anuario-stage-wrap${imageMode ? ' anuario-stage-wrap--images' : ''}`}>
        <button
          type="button"
          className={`${navClass} prev`}
          onClick={prev}
          disabled={page === 0 || animating}
          aria-label="Página anterior"
        >
          ‹
        </button>

        <div className={`anuario-stage${imageMode ? ' anuario-stage--images' : ''}`}>
          {Array.from({ length: totalPages }, (_, i) => (
            <div key={i} className={`${pageClass(i)}${imageMode ? ' anuario-page--image' : ''}`}>
              {renderPage(i)}
            </div>
          ))}
        </div>

        <button
          type="button"
          className={`${navClass} next`}
          onClick={next}
          disabled={page === totalPages - 1 || animating}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>

      <div className={indicatorClass}>
        {page + 1} / {totalPages}
      </div>
    </div>
  );
}

export default function AnuarioFlipbook({ alumno }) {
  const paginasAnuario = (alumno.paginasAnuario || []).filter(
    (url) => typeof url === 'string' && url.trim()
  );

  if (paginasAnuario.length > 0) {
    return (
      <FlipbookShell
        totalPages={paginasAnuario.length}
        imageMode
        renderPage={(i) => (
          <div className="anuario-page-inner anuario-page-image">
            <img src={paginasAnuario[i]} alt={`Página ${i + 1}`} draggable={false} />
          </div>
        )}
      />
    );
  }

  return (
    <FlipbookShell
      totalPages={LEGACY_TOTAL}
      imageMode={false}
      renderPage={(i) => <LegacyPageContent index={i} alumno={alumno} />}
    />
  );
}
