'use client';

import { useState, useEffect } from 'react';
import {
  getStoredConfig,
  getDefaultConfig,
  type DemoBusinessConfig,
} from '@/src/lib/demo-config';
import styles from './demo-barber.module.css';

export default function HeroPortada({ config: configProp }: { config?: DemoBusinessConfig }) {
  const [internal, setInternal] = useState<DemoBusinessConfig | null>(null);

  useEffect(() => {
    if (!configProp) {
      setInternal(getStoredConfig() || getDefaultConfig());
    }
  }, [configProp]);

  const config = configProp ?? internal;

  if (!config) return null;

  const openMaps = () => {
    window.open(config.mapUrl, '_blank');
  };

  return (
    <div className={styles.heroWrap}>
      <div
        className={styles.heroBg}
        style={{
          backgroundImage: config.coverUrl
            ? `url(${config.coverUrl})`
            : 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        }}
      />
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <div className={styles.heroLogo}>
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" />
          ) : (
            (config.businessName || 'A').charAt(0).toUpperCase()
          )}
        </div>
        <div className={styles.heroText}>
          <h2 className={styles.heroTitle}>{config.businessName || 'Mi Negocio'}</h2>
          <p className={styles.heroSub}>{config.address}</p>
          <p className={styles.heroSub} style={{ marginTop: 4 }}>
            Horario: {config.schedule}
          </p>
        </div>
        <button type="button" className={styles.heroBtn} onClick={openMaps}>
          UBICACIÓN
        </button>
      </div>
    </div>
  );
}
