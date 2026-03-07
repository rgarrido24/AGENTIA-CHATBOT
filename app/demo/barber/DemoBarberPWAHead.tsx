'use client';

import { useEffect } from 'react';

/**
 * Añade meta tags PWA para "Añadir a pantalla de inicio" en iOS.
 * theme-color se configura via viewport en el layout.
 */
export default function DemoBarberPWAHead() {
  useEffect(() => {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0f172a';
      document.head.appendChild(meta);
    } else {
      themeColor.setAttribute('content', '#0f172a');
    }

    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
    if (!appleCapable) {
      appleCapable = document.createElement('meta');
      appleCapable.setAttribute('name', 'apple-mobile-web-app-capable');
      document.head.appendChild(appleCapable);
    }
    appleCapable.setAttribute('content', 'yes');

    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.setAttribute('content', 'black-translucent');

    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleIcon);
    }
    appleIcon.setAttribute('href', '/logo-agentia-2026.png');
  }, []);
  return null;
}
