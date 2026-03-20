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
        sans: ['var(--font-jakarta)', 'var(--font-roboto)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-jakarta)', 'var(--font-montserrat)', 'system-ui', 'sans-serif'],
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
        'teal-glow':    'rgba(13,148,136,0.35)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0f1a 0%, #0f172a 50%, #1e293b 100%)',
      },
      boxShadow: {
        'glow-teal': '0 0 24px rgba(13,148,136,0.35)',
        'glow-teal-lg': '0 0 48px rgba(13,148,136,0.25)',
      },
    },
  },
  plugins: [],
};
