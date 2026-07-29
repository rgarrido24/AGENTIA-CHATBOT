/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-jakarta)', 'var(--font-roboto)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-space)', 'var(--font-jakarta)', 'var(--font-montserrat)', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        /* Futuristic Dark — palette principal */
        luxury: '#0a0f1a',       /* Navy oscuro (era negro puro) */
        forest: '#0d9488',       /* Teal primario (era verde bosque) */
        sage:   '#5eead4',       /* Teal claro (era verde salvia) */
        /* Tokens adicionales */
        'dark-mid':  '#0f172a',
        'dark-high': '#1e293b',
        'glass-border': 'rgba(255,255,255,0.08)',
        'agentia-cyan': '#00D4FF',
        'agentia-gold': '#FFD700',
        'agentia-bg': '#0a0a0a',
        /* Pakalitos Fest demo */
        ink: {
          DEFAULT: '#10261c',
          soft: '#1a3a2b',
          mist: '#2d5240',
        },
        limestone: {
          DEFAULT: '#f3eee4',
          deep: '#e7dfd0',
          line: '#d5cdb8',
        },
        fest: {
          DEFAULT: '#e8a117',
          deep: '#c47d0a',
          soft: '#f7d48a',
        },
        coral: {
          DEFAULT: '#e85d4c',
          soft: '#f8c9c2',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #1e293b 100%)',
      },
      boxShadow: {
        'glow-teal': '0 0 24px rgba(13,148,136,0.35)',
        'glow-teal-lg': '0 0 48px rgba(13,148,136,0.25)',
        card: '0 12px 40px rgba(16, 38, 28, 0.08)',
        lift: '0 18px 50px rgba(16, 38, 28, 0.14)',
      },
    },
  },
  plugins: [],
};
