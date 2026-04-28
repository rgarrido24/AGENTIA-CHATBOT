import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Agentia — Chatbots con IA para negocios';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle green glow background */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)',
            top: -100,
            left: -100,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
            bottom: -100,
            right: -50,
          }}
        />

        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'rgba(34,197,94,0.15)',
              border: '1.5px solid rgba(34,197,94,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            🤖
          </div>
          <span
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: -2,
            }}
          >
            agentia
          </span>
          <span
            style={{
              fontSize: 18,
              color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.5)',
              borderRadius: 6,
              padding: '3px 10px',
              marginLeft: 4,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            .software
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 10,
            fontSize: 36,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.2,
            maxWidth: 860,
          }}
        >
          <span>Tu negocio automatizado en</span>
          <span style={{ color: '#22c55e' }}>WhatsApp</span>
        </div>

        {/* Sub tagline */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: 22,
            color: 'rgba(255,255,255,0.5)',
            marginTop: 20,
          }}
        >
          <span>Chatbots con IA · Agenda · Cobranza · CRM</span>
        </div>

        {/* Bottom divider */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 32,
            fontSize: 16,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <span>Barbería</span>
          <span>·</span>
          <span>Restaurante</span>
          <span>·</span>
          <span>Spa</span>
          <span>·</span>
          <span>Dentista</span>
          <span>·</span>
          <span>Médico</span>
          <span>·</span>
          <span>Taller</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
