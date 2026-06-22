'use client';

import { useEffect, useRef, useState } from 'react';
import './st-pageflip-viewer.css';

const PAGE_SOUND =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC';

function bookDimensions() {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  const pad = vw < 640 ? 24 : 48;
  let width = Math.min(800, vw - pad);
  let height = Math.round((width * 3) / 4);
  const maxH = vh - 88;
  if (height > maxH) {
    height = maxH;
    width = Math.round((height * 4) / 3);
  }
  return { width: Math.max(280, width), height: Math.max(360, height) };
}

export default function StPageFlipViewer({ pages, alumnoNombre }) {
  const shellRef = useRef(null);
  const bookRef = useRef(null);
  const flipRef = useRef(null);
  const soundRef = useRef(null);
  const soundOnRef = useRef(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    if (!bookRef.current || !pages?.length) return;

    let flip = null;
    let cancelled = false;

    (async () => {
      const { PageFlip } = await import('page-flip');
      if (cancelled || !bookRef.current) return;

      const { width, height } = bookDimensions();
      flip = new PageFlip(bookRef.current, {
        width,
        height,
        size: 'stretch',
        minWidth: 280,
        maxWidth: 1000,
        minHeight: 360,
        maxHeight: 1400,
        drawShadow: true,
        flippingTime: 900,
        usePortrait: true,
        startPage: 0,
        autoSize: true,
        maxShadowOpacity: 0.65,
        showCover: false,
        mobileScrollSupport: false,
      });

      flip.loadFromImages(pages);
      flip.on('flip', (e) => {
        setPageIndex(e.data);
        if (soundOnRef.current && soundRef.current) {
          soundRef.current.currentTime = 0;
          soundRef.current.play().catch(() => {});
        }
      });

      flipRef.current = flip;
      setPageIndex(flip.getCurrentPageIndex());
      setReady(true);
    })();

    const onResize = () => {
      flipRef.current?.update();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      flip?.destroy();
      flipRef.current = null;
    };
  }, [pages]);

  const flipPrev = () => flipRef.current?.flipPrev();
  const flipNext = () => flipRef.current?.flipNext();

  const toggleFullscreen = async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') flipPrev();
      if (e.key === 'ArrowRight') flipNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div ref={shellRef} className="stpf-shell">
      <div className="stpf-toolbar">
        <span className="stpf-title">{alumnoNombre ? `Anuario — ${alumnoNombre}` : 'Anuario'}</span>
        <span className="stpf-counter">
          {ready ? `${pageIndex + 1} / ${pages.length}` : `… / ${pages.length}`}
        </span>
        <div className="stpf-actions">
          <button type="button" className="stpf-btn" onClick={flipPrev} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="stpf-btn" onClick={flipNext} aria-label="Siguiente">
            ›
          </button>
          <button
            type="button"
            className={`stpf-btn stpf-btn-icon${soundOn ? ' is-on' : ''}`}
            onClick={() => setSoundOn((v) => !v)}
            title="Sonido de página"
            aria-label="Alternar sonido"
          >
            🔊
          </button>
          <button
            type="button"
            className="stpf-btn stpf-btn-icon"
            onClick={toggleFullscreen}
            title="Pantalla completa"
            aria-label="Pantalla completa"
          >
            ⛶
          </button>
        </div>
      </div>

      <div className="stpf-book-wrap">
        <div ref={bookRef} className="stpf-book" />
      </div>

      <audio ref={soundRef} src={PAGE_SOUND} preload="auto" />
    </div>
  );
}
